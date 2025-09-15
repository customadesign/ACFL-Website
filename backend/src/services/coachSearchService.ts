import { supabase } from '../lib/supabase';

export interface SearchPreferences {
  // Basic filters
  location?: string;
  maxPrice?: number;
  
  // Professional Background
  educationalBackground?: string;
  coachingExperienceYears?: string;
  professionalCertifications?: string[];
  
  // Specialization
  coachingExpertise?: string[];
  ageGroupsComfortable?: string[];
  actTrainingLevel?: string;
  
  // Approach & Methods
  coachingPhilosophy?: string;
  coachingTechniques?: string[];
  sessionStructure?: string;
  
  // Ethics & Boundaries
  scopeHandlingApproach?: string;
  boundaryMaintenanceApproach?: string;
  
  // Crisis Management
  comfortableWithSuicidalThoughts?: string;
  
  // Availability
  weeklyHoursAvailable?: string;
  preferredSessionLength?: string;
  availabilityTimes?: string[];
  
  // Technology
  videoConferencingComfort?: string;
  internetConnectionQuality?: string;
  
  // Languages
  languagesFluent?: string[];

  // Search mode configuration
  searchMode?: 'normal' | 'advanced';

  // Legacy support
  areaOfConcern?: string[];
  language?: string;
  therapistGender?: string;
  modalities?: string[];
  availability_options?: string[];
  experience?: string;
}

export interface EnhancedCoach {
  id: string;
  name: string;
  email?: string;
  bio: string;
  sessionRate: string;
  rating: number;
  matchScore: number;
  
  // Professional Background
  educationalBackground?: string;
  coachingExperienceYears?: string;
  professionalCertifications?: string[];
  
  // Specialization
  coachingExpertise?: string[];
  ageGroupsComfortable?: string[];
  actTrainingLevel?: string;
  
  // Approach & Methods
  coachingPhilosophy?: string;
  coachingTechniques?: string[];
  sessionStructure?: string;
  
  // Ethics & Boundaries
  scopeHandlingApproach?: string;
  boundaryMaintenanceApproach?: string;
  professionalDisciplineHistory?: boolean;
  
  // Crisis Management
  comfortableWithSuicidalThoughts?: string;
  selfHarmProtocol?: string;
  
  // Availability
  weeklyHoursAvailable?: string;
  preferredSessionLength?: string;
  availabilityTimes?: string[];
  
  // Technology
  videoConferencingComfort?: string;
  internetConnectionQuality?: string;
  
  // Languages
  languagesFluent?: string[];
  
  // Legacy fields for compatibility
  specialties?: string[];
  languages?: string[];
  experience?: string;
  location?: string[];
  virtualAvailable?: boolean;
  inPersonAvailable?: boolean;
  profilePhoto?: string;
}

/**
 * Advanced coach search service that combines data from multiple tables
 * and implements comprehensive matching algorithms
 */
class CoachSearchService {
  /**
   * Get all available coaches with complete profile data
   */
  async getAllCoaches(): Promise<EnhancedCoach[]> {
    try {
      console.log('🔍 Fetching all available coaches...');

      // Get all coaches with their related data in a single query
      const { data: coaches, error } = await supabase
        .from('coaches')
        .select(`
          id,
          first_name,
          last_name,
          email,
          bio,
          specialties,
          languages,
          years_experience,
          hourly_rate_usd,
          rating,
          is_available,
          profile_photo,
          created_at,
          coach_demographics (
            gender_identity,
            ethnic_identity,
            religious_background,
            availability_options,
            therapy_modalities,
            location,
            accepts_insurance,
            accepts_sliding_scale,
            timezone,
            meta
          )
        `)
        .eq('is_available', true);

      if (error) {
        console.error('❌ Error fetching coaches:', error);
        throw error;
      }

      console.log(`✅ Found ${coaches?.length || 0} available coaches`);

      // Get coach application data separately for approved coaches
      let applicationData: any[] = [];
      if (coaches && coaches.length > 0) {
        const coachEmails = coaches.map(c => c.email).filter(Boolean);
        
        if (coachEmails.length > 0) {
          const { data: applications, error: appError } = await supabase
            .from('coach_applications')
            .select(`
              email,
              educational_background,
              coaching_experience_years,
              professional_certifications,
              coaching_expertise,
              age_groups_comfortable,
              act_training_level,
              coaching_philosophy,
              coaching_techniques,
              session_structure,
              scope_handling_approach,
              boundary_maintenance_approach,
              professional_discipline_history,
              discipline_explanation,
              comfortable_with_suicidal_thoughts,
              self_harm_protocol,
              weekly_hours_available,
              preferred_session_length,
              availability_times,
              video_conferencing_comfort,
              internet_connection_quality,
              languages_fluent
            `)
            .in('email', coachEmails)
            .eq('status', 'approved');

          if (!appError) {
            applicationData = applications || [];
          }
        }
      }

      // Create a map for quick application data lookup
      const applicationMap = new Map();
      applicationData.forEach(app => {
        applicationMap.set(app.email?.toLowerCase(), app);
      });

      // Transform and enhance coach data
      const enhancedCoaches: EnhancedCoach[] = (coaches || []).map((coach: any) => {
        const appData = applicationMap.get(coach.email?.toLowerCase());
        const demographics = coach.coach_demographics;

        return {
          id: coach.id,
          name: `${coach.first_name} ${coach.last_name}`,
          email: coach.email,
          bio: coach.bio || '',
          sessionRate: coach.hourly_rate_usd 
            ? `$${coach.hourly_rate_usd}/session` 
            : 'Rate not specified',
          rating: coach.rating || 0,
          matchScore: 0, // Will be calculated in search

          // Professional Background (from applications)
          educationalBackground: appData?.educational_background,
          coachingExperienceYears: appData?.coaching_experience_years,
          professionalCertifications: appData?.professional_certifications || [],

          // Specialization (from applications and coaches table)
          coachingExpertise: appData?.coaching_expertise || coach.specialties || [],
          ageGroupsComfortable: appData?.age_groups_comfortable || [],
          actTrainingLevel: appData?.act_training_level,

          // Approach & Methods (from applications)
          coachingPhilosophy: appData?.coaching_philosophy,
          coachingTechniques: appData?.coaching_techniques || [],
          sessionStructure: appData?.session_structure,

          // Ethics & Boundaries (from applications)
          scopeHandlingApproach: appData?.scope_handling_approach,
          boundaryMaintenanceApproach: appData?.boundary_maintenance_approach,
          professionalDisciplineHistory: appData?.professional_discipline_history || false,

          // Crisis Management (from applications)
          comfortableWithSuicidalThoughts: appData?.comfortable_with_suicidal_thoughts,
          selfHarmProtocol: appData?.self_harm_protocol,

          // Availability (from applications and demographics)
          weeklyHoursAvailable: appData?.weekly_hours_available,
          preferredSessionLength: appData?.preferred_session_length,
          availabilityTimes: appData?.availability_times || demographics?.availability_options || [],

          // Technology (from applications)
          videoConferencingComfort: appData?.video_conferencing_comfort,
          internetConnectionQuality: appData?.internet_connection_quality,

          // Languages (from applications and coaches table)
          languagesFluent: appData?.languages_fluent || coach.languages || [],

          // Legacy fields for compatibility
          specialties: coach.specialties || [],
          languages: coach.languages || [],
          experience: coach.years_experience ? `${coach.years_experience} years` : undefined,
          location: demographics?.location ? [demographics.location] : [],
          virtualAvailable: demographics?.meta?.video_available || false,
          inPersonAvailable: false, // All sessions are virtual only
          profilePhoto: coach.profile_photo || ''
        };
      });

      console.log(`✅ Enhanced ${enhancedCoaches.length} coaches with complete data`);
      return enhancedCoaches;

    } catch (error) {
      console.error('❌ Error in getAllCoaches:', error);
      throw error;
    }
  }

  /**
   * Search coaches with advanced matching and scoring
   */
  async searchCoaches(preferences: SearchPreferences): Promise<EnhancedCoach[]> {
    try {
      console.log('🔍 Starting coach search with preferences:', preferences);

      // Get all coaches first
      const allCoaches = await this.getAllCoaches();
      console.log(`📊 Scoring ${allCoaches.length} coaches against search criteria`);

      // Calculate match scores for each coach using appropriate method
      const scoredCoaches = allCoaches.map(coach => ({
        ...coach,
        matchScore: preferences.searchMode === 'normal' 
          ? this.calculateNormalMatchScore(coach, preferences)
          : this.calculateAdvancedMatchScore(coach, preferences)
      }));

      // Filter out coaches with very low match scores (below 10%)
      const filteredCoaches = scoredCoaches.filter(coach => coach.matchScore >= 10);

      // Sort by match score (highest first)
      const sortedCoaches = filteredCoaches.sort((a, b) => b.matchScore - a.matchScore);

      console.log(`✅ Found ${sortedCoaches.length} matching coaches (filtered from ${allCoaches.length})`);
      console.log(`🏆 Top matches: ${sortedCoaches.slice(0, 3).map(c => `${c.name} (${c.matchScore}%)`).join(', ')}`);

      return sortedCoaches;

    } catch (error) {
      console.error('❌ Error in searchCoaches:', error);
      throw error;
    }
  }

  /**
   * Calculate normal search match score - focuses on basic criteria with simpler weighting
   */
  private calculateNormalMatchScore(coach: EnhancedCoach, preferences: SearchPreferences): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Helper function for array overlap scoring
    const arrayOverlapScore = (arr1?: string[], arr2?: string[]): number => {
      if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
      const set1 = new Set(arr1.map(s => s.toLowerCase()));
      const set2 = new Set(arr2.map(s => s.toLowerCase()));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      return intersection.size / Math.max(set1.size, set2.size);
    };

    // 1. Specialization/Areas of Expertise (Weight: 40 - Higher weight for normal search)
    if (preferences.coachingExpertise && preferences.coachingExpertise.length > 0) {
      const expertiseScore = arrayOverlapScore(coach.coachingExpertise, preferences.coachingExpertise);
      totalScore += expertiseScore * 40;
      totalWeight += 40;
    }

    if (preferences.areaOfConcern && preferences.areaOfConcern.length > 0) {
      const concernScore = arrayOverlapScore(coach.specialties, preferences.areaOfConcern);
      totalScore += concernScore * 40;
      totalWeight += 40;
    }

    // 2. Experience Level (Weight: 30 - Higher weight for normal search)
    if (preferences.coachingExperienceYears && preferences.coachingExperienceYears !== 'any') {
      const experienceMatch = coach.coachingExperienceYears === preferences.coachingExperienceYears ? 1.0 : 0;
      totalScore += experienceMatch * 30;
      totalWeight += 30;
    }

    // 3. Languages (Weight: 20)
    if (preferences.languagesFluent && preferences.languagesFluent.length > 0) {
      const languageScore = arrayOverlapScore(coach.languagesFluent, preferences.languagesFluent);
      totalScore += languageScore * 20;
      totalWeight += 20;
    }

    if (preferences.language && preferences.language !== 'any') {
      const legacyLanguageScore = coach.languages?.includes(preferences.language) ? 1.0 : 0;
      totalScore += legacyLanguageScore * 20;
      totalWeight += 20;
    }

    // 4. Basic availability and price (Weight: 10)
    if (preferences.availabilityTimes && preferences.availabilityTimes.length > 0) {
      const availabilityScore = arrayOverlapScore(coach.availabilityTimes, preferences.availabilityTimes);
      totalScore += availabilityScore * 10;
      totalWeight += 10;
    }

    // Calculate final percentage score
    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

    // Add bonus points for highly rated coaches (more generous in normal search)
    let bonusScore = 0;
    if (coach.rating >= 4.5) bonusScore = 8;
    else if (coach.rating >= 4.0) bonusScore = 5;
    else if (coach.rating >= 3.5) bonusScore = 2;

    return Math.min(100, finalScore + bonusScore);
  }

  /**
   * Calculate advanced search match score - comprehensive matching using detailed coach registration fields
   */
  private calculateAdvancedMatchScore(coach: EnhancedCoach, preferences: SearchPreferences): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Helper function for fuzzy string matching
    const fuzzyMatch = (str1?: string, str2?: string): number => {
      if (!str1 || !str2) return 0;
      const s1 = str1.toLowerCase().trim();
      const s2 = str2.toLowerCase().trim();
      if (s1 === s2) return 1.0;
      if (s1.includes(s2) || s2.includes(s1)) return 0.7;
      return 0;
    };

    // Helper function for array overlap scoring
    const arrayOverlapScore = (arr1?: string[], arr2?: string[]): number => {
      if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
      const set1 = new Set(arr1.map(s => s.toLowerCase()));
      const set2 = new Set(arr2.map(s => s.toLowerCase()));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      return intersection.size / Math.max(set1.size, set2.size);
    };

    // 1. Specialization/Areas of Expertise (Weight: 25)
    if (preferences.coachingExpertise && preferences.coachingExpertise.length > 0) {
      const expertiseScore = arrayOverlapScore(coach.coachingExpertise, preferences.coachingExpertise);
      totalScore += expertiseScore * 25;
      totalWeight += 25;
    }

    // Legacy support for areaOfConcern mapping to specialties
    if (preferences.areaOfConcern && preferences.areaOfConcern.length > 0) {
      const concernScore = arrayOverlapScore(coach.specialties, preferences.areaOfConcern);
      totalScore += concernScore * 25;
      totalWeight += 25;
    }

    // 2. Experience Level (Weight: 20)
    if (preferences.coachingExperienceYears && preferences.coachingExperienceYears !== 'any') {
      const experienceMatch = coach.coachingExperienceYears === preferences.coachingExperienceYears ? 1.0 : 0;
      totalScore += experienceMatch * 20;
      totalWeight += 20;
    }

    // 3. Languages (Weight: 15)
    if (preferences.languagesFluent && preferences.languagesFluent.length > 0) {
      const languageScore = arrayOverlapScore(coach.languagesFluent, preferences.languagesFluent);
      totalScore += languageScore * 15;
      totalWeight += 15;
    }

    // Legacy language support
    if (preferences.language && preferences.language !== 'any') {
      const legacyLanguageScore = coach.languages?.includes(preferences.language) ? 1.0 : 0;
      totalScore += legacyLanguageScore * 15;
      totalWeight += 15;
    }

    // 4. Coaching Techniques (Weight: 15)
    if (preferences.coachingTechniques && preferences.coachingTechniques.length > 0) {
      const techniqueScore = arrayOverlapScore(coach.coachingTechniques, preferences.coachingTechniques);
      totalScore += techniqueScore * 15;
      totalWeight += 15;
    }

    // 5. Educational Background (Weight: 10)
    if (preferences.educationalBackground && preferences.educationalBackground !== 'any') {
      const educationMatch = coach.educationalBackground === preferences.educationalBackground ? 1.0 : 0;
      totalScore += educationMatch * 10;
      totalWeight += 10;
    }

    // 6. ACT Training Level (Weight: 10)
    if (preferences.actTrainingLevel && preferences.actTrainingLevel !== 'any') {
      const actMatch = coach.actTrainingLevel === preferences.actTrainingLevel ? 1.0 : 0;
      totalScore += actMatch * 10;
      totalWeight += 10;
    }

    // 7. Session Structure (Weight: 8)
    if (preferences.sessionStructure && preferences.sessionStructure !== 'any') {
      const structureMatch = coach.sessionStructure === preferences.sessionStructure ? 1.0 : 0;
      totalScore += structureMatch * 8;
      totalWeight += 8;
    }

    // 8. Age Groups (Weight: 8)
    if (preferences.ageGroupsComfortable && preferences.ageGroupsComfortable.length > 0) {
      const ageGroupScore = arrayOverlapScore(coach.ageGroupsComfortable, preferences.ageGroupsComfortable);
      totalScore += ageGroupScore * 8;
      totalWeight += 8;
    }

    // 9. Crisis Management Comfort (Weight: 7)
    if (preferences.comfortableWithSuicidalThoughts && preferences.comfortableWithSuicidalThoughts !== 'any') {
      const crisisMatch = coach.comfortableWithSuicidalThoughts === preferences.comfortableWithSuicidalThoughts ? 1.0 : 0;
      totalScore += crisisMatch * 7;
      totalWeight += 7;
    }

    // 10. Availability Times (Weight: 7)
    if (preferences.availabilityTimes && preferences.availabilityTimes.length > 0) {
      const availabilityScore = arrayOverlapScore(coach.availabilityTimes, preferences.availabilityTimes);
      totalScore += availabilityScore * 7;
      totalWeight += 7;
    }

    // 11. Weekly Hours Available (Weight: 5)
    if (preferences.weeklyHoursAvailable && preferences.weeklyHoursAvailable !== 'any') {
      const hoursMatch = coach.weeklyHoursAvailable === preferences.weeklyHoursAvailable ? 1.0 : 0;
      totalScore += hoursMatch * 5;
      totalWeight += 5;
    }

    // 12. Session Length Preference (Weight: 5)
    if (preferences.preferredSessionLength && preferences.preferredSessionLength !== 'any') {
      const lengthMatch = coach.preferredSessionLength === preferences.preferredSessionLength ? 1.0 : 0;
      totalScore += lengthMatch * 5;
      totalWeight += 5;
    }

    // 13. Boundary Maintenance Approach (Weight: 5)
    if (preferences.boundaryMaintenanceApproach && preferences.boundaryMaintenanceApproach !== 'any') {
      const boundaryMatch = coach.boundaryMaintenanceApproach === preferences.boundaryMaintenanceApproach ? 1.0 : 0;
      totalScore += boundaryMatch * 5;
      totalWeight += 5;
    }

    // 14. Video Conferencing Comfort (Weight: 3)
    if (preferences.videoConferencingComfort && preferences.videoConferencingComfort !== 'any') {
      const videoMatch = coach.videoConferencingComfort === preferences.videoConferencingComfort ? 1.0 : 0;
      totalScore += videoMatch * 3;
      totalWeight += 3;
    }

    // Calculate final percentage score
    const finalScore = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;

    // Add bonus points for highly rated coaches
    let bonusScore = 0;
    if (coach.rating >= 4.5) bonusScore = 5;
    else if (coach.rating >= 4.0) bonusScore = 3;
    else if (coach.rating >= 3.5) bonusScore = 1;

    return Math.min(100, finalScore + bonusScore);
  }
}

export const coachSearchService = new CoachSearchService();