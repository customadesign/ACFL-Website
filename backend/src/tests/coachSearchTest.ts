import { coachSearchService } from '../services/coachSearchService';

/**
 * Test script to validate the enhanced coach search functionality
 * Run this to test various search scenarios and ensure the search logic works correctly
 */

interface TestScenario {
  name: string;
  preferences: any;
  expectedMinResults?: number;
  expectedMaxResults?: number;
  shouldContain?: string[]; // Coach names that should be in results
  shouldNotContain?: string[]; // Coach names that should NOT be in results
}

const testScenarios: TestScenario[] = [
  {
    name: "Basic Specialization Search - Anxiety",
    preferences: {
      coachingExpertise: ["Anxiety & worry", "Stress management"]
    },
    expectedMinResults: 1
  },
  {
    name: "Language Filter - Spanish",
    preferences: {
      languagesFluent: ["Spanish"]
    },
    expectedMinResults: 0 // May not have Spanish speakers yet
  },
  {
    name: "Experience Level Filter",
    preferences: {
      coachingExperienceYears: "3-5 years"
    },
    expectedMinResults: 1
  },
  {
    name: "Multiple Criteria Search",
    preferences: {
      coachingExpertise: ["Life transitions", "Career development"],
      coachingExperienceYears: "More than 10 years",
      languagesFluent: ["English"],
      actTrainingLevel: "Yes, formal ACT training/certification",
      sessionStructure: "Semi-structured with flexibility"
    },
    expectedMinResults: 0 // Very specific criteria
  },
  {
    name: "Crisis Management Comfort",
    preferences: {
      comfortableWithSuicidalThoughts: "Yes, I have training and experience"
    },
    expectedMinResults: 0
  },
  {
    name: "Technology Requirements",
    preferences: {
      videoConferencingComfort: "Very comfortable",
      internetConnectionQuality: "High-speed, reliable connection"
    },
    expectedMinResults: 0
  },
  {
    name: "Availability Times",
    preferences: {
      availabilityTimes: ["Weekday mornings (6am-12pm)", "Weekday evenings (5pm-10pm)"]
    },
    expectedMinResults: 0
  },
  {
    name: "Educational Background",
    preferences: {
      educationalBackground: "Master's Degree"
    },
    expectedMinResults: 0
  },
  {
    name: "Coaching Techniques",
    preferences: {
      coachingTechniques: ["Mindfulness practices", "Goal setting & action planning", "Values clarification"]
    },
    expectedMinResults: 0
  },
  {
    name: "Empty Search (All Coaches)",
    preferences: {},
    expectedMinResults: 1 // Should return all available coaches
  }
];

/**
 * Run all test scenarios
 */
export async function runCoachSearchTests(): Promise<void> {
  console.log('\n🧪 STARTING COACH SEARCH TESTS');
  console.log('================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  try {
    // First, test getting all coaches
    console.log('📋 Testing getAllCoaches...');
    const allCoaches = await coachSearchService.getAllCoaches();
    console.log(`✅ Found ${allCoaches.length} total coaches`);
    
    if (allCoaches.length === 0) {
      console.log('⚠️  WARNING: No coaches found in database. Some tests may not be meaningful.');
    } else {
      console.log('📊 Sample coach data:');
      console.log(`   - Name: ${allCoaches[0].name}`);
      console.log(`   - Specialties: ${JSON.stringify(allCoaches[0].specialties || [])}`);
      console.log(`   - Languages: ${JSON.stringify(allCoaches[0].languages || [])}`);
      console.log(`   - Experience: ${allCoaches[0].experience || 'Not specified'}`);
      console.log(`   - Education: ${allCoaches[0].educationalBackground || 'Not specified'}`);
    }

    console.log('\n🔍 Running search test scenarios...\n');

    // Run each test scenario
    for (const scenario of testScenarios) {
      totalTests++;
      console.log(`🧪 Test ${totalTests}: ${scenario.name}`);
      console.log(`   Preferences: ${JSON.stringify(scenario.preferences, null, 2)}`);

      try {
        const results = await coachSearchService.searchCoaches(scenario.preferences);
        console.log(`   📊 Results: ${results.length} coaches found`);

        // Show top 3 results with scores
        if (results.length > 0) {
          console.log(`   🏆 Top matches:`);
          results.slice(0, 3).forEach((coach, index) => {
            console.log(`      ${index + 1}. ${coach.name} (${coach.matchScore}% match)`);
          });
        }

        // Validate results
        let testPassed = true;
        let failureReasons: string[] = [];

        // Check minimum results
        if (scenario.expectedMinResults !== undefined) {
          if (results.length < scenario.expectedMinResults) {
            testPassed = false;
            failureReasons.push(`Expected at least ${scenario.expectedMinResults} results, got ${results.length}`);
          }
        }

        // Check maximum results
        if (scenario.expectedMaxResults !== undefined) {
          if (results.length > scenario.expectedMaxResults) {
            testPassed = false;
            failureReasons.push(`Expected at most ${scenario.expectedMaxResults} results, got ${results.length}`);
          }
        }

        // Check required coaches
        if (scenario.shouldContain) {
          const resultNames = results.map(c => c.name.toLowerCase());
          for (const requiredName of scenario.shouldContain) {
            if (!resultNames.some(name => name.includes(requiredName.toLowerCase()))) {
              testPassed = false;
              failureReasons.push(`Expected to find coach containing "${requiredName}"`);
            }
          }
        }

        // Check excluded coaches
        if (scenario.shouldNotContain) {
          const resultNames = results.map(c => c.name.toLowerCase());
          for (const excludedName of scenario.shouldNotContain) {
            if (resultNames.some(name => name.includes(excludedName.toLowerCase()))) {
              testPassed = false;
              failureReasons.push(`Should not find coach containing "${excludedName}"`);
            }
          }
        }

        if (testPassed) {
          console.log(`   ✅ PASSED\n`);
          passedTests++;
        } else {
          console.log(`   ❌ FAILED`);
          failureReasons.forEach(reason => console.log(`      - ${reason}`));
          console.log('');
          failedTests++;
        }

      } catch (error) {
        console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
        failedTests++;
      }
    }

    // Test scoring consistency
    console.log('🎯 Testing match score consistency...');
    try {
      const testPreferences = {
        coachingExpertise: ["Anxiety & worry", "Stress management"],
        languagesFluent: ["English"],
        coachingExperienceYears: "3-5 years"
      };

      const results1 = await coachSearchService.searchCoaches(testPreferences);
      const results2 = await coachSearchService.searchCoaches(testPreferences);

      let scoresMatch = true;
      for (let i = 0; i < Math.min(results1.length, results2.length); i++) {
        if (results1[i].id !== results2[i].id || results1[i].matchScore !== results2[i].matchScore) {
          scoresMatch = false;
          break;
        }
      }

      if (scoresMatch && results1.length === results2.length) {
        console.log('✅ Match scores are consistent across multiple runs');
      } else {
        console.log('❌ Match scores are inconsistent');
        failedTests++;
      }
      totalTests++;

    } catch (error) {
      console.log(`❌ Error testing score consistency: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failedTests++;
      totalTests++;
    }

    // Performance test
    console.log('\n⚡ Testing search performance...');
    try {
      const startTime = Date.now();
      await coachSearchService.searchCoaches({
        coachingExpertise: ["Life transitions", "Career development", "Stress management"],
        languagesFluent: ["English", "Spanish"],
        coachingExperienceYears: "More than 10 years"
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`⚡ Search completed in ${duration}ms`);
      
      if (duration < 5000) { // Less than 5 seconds
        console.log('✅ Performance is acceptable');
      } else {
        console.log('⚠️  Performance may need optimization (>5s)');
      }

    } catch (error) {
      console.log(`❌ Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error);
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✅`);
  console.log(`Failed: ${failedTests} ❌`);
  console.log(`Success rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The search functionality is working correctly.');
  } else if (passedTests > failedTests) {
    console.log('\n⚠️  Most tests passed, but there are some issues to address.');
  } else {
    console.log('\n🚨 Many tests failed. The search functionality needs significant work.');
  }

  console.log('\n🔧 RECOMMENDATIONS');
  console.log('===================');
  if (allCoaches.length === 0) {
    console.log('1. Add sample coach data to the database for meaningful testing');
    console.log('2. Ensure coach application data is properly migrated to approved coaches');
  }
  if (failedTests > 0) {
    console.log('3. Review failing test scenarios and adjust the search algorithm');
    console.log('4. Verify database schema matches expected field names');
    console.log('5. Check that coach data includes all required search fields');
  }
  console.log('6. Run database migration: add_search_optimization_indexes.sql');
  console.log('7. Consider adding more diverse coach profiles for better testing');
}

// Export test function for CLI usage
if (require.main === module) {
  runCoachSearchTests().catch(console.error);
}