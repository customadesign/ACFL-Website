import { supabase } from '../lib/supabase';
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
    // Stub: Price creation would happen here with new payment gateway
    const priceId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const rateData = {
      coach_id: coachId,
      stripe_price_id: priceId, // Will be renamed to price_id
      ...rateRequest,
    };

    const { data, error } = await supabase
      .from('coach_rates')
      .insert([rateData])
      .select()
      .single();

    if (error) {
      // Stub: Price deactivation would happen here if database insert fails
      console.error('Failed to create coach rate, would deactivate price here');
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

    // If rate amount changes, create new price
    let priceId;
    let finalUpdates = updates;
    if (updates.rate_cents && updates.rate_cents !== currentRate.rate_cents) {
      // Stub: Price creation would happen here with new payment gateway
      priceId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      finalUpdates = { ...updates, stripe_price_id: priceId } as any;
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

    // Deactivate old price if we created a new one
    if (priceId && currentRate.stripe_price_id) {
      // Stub: Old price deactivation would happen here with new payment gateway
      console.log(`Would deactivate old price: ${currentRate.stripe_price_id}`);
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

    // Deactivate price
    if (currentRate.stripe_price_id) {
      // Stub: Price deactivation would happen here with new payment gateway
      console.log(`Would deactivate price: ${currentRate.stripe_price_id}`);
    }
  }

  async getPublicCoachRates(coachId: string): Promise<CoachRate[]> {
    return this.getCoachRates(coachId);
  }

  async validateRateForBooking(rateId: string, coachId: string): Promise<boolean> {
    const rate = await this.getCoachRateById(rateId);
    return rate !== null && rate.coach_id === coachId && rate.is_active;
  }

  // Stub: Price creation logic will be replaced with new payment gateway
  private async createPrice(rateRequest: CoachRateRequest) {
    // This would integrate with the new payment gateway's API
    // For now, return a stub price object
    return {
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      product: 'product_stub',
      unit_amount: rateRequest.rate_cents,
      currency: 'usd',
      nickname: `${rateRequest.title} - ${rateRequest.duration_minutes}min`,
      metadata: {
        session_type: rateRequest.session_type,
        duration_minutes: rateRequest.duration_minutes.toString(),
        max_sessions: rateRequest.max_sessions?.toString() || '',
        validity_days: rateRequest.validity_days?.toString() || '',
      },
    };
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
      throw new Error('Original rate not found');
    }

    // Create new price (stubbed for new payment gateway)
    const newPriceId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newRateData = {
      ...originalRate,
      id: undefined, // Let database generate new ID
      stripe_price_id: newPriceId,
      title: `${originalRate.title} (Copy)`,
      created_at: undefined,
      updated_at: undefined,
    };

    const { data, error } = await supabase
      .from('coach_rates')
      .insert([newRateData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to duplicate coach rate: ${error.message}`);
    }

    return data;
  }

  async bulkUpdateCoachRates(
    coachId: string,
    updates: Array<{ id: string; updates: Partial<CoachRateRequest> }>
  ): Promise<CoachRate[]> {
    const results = [];
    for (const update of updates) {
      try {
        const result = await this.updateCoachRate(update.id, update.updates);
        results.push(result);
      } catch (error) {
        console.error(`Failed to update rate ${update.id}:`, error);
      }
    }
    return results;
  }

  async calculateCoachEarnings(
    rateCents: number,
    platformFeePercentage: number = 15
  ): Promise<{ coachEarnings: number; platformFee: number }> {
    const platformFee = Math.floor((rateCents * platformFeePercentage) / 100);
    const coachEarnings = rateCents - platformFee;
    return { coachEarnings, platformFee };
  }

  async calculatePackageDiscount(
    individualRateCents: number,
    packageSessions: number,
    discountPercentage: number
  ): Promise<number> {
    const totalBeforeDiscount = individualRateCents * packageSessions;
    const discountAmount = Math.floor((totalBeforeDiscount * discountPercentage) / 100);
    return totalBeforeDiscount - discountAmount;
  }
}