import { supabase } from '../lib/supabase';

export class CoachService {
  /**
   * Get the primary rate for a coach (for display purposes)
   * Returns the first active individual 60-minute session rate
   */
  async getCoachPrimaryRate(coachId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('coach_rates')
      .select('rate_cents')
      .eq('coach_id', coachId)
      .eq('session_type', 'individual')
      .eq('duration_minutes', 60)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback: get any active rate for this coach
      const { data: anyRate } = await supabase
        .from('coach_rates')
        .select('rate_cents')
        .eq('coach_id', coachId)
        .eq('is_active', true)
        .order('rate_cents', { ascending: true })
        .limit(1)
        .single();
      
      return anyRate?.rate_cents ? anyRate.rate_cents / 100 : null;
    }

    return data.rate_cents / 100; // Convert cents to dollars
  }

  /**
   * Get all rates for a coach
   */
  async getCoachRates(coachId: string) {
    const { data, error } = await supabase
      .from('coach_rates')
      .select('*')
      .eq('coach_id', coachId)
      .eq('is_active', true)
      .order('session_type, duration_minutes');

    if (error) {
      console.error('Error fetching coach rates:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Format rates for display
   */
  formatRatesForDisplay(rates: any[]): string {
    if (!rates || rates.length === 0) return 'Rates not set';

    const individualRates = rates.filter(r => r.session_type === 'individual');
    if (individualRates.length === 0) return 'Rates not set';

    // Find the standard 60-minute rate
    const standardRate = individualRates.find(r => r.duration_minutes === 60);
    if (standardRate) {
      return `$${standardRate.rate_cents / 100}/hour`;
    }

    // Otherwise show the first rate
    const firstRate = individualRates[0];
    return `$${firstRate.rate_cents / 100}/${firstRate.duration_minutes} min`;
  }

  /**
   * Get coach with rates
   */
  async getCoachWithRates(coachId: string) {
    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', coachId)
      .single();

    if (coachError || !coach) {
      throw new Error('Coach not found');
    }

    const rates = await this.getCoachRates(coachId);
    const primaryRate = await this.getCoachPrimaryRate(coachId);

    return {
      ...coach,
      rates,
      primaryRateUsd: primaryRate,
      displayRate: this.formatRatesForDisplay(rates)
    };
  }

  /**
   * Update coach profile (without rate - rates are managed separately)
   */
  async updateCoachProfile(coachId: string, updates: any) {
    // Remove any rate-related fields from updates
    const { hourly_rate_usd, hourlyRate, ...profileUpdates } = updates;

    const { data, error } = await supabase
      .from('coaches')
      .update(profileUpdates)
      .eq('id', coachId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update coach profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Set a default rate for a coach (used during onboarding)
   */
  async setDefaultRate(coachId: string, hourlyRateUsd: number) {
    // Check if coach already has a default rate
    const existingRates = await this.getCoachRates(coachId);
    
    const hasDefaultRate = existingRates.some(
      r => r.session_type === 'individual' && r.duration_minutes === 60
    );

    if (!hasDefaultRate) {
      // Create a default 60-minute individual session rate
      const { data, error } = await supabase
        .from('coach_rates')
        .insert([{
          coach_id: coachId,
          session_type: 'individual',
          duration_minutes: 60,
          rate_cents: Math.round(hourlyRateUsd * 100),
          title: 'Standard 1-Hour Session',
          description: 'Individual coaching session',
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating default rate:', error);
        throw new Error('Failed to set coach rate');
      }

      return data;
    }

    // Update existing default rate
    const { data, error } = await supabase
      .from('coach_rates')
      .update({ 
        rate_cents: Math.round(hourlyRateUsd * 100),
        updated_at: new Date().toISOString()
      })
      .eq('coach_id', coachId)
      .eq('session_type', 'individual')
      .eq('duration_minutes', 60)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update coach rate');
    }

    return data;
  }

  /**
   * Get all coaches with their primary rates
   */
  async getAllCoachesWithRates() {
    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('*')
      .eq('is_active', true);

    if (error || !coaches) {
      return [];
    }

    // Fetch rates for all coaches
    const coachesWithRates = await Promise.all(
      coaches.map(async (coach) => {
        const rates = await this.getCoachRates(coach.id);
        const primaryRate = await this.getCoachPrimaryRate(coach.id);
        
        return {
          ...coach,
          rates,
          primaryRateUsd: primaryRate,
          displayRate: this.formatRatesForDisplay(rates),
          // Legacy compatibility
          hourly_rate_usd: primaryRate
        };
      })
    );

    return coachesWithRates;
  }
}

export const coachService = new CoachService();