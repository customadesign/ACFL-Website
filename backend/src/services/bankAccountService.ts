import { supabase } from '../lib/supabase';
import {
  CoachBankAccount,
  CoachBankAccountRequest
} from '../types/payment';
import { encrypt, decrypt } from '../lib/encryption';

export class BankAccountService {
  async addBankAccount(
    coachId: string,
    request: CoachBankAccountRequest
  ): Promise<CoachBankAccount> {
    // Validate routing number (basic validation)
    if (!this.isValidRoutingNumber(request.routing_number)) {
      throw new Error('Invalid routing number');
    }

    // If this is set as default, unset other default accounts
    if (request.is_default) {
      await this.unsetDefaultBankAccounts(coachId);
    }

    // Encrypt sensitive data
    const encryptedAccountNumber = encrypt(request.account_number);

    // Auto-verify in development environment
    const isDevelopment = process.env.NODE_ENV === 'development';

    const bankAccountData = {
      coach_id: coachId,
      account_holder_name: request.account_holder_name,
      bank_name: request.bank_name,
      account_number: encryptedAccountNumber,
      routing_number: request.routing_number,
      account_type: request.account_type,
      country: request.country || 'US',
      currency: 'USD',
      is_verified: isDevelopment, // Auto-verify in development
      is_default: request.is_default || false,
      verification_status: isDevelopment ? 'verified' : 'pending',
      verification_method: isDevelopment ? 'manual' : undefined,
      metadata: {}
    };

    const { data: bankAccount, error } = await supabase
      .from('coach_bank_accounts')
      .insert([bankAccountData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add bank account: ${error.message}`);
    }

    // Don't return encrypted data in response
    return {
      ...bankAccount,
      account_number: '****' + request.account_number.slice(-4)
    };
  }

  async getBankAccounts(coachId: string): Promise<CoachBankAccount[]> {
    const { data: bankAccounts, error } = await supabase
      .from('coach_bank_accounts')
      .select('*')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get bank accounts: ${error.message}`);
    }

    // Auto-verify unverified accounts in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      for (const account of bankAccounts) {
        if (!account.is_verified) {
          await supabase
            .from('coach_bank_accounts')
            .update({
              is_verified: true,
              verification_status: 'verified',
              verification_method: 'manual'
            })
            .eq('id', account.id);

          // Update local data
          account.is_verified = true;
          account.verification_status = 'verified';
          account.verification_method = 'manual';
        }
      }
    }

    // Mask account numbers in response
    return bankAccounts.map(account => ({
      ...account,
      account_number: '****' + decrypt(account.account_number).slice(-4)
    }));
  }

  async getDefaultBankAccount(coachId: string): Promise<CoachBankAccount | null> {
    const { data: bankAccount, error } = await supabase
      .from('coach_bank_accounts')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_default', true)
      .eq('is_verified', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No default account found, try to get any verified account
        const { data: anyVerified, error: anyError } = await supabase
          .from('coach_bank_accounts')
          .select('*')
          .eq('coach_id', coachId)
          .eq('is_verified', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (anyError) {
          return null;
        }

        return anyVerified;
      }
      throw new Error(`Failed to get default bank account: ${error.message}`);
    }

    return bankAccount;
  }

  async setDefaultBankAccount(coachId: string, bankAccountId: string): Promise<void> {
    // First, unset all default accounts for this coach
    await this.unsetDefaultBankAccounts(coachId);

    // Set the specified account as default
    const { error } = await supabase
      .from('coach_bank_accounts')
      .update({ is_default: true })
      .eq('id', bankAccountId)
      .eq('coach_id', coachId);

    if (error) {
      throw new Error(`Failed to set default bank account: ${error.message}`);
    }
  }

  async deleteBankAccount(coachId: string, bankAccountId: string): Promise<void> {
    // Check if there are any pending payouts for this account
    const { data: pendingPayouts, error: payoutError } = await supabase
      .from('payouts')
      .select('id')
      .eq('bank_account_id', bankAccountId)
      .in('status', ['pending', 'processing']);

    if (payoutError) {
      throw new Error(`Failed to check for pending payouts: ${payoutError.message}`);
    }

    if (pendingPayouts && pendingPayouts.length > 0) {
      throw new Error('Cannot delete bank account with pending payouts');
    }

    const { error } = await supabase
      .from('coach_bank_accounts')
      .delete()
      .eq('id', bankAccountId)
      .eq('coach_id', coachId);

    if (error) {
      throw new Error(`Failed to delete bank account: ${error.message}`);
    }
  }

  async verifyBankAccount(
    coachId: string,
    bankAccountId: string,
    verificationMethod: 'micro_deposits' | 'plaid' | 'manual',
    verificationData?: any
  ): Promise<void> {
    const updateData: Partial<CoachBankAccount> = {
      verification_status: 'verified',
      is_verified: true,
      verification_method: verificationMethod,
      last_verification_attempt: new Date()
    };

    if (verificationData) {
      updateData.metadata = verificationData;
    }

    const { error } = await supabase
      .from('coach_bank_accounts')
      .update(updateData)
      .eq('id', bankAccountId)
      .eq('coach_id', coachId);

    if (error) {
      throw new Error(`Failed to verify bank account: ${error.message}`);
    }
  }

  async updateBankAccount(
    coachId: string,
    bankAccountId: string,
    updates: Partial<CoachBankAccountRequest>
  ): Promise<CoachBankAccount> {
    const updateData: any = {};

    if (updates.account_holder_name) {
      updateData.account_holder_name = updates.account_holder_name;
    }

    if (updates.bank_name) {
      updateData.bank_name = updates.bank_name;
    }

    if (updates.account_number) {
      updateData.account_number = encrypt(updates.account_number);
      // Reset verification if account number changes
      updateData.is_verified = false;
      updateData.verification_status = 'pending';
    }

    if (updates.routing_number) {
      if (!this.isValidRoutingNumber(updates.routing_number)) {
        throw new Error('Invalid routing number');
      }
      updateData.routing_number = updates.routing_number;
      // Reset verification if routing number changes
      updateData.is_verified = false;
      updateData.verification_status = 'pending';
    }

    if (updates.account_type) {
      updateData.account_type = updates.account_type;
    }

    if (updates.is_default !== undefined) {
      if (updates.is_default) {
        await this.unsetDefaultBankAccounts(coachId);
      }
      updateData.is_default = updates.is_default;
    }

    updateData.updated_at = new Date();

    const { data: bankAccount, error } = await supabase
      .from('coach_bank_accounts')
      .update(updateData)
      .eq('id', bankAccountId)
      .eq('coach_id', coachId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update bank account: ${error.message}`);
    }

    // Don't return encrypted data in response
    return {
      ...bankAccount,
      account_number: '****' + (updates.account_number || decrypt(bankAccount.account_number)).slice(-4)
    };
  }

  private async unsetDefaultBankAccounts(coachId: string): Promise<void> {
    await supabase
      .from('coach_bank_accounts')
      .update({ is_default: false })
      .eq('coach_id', coachId);
  }

  private isValidRoutingNumber(routingNumber: string): boolean {
    // Basic routing number validation (9 digits)
    if (!/^\d{9}$/.test(routingNumber)) {
      return false;
    }

    // ABA routing number checksum validation
    const digits = routingNumber.split('').map(Number);
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      (digits[2] + digits[5] + digits[8])
    ) % 10;

    return checksum === 0;
  }
}

export const bankAccountService = new BankAccountService();