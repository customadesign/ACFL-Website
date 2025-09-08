import { supabase } from '../lib/supabase';
import stripe, { 
  createConnectedAccount, 
  createAccountLink, 
  retrieveAccount 
} from '../lib/stripe';
import { 
  CoachStripeAccount, 
  CoachStripeOnboardingRequest, 
  CoachStripeOnboardingResponse 
} from '../types/payment';

export class StripeAccountService {
  async createCoachStripeAccount(
    request: CoachStripeOnboardingRequest
  ): Promise<CoachStripeOnboardingResponse> {
    // Check if coach already has a Stripe account
    const { data: existingAccount } = await supabase
      .from('coach_stripe_accounts')
      .select('*')
      .eq('coach_id', request.coach_id)
      .single();

    let stripeAccountId: string;

    if (existingAccount) {
      stripeAccountId = existingAccount.stripe_account_id;
    } else {
      // Create new Stripe connected account
      const stripeAccount = await createConnectedAccount(request.email);
      stripeAccountId = stripeAccount.id;

      // Save to database
      const accountData: Partial<CoachStripeAccount> = {
        coach_id: request.coach_id,
        stripe_account_id: stripeAccountId,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        onboarding_completed: false,
        country: 'US',
        default_currency: 'usd',
        metadata: {},
      };

      const { error } = await supabase
        .from('coach_stripe_accounts')
        .insert([accountData]);

      if (error) {
        throw new Error(`Failed to save Stripe account: ${error.message}`);
      }
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(
      stripeAccountId,
      request.refresh_url,
      request.return_url
    );

    return {
      account_link_url: accountLink.url,
      stripe_account_id: stripeAccountId,
    };
  }

  async updateAccountStatus(stripeAccountId: string): Promise<CoachStripeAccount> {
    // Retrieve account from Stripe
    const stripeAccount = await retrieveAccount(stripeAccountId);

    // Update local database
    const updateData = {
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      details_submitted: stripeAccount.details_submitted,
      onboarding_completed: stripeAccount.charges_enabled && stripeAccount.payouts_enabled,
      business_type: stripeAccount.business_type,
      requirements_due_date: stripeAccount.requirements?.currently_due.length > 0 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        : null,
      requirements_disabled_reason: stripeAccount.requirements?.disabled_reason,
    };

    const { data, error } = await supabase
      .from('coach_stripe_accounts')
      .update(updateData)
      .eq('stripe_account_id', stripeAccountId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update account status: ${error.message}`);
    }

    return data;
  }

  async getCoachStripeAccount(coachId: string): Promise<CoachStripeAccount | null> {
    const { data, error } = await supabase
      .from('coach_stripe_accounts')
      .select('*')
      .eq('coach_id', coachId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch Stripe account: ${error.message}`);
    }

    return data;
  }

  async getAccountBalance(coachId: string): Promise<{
    available: number;
    pending: number;
  }> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    try {
      const balance = await stripe.balance.retrieve({
        stripeAccount: account.stripe_account_id,
      });

      return {
        available: balance.available.reduce((sum, bal) => sum + bal.amount, 0),
        pending: balance.pending.reduce((sum, bal) => sum + bal.amount, 0),
      };
    } catch (error) {
      throw new Error(`Failed to retrieve balance: ${(error as Error).message}`);
    }
  }

  async createExpressLoginLink(coachId: string): Promise<string> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    if (!account.onboarding_completed) {
      throw new Error('Coach has not completed onboarding');
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(
        account.stripe_account_id
      );
      return loginLink.url;
    } catch (error) {
      throw new Error(`Failed to create login link: ${(error as Error).message}`);
    }
  }

  async getPayoutSchedule(coachId: string): Promise<{
    interval: string;
    monthly_anchor?: number;
    weekly_anchor?: string;
  }> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    const stripeAccount = await retrieveAccount(account.stripe_account_id);
    
    return {
      interval: stripeAccount.settings?.payouts?.schedule?.interval || 'daily',
      monthly_anchor: stripeAccount.settings?.payouts?.schedule?.monthly_anchor,
      weekly_anchor: stripeAccount.settings?.payouts?.schedule?.weekly_anchor,
    };
  }

  async getAccountRequirements(coachId: string): Promise<{
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    pending_verification: string[];
  }> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    const stripeAccount = await retrieveAccount(account.stripe_account_id);
    
    return {
      currently_due: stripeAccount.requirements?.currently_due || [],
      eventually_due: stripeAccount.requirements?.eventually_due || [],
      past_due: stripeAccount.requirements?.past_due || [],
      pending_verification: stripeAccount.requirements?.pending_verification || [],
    };
  }

  async refreshOnboardingLink(
    coachId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<string> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    const accountLink = await createAccountLink(
      account.stripe_account_id,
      refreshUrl,
      returnUrl
    );

    return accountLink.url;
  }

  async handleAccountUpdated(stripeAccountId: string): Promise<void> {
    try {
      await this.updateAccountStatus(stripeAccountId);
    } catch (error) {
      console.error('Failed to handle account update:', error);
    }
  }

  async deactivateCoachAccount(coachId: string, reason: string): Promise<void> {
    const account = await this.getCoachStripeAccount(coachId);
    if (!account) {
      throw new Error('Coach does not have a Stripe account');
    }

    // Update local database
    const { error } = await supabase
      .from('coach_stripe_accounts')
      .update({
        charges_enabled: false,
        payouts_enabled: false,
        onboarding_completed: false,
        requirements_disabled_reason: reason,
      })
      .eq('coach_id', coachId);

    if (error) {
      throw new Error(`Failed to deactivate account: ${error.message}`);
    }

    // Note: We don't actually deactivate the Stripe account as that's permanent
    // Instead, we mark it as disabled in our system
  }

  async getAllCoachAccounts(): Promise<CoachStripeAccount[]> {
    const { data, error } = await supabase
      .from('coach_stripe_accounts')
      .select(`
        *,
        coaches!inner(first_name, last_name, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch coach accounts: ${error.message}`);
    }

    return data || [];
  }

  async getAccountMetrics(): Promise<{
    total_accounts: number;
    onboarded_accounts: number;
    pending_onboarding: number;
    charges_enabled: number;
    payouts_enabled: number;
  }> {
    const accounts = await this.getAllCoachAccounts();
    
    return {
      total_accounts: accounts.length,
      onboarded_accounts: accounts.filter(acc => acc.onboarding_completed).length,
      pending_onboarding: accounts.filter(acc => !acc.onboarding_completed).length,
      charges_enabled: accounts.filter(acc => acc.charges_enabled).length,
      payouts_enabled: accounts.filter(acc => acc.payouts_enabled).length,
    };
  }
}