import { supabase } from '../lib/supabase';
import stripe from '../lib/stripe';
import { CoachRate, CoachRateRequest } from '../types/payment';

export class CoachRateService {
  async getCoachRates(coachId: string): Promise<CoachRate[]> {
    const { data, error } = await supabase
      .from('coach_rates')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('session_type, duration_minutes');

    if (error) {
      throw new Error(`Failed to fetch coach rates: ${error.message}`);
    }

    return data || [];
  }

  async getCoachRateById(rateId: string): Promise<CoachRate | null> {
    const { data, error } = await supabase
      .from('coach_rates')
      .select('*')
      .eq('id', rateId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch coach rate: ${error.message}`);
    }

    return data;
  }

  async createCoachRate(
    coachId: string, 
    rateRequest: CoachRateRequest
  ): Promise<CoachRate> {
    // Create Stripe price first
    const stripePrice = await this.createStripePrice(rateRequest);
    
    const rateData = {
      coach_id: coachId,
      stripe_price_id: stripePrice.id,
      ...rateRequest,
    };

    const { data, error } = await supabase
      .from('coach_rates')
      .insert([rateData])
      .select()
      .single();

    if (error) {
      // If database insert fails, try to delete the Stripe price
      try {
        await stripe.prices.update(stripePrice.id, { active: false });
      } catch (stripeError) {
        console.error('Failed to deactivate Stripe price:', stripeError);
      }
      throw new Error(`Failed to create coach rate: ${error.message}`);
    }

    return data;
  }

  async updateCoachRate(
    rateId: string, 
    updates: Partial<CoachRateRequest>
  ): Promise<CoachRate> {
    const currentRate = await this.getCoachRateById(rateId);
    if (!currentRate) {
      throw new Error('Coach rate not found');
    }

    // If rate amount changes, create new Stripe price
    let stripePrice;
    let finalUpdates = updates;
    if (updates.rate_cents && updates.rate_cents !== currentRate.rate_cents) {
      stripePrice = await this.createStripePrice({
        ...currentRate,
        ...updates,
        rate_cents: updates.rate_cents,
      } as CoachRateRequest);
      finalUpdates = { ...updates, stripe_price_id: stripePrice.id } as any;
    }

    const { data, error } = await supabase
      .from('coach_rates')
      .update(finalUpdates)
      .eq('id', rateId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coach rate: ${error.message}`);
    }

    // Deactivate old Stripe price if we created a new one
    if (stripePrice && currentRate.stripe_price_id) {
      try {
        await stripe.prices.update(currentRate.stripe_price_id, { active: false });
      } catch (stripeError) {
        console.error('Failed to deactivate old Stripe price:', stripeError);
      }
    }

    return data;
  }

  async deactivateCoachRate(rateId: string): Promise<void> {
    const currentRate = await this.getCoachRateById(rateId);
    if (!currentRate) {
      throw new Error('Coach rate not found');
    }

    const { error } = await supabase
      .from('coach_rates')
      .update({ is_active: false })
      .eq('id', rateId);

    if (error) {
      throw new Error(`Failed to deactivate coach rate: ${error.message}`);
    }

    // Deactivate Stripe price
    if (currentRate.stripe_price_id) {
      try {
        await stripe.prices.update(currentRate.stripe_price_id, { active: false });
      } catch (stripeError) {
        console.error('Failed to deactivate Stripe price:', stripeError);
      }
    }
  }

  async getPublicCoachRates(coachId: string): Promise<CoachRate[]> {
    return this.getCoachRates(coachId);
  }

  async validateRateForBooking(rateId: string, coachId: string): Promise<boolean> {
    const rate = await this.getCoachRateById(rateId);
    return rate !== null && rate.coach_id === coachId && rate.is_active;
  }

  private async createStripePrice(rateRequest: CoachRateRequest) {
    const productName = `${rateRequest.title} - ${rateRequest.duration_minutes}min`;
    
    // Create or retrieve product
    const products = await stripe.products.list({
      limit: 1,
      active: true,
    });
    
    let productId: string;
    if (products.data.length > 0) {
      productId = products.data[0].id;
    } else {
      const product = await stripe.products.create({
        name: 'ACT Coaching Sessions',
        description: 'Professional ACT coaching sessions',
      });
      productId = product.id;
    }

    // Create price
    const price = await stripe.prices.create({
      product: productId,
      unit_amount: rateRequest.rate_cents,
      currency: 'usd',
      nickname: productName,
      metadata: {
        session_type: rateRequest.session_type,
        duration_minutes: rateRequest.duration_minutes.toString(),
        max_sessions: rateRequest.max_sessions?.toString() || '',
        validity_days: rateRequest.validity_days?.toString() || '',
      },
    });

    return price;
  }

  async getCoachRatesByType(
    coachId: string, 
    sessionType: CoachRate['session_type']
  ): Promise<CoachRate[]> {
    const { data, error } = await supabase
      .from('coach_rates')
      .select('*')
      .eq('coach_id', coachId)
      .eq('session_type', sessionType)
      .eq('is_active', true)
      .order('rate_cents');

    if (error) {
      throw new Error(`Failed to fetch coach rates: ${error.message}`);
    }

    return data || [];
  }

  async duplicateCoachRate(rateId: string): Promise<CoachRate> {
    const originalRate = await this.getCoachRateById(rateId);
    if (!originalRate) {
      throw new Error('Coach rate not found');
    }

    const duplicateRequest: CoachRateRequest = {
      session_type: originalRate.session_type,
      duration_minutes: originalRate.duration_minutes,
      rate_cents: originalRate.rate_cents,
      title: `${originalRate.title} (Copy)`,
      description: originalRate.description,
      max_sessions: originalRate.max_sessions,
      validity_days: originalRate.validity_days,
      discount_percentage: originalRate.discount_percentage,
    };

    return this.createCoachRate(originalRate.coach_id, duplicateRequest);
  }

  async bulkUpdateCoachRates(
    coachId: string, 
    updates: { rate_id: string; changes: Partial<CoachRateRequest> }[]
  ): Promise<CoachRate[]> {
    const results: CoachRate[] = [];
    
    for (const update of updates) {
      try {
        const result = await this.updateCoachRate(update.rate_id, update.changes);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update rate ${update.rate_id}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  async calculatePackageDiscount(
    individualRateCents: number, 
    packageSessions: number, 
    discountPercentage: number
  ): Promise<number> {
    const totalIndividualCost = individualRateCents * packageSessions;
    const discountAmount = Math.floor(totalIndividualCost * (discountPercentage / 100));
    return totalIndividualCost - discountAmount;
  }

  async getCoachEarningsRate(): Promise<number> {
    // Platform takes 15% commission by default
    return 0.85;
  }

  async calculateCoachEarnings(totalAmountCents: number): Promise<{
    coachEarnings: number;
    platformFee: number;
  }> {
    const earningsRate = await this.getCoachEarningsRate();
    const coachEarnings = Math.floor(totalAmountCents * earningsRate);
    const platformFee = totalAmountCents - coachEarnings;
    
    return {
      coachEarnings,
      platformFee,
    };
  }
}