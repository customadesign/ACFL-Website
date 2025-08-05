import { matchProviders } from '../services/matchingService';
import type { Provider } from '../data/providerLoader';

interface ProviderWithScore extends Provider {
  matchScore: number;
}

describe('Matching Service', () => {
  const mockProviders: Provider[] = [
    {
      name: "Dr. Test One",
      specialties: ["Anxiety", "Depression"],
      modalities: ["CBT", "DBT"],
      location: ["CA"],
      demographics: {
        gender: "Female",
        ethnicity: "Asian",
        religion: "Buddhist"
      },
      availability: 5,
      languages: ["English", "Mandarin"],
      bio: "Test bio",
      sexualOrientation: "Straight / heterosexual",
      availableTimes: ["Weekday Mornings", "Weekday Afternoons"],
      paymentMethods: ["Aetna", "Self-pay"]
    },
    {
      name: "Dr. Test Two",
      specialties: ["Trauma-related stress", "Depression"],
      modalities: ["EMDR", "CBT"],
      location: ["NY"],
      demographics: {
        gender: "Male",
        ethnicity: "White",
        religion: "Christian"
      },
      availability: 3,
      languages: ["English", "Spanish"],
      bio: "Test bio 2",
      sexualOrientation: "Straight / heterosexual",
      availableTimes: ["Weekday Evenings", "Weekends"],
      paymentMethods: ["Anthem", "Self-pay"]
    }
  ];

  test('matches based on primary criteria (specialties, payment, availability)', () => {
    const preferences = {
      areaOfConcern: ["Anxiety"],
      treatmentModality: ["CBT"],
      location: "CA",
      therapistGender: "No preference",
      therapistEthnicity: "No preference",
      therapistReligion: "No preference",
      language: "English",
      paymentMethod: "Aetna",
      availability: ["Weekday Mornings"]
    };

    const matches = matchProviders(preferences, mockProviders);
    const typedMatches = matches as ProviderWithScore[];
    expect(typedMatches[0].name).toBe("Dr. Test One");
    expect(typedMatches[0].matchScore).toBeGreaterThan(typedMatches[1].matchScore);
  });

  test('matches based on location proximity', () => {
    const preferences = {
      areaOfConcern: ["Depression"],
      treatmentModality: ["CBT"],
      location: "NJ", // Neighboring state to NY
      therapistGender: "No preference",
      therapistEthnicity: "No preference",
      therapistReligion: "No preference",
      language: "English",
      paymentMethod: "Anthem",
      availability: ["Weekday Evenings"]
    };

    const matches = matchProviders(preferences, mockProviders);
    const typedMatches = matches as ProviderWithScore[];
    expect(typedMatches[0].name).toBe("Dr. Test Two");
    expect(typedMatches[0].matchScore).toBeGreaterThan(0);
  });

  test('matches based on demographic preferences', () => {
    const preferences = {
      areaOfConcern: ["Depression"],
      treatmentModality: ["CBT"],
      location: "CA",
      therapistGender: "Female",
      therapistEthnicity: "Asian",
      therapistReligion: "Buddhist",
      language: "Mandarin",
      paymentMethod: "Aetna",
      availability: ["Weekday Mornings"]
    };

    const matches = matchProviders(preferences, mockProviders);
    const typedMatches = matches as ProviderWithScore[];
    expect(typedMatches[0].name).toBe("Dr. Test One");
    expect(typedMatches[0].matchScore).toBeGreaterThan(typedMatches[1].matchScore);
  });
}); 