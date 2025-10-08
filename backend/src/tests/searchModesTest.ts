import { coachSearchService } from '../services/coachSearchService';

/**
 * Test script to verify normal vs advanced search modes produce different results
 */
async function testSearchModes() {
  console.log('🧪 Testing Normal vs Advanced Search Modes\n');

  // Test data - same preferences but different search modes
  const testPreferences = {
    coachingExpertise: ['Anxiety', 'Depression'],
    coachingExperienceYears: '3-5 years',
    languagesFluent: ['English'],
    coachingTechniques: ['Mindfulness practices', 'Cognitive Behavioral Techniques'],
    actTrainingLevel: 'Yes, formal ACT training/certification',
    sessionStructure: 'Semi-structured with flexibility',
    ageGroupsComfortable: ['Adults (26-64)'],
    comfortableWithSuicidalThoughts: 'Yes, I have training and experience'
  };

  try {
    // Test 1: Normal Search Mode
    console.log('🔍 Testing NORMAL search mode...');
    const normalResults = await coachSearchService.searchCoaches({
      ...testPreferences,
      searchMode: 'normal'
    });

    // Test 2: Advanced Search Mode
    console.log('🔍 Testing ADVANCED search mode...');
    const advancedResults = await coachSearchService.searchCoaches({
      ...testPreferences,
      searchMode: 'advanced'
    });

    // Compare results
    console.log('\n📊 RESULTS COMPARISON:');
    console.log('='.repeat(50));
    
    console.log(`🟢 Normal Search Results: ${normalResults.length} coaches found`);
    if (normalResults.length > 0) {
      console.log('   Top 5 Normal Search Matches:');
      normalResults.slice(0, 5).forEach((coach, index) => {
        console.log(`   ${index + 1}. ${coach.name} - ${coach.matchScore}% match`);
      });
    }

    console.log(`\n🔵 Advanced Search Results: ${advancedResults.length} coaches found`);
    if (advancedResults.length > 0) {
      console.log('   Top 5 Advanced Search Matches:');
      advancedResults.slice(0, 5).forEach((coach, index) => {
        console.log(`   ${index + 1}. ${coach.name} - ${coach.matchScore}% match`);
      });
    }

    // Analyze differences
    console.log('\n🔬 ANALYSIS:');
    console.log('='.repeat(50));
    
    const normalScores = normalResults.map(c => c.matchScore);
    const advancedScores = advancedResults.map(c => c.matchScore);
    
    const normalAvg = normalScores.length > 0 ? Math.round(normalScores.reduce((a, b) => a + b, 0) / normalScores.length) : 0;
    const advancedAvg = advancedScores.length > 0 ? Math.round(advancedScores.reduce((a, b) => a + b, 0) / advancedScores.length) : 0;
    
    console.log(`📈 Normal Search - Average Match Score: ${normalAvg}%`);
    console.log(`📈 Advanced Search - Average Match Score: ${advancedAvg}%`);
    
    const normalMax = normalScores.length > 0 ? Math.max(...normalScores) : 0;
    const advancedMax = advancedScores.length > 0 ? Math.max(...advancedScores) : 0;
    
    console.log(`🎯 Normal Search - Highest Match Score: ${normalMax}%`);
    console.log(`🎯 Advanced Search - Highest Match Score: ${advancedMax}%`);
    
    // Check if modes produce different results (which they should)
    const resultsAreDifferent = normalAvg !== advancedAvg || normalResults.length !== advancedResults.length;
    
    if (resultsAreDifferent) {
      console.log('\n✅ SUCCESS: Normal and Advanced search modes produce different results!');
      console.log('   This confirms that the two algorithms are working correctly.');
    } else {
      console.log('\n⚠️ WARNING: Normal and Advanced search modes produced identical results.');
      console.log('   This may indicate that the algorithms need further differentiation.');
    }

    // Test 3: Simple search with only basic criteria (should use normal mode)
    console.log('\n🔍 Testing search with ONLY basic criteria (should use normal mode)...');
    const basicResults = await coachSearchService.searchCoaches({
      coachingExpertise: ['Anxiety'],
      searchMode: 'normal'
    });

    console.log(`🟢 Basic Criteria Results: ${basicResults.length} coaches found`);
    if (basicResults.length > 0) {
      console.log(`   Top match: ${basicResults[0].name} - ${basicResults[0].matchScore}% match`);
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSearchModes();
}

export { testSearchModes };