const { calendarSyncService } = require('../dist/services/calendarSyncService.js');
const { supabase } = require('../dist/lib/supabase.js');

async function cleanupAllDuplicateEvents() {
  console.log('🧹 Starting cleanup of duplicate calendar events...');

  try {
    // Get all sessions that have calendar event mappings
    const { data: sessions, error } = await supabase
      .from('calendar_event_mappings')
      .select('session_id')
      .neq('session_id', null);

    if (error) {
      console.error('❌ Error fetching sessions with mappings:', error);
      return;
    }

    // Get unique session IDs
    const uniqueSessionIds = [...new Set(sessions.map(s => s.session_id))];
    console.log(`📋 Found ${uniqueSessionIds.length} sessions with calendar events`);

    let duplicatesFound = 0;
    let duplicatesCleaned = 0;

    // Check each session for duplicates
    for (const sessionId of uniqueSessionIds) {
      try {
        // Count mappings for this session
        const { data: mappings, error: countError } = await supabase
          .from('calendar_event_mappings')
          .select('connection_id')
          .eq('session_id', sessionId);

        if (!countError && mappings) {
          // Group by connection to find duplicates
          const connectionCounts = mappings.reduce((acc, mapping) => {
            acc[mapping.connection_id] = (acc[mapping.connection_id] || 0) + 1;
            return acc;
          }, {});

          const hasDuplicates = Object.values(connectionCounts).some(count => count > 1);

          if (hasDuplicates) {
            console.log(`🔍 Found duplicates for session ${sessionId}`);
            duplicatesFound++;

            // Clean up duplicates for this session
            await calendarSyncService.cleanupDuplicateEvents(sessionId);
            duplicatesCleaned++;

            // Add small delay to avoid overwhelming the API
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      } catch (sessionError) {
        console.error(`❌ Error processing session ${sessionId}:`, sessionError);
      }
    }

    console.log('✅ Cleanup completed!');
    console.log(`📊 Sessions with duplicates found: ${duplicatesFound}`);
    console.log(`🧹 Sessions cleaned up: ${duplicatesCleaned}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run the cleanup
cleanupAllDuplicateEvents()
  .then(() => {
    console.log('🎉 Duplicate event cleanup finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup script failed:', error);
    process.exit(1);
  });