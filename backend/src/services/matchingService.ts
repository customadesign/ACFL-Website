import { Provider } from '../data/providerLoader';
import { NEIGHBORING_STATES } from '../constants/states';


export interface PatientPreferences {
  areaOfConcern: string[];
  treatmentModality: string[];
  location: string;
  therapistGender: string;
  therapistEthnicity: string;
  therapistReligion: string;
  language: string;
  paymentMethod: string;
  availability: string[];
}

function getLocationScore(preferredState: string, providerLocations: string[]): number {
  if (providerLocations.some(loc => loc.toUpperCase() === preferredState.toUpperCase())) {
    return 2;
  }

  const neighbors = NEIGHBORING_STATES[preferredState.toUpperCase()] || [];
  if (providerLocations.some(loc => neighbors.includes(loc.toUpperCase()))) {
    return 1;
  }

  return 0;
}

function scoreProvider(provider: Provider, preferences: PatientPreferences): number {
  let score = 0;
  
  // Primary Matching Criteria
  // 1. Areas of Concern (+5 points each)
  const matchingSpecialties = preferences.areaOfConcern.filter(area =>
    provider.specialties.some(specialty => 
      specialty.toLowerCase().includes(area.toLowerCase())
    )
  );
  score += matchingSpecialties.length * 5;

  // 2. Payment Method (+5 points)
  if (provider.paymentMethods?.includes(preferences.paymentMethod)) {
    score += 5;
  }

  // 3. Availability Overlap (+5 points each)
  const matchingTimes = preferences.availability.filter(time =>
    provider.availableTimes.some(providerTime =>
      providerTime.toLowerCase() === time.toLowerCase()
    )
  );
  score += matchingTimes.length * 5;

  // 4. Gender Match (+5 points)
  if (preferences.therapistGender === 'No preference' || 
    provider.demographics.gender.toLowerCase() === preferences.therapistGender.toLowerCase()) {
    score += 5;
  }

  // Secondary Matching Criteria
  if (provider.languages.some(lang => 
      lang.toLowerCase() === preferences.language.toLowerCase()
    )) {
    score += 3;
  }

  if (preferences.therapistEthnicity === 'No preference' || 
      provider.demographics.ethnicity.toLowerCase() === preferences.therapistEthnicity.toLowerCase()) {
    score += 1;
  }

  if (preferences.therapistReligion === 'No preference' || 
      provider.demographics.religion.toLowerCase() === preferences.therapistReligion.toLowerCase()) {
    score += 1;
  }

  if (!preferences.treatmentModality?.length) {
    score += 1;
  } else {
    const matchingModalities = preferences.treatmentModality.filter(modality =>
      provider.modalities.some(m => m.toLowerCase().includes(modality.toLowerCase()))
    );
    if (matchingModalities.length > 0) {
      score += matchingModalities.length;
    }
  }

  score += getLocationScore(preferences.location, provider.location);
  
  return score;
}

export function matchProviders(preferences: PatientPreferences, providers: Provider[]): Provider[] {
  const availableProviders = providers.filter(p => p.availability > 0);
  
  return availableProviders
    .map(provider => ({
      ...provider,
      matchScore: scoreProvider(provider, preferences)
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
} 