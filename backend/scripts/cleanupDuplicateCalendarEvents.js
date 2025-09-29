const { calendarSyncService } = require('../dist/services/calendarSyncService');

async function cleanupDuplicateEvents() {
  console.log('Starting duplicate calendar events cleanup...');

  try {
    // Replace with your actual coach ID
    const coachId = process.argv[2];

    if (!coachId) {
      console.error('Usage: node cleanupDuplicateCalendarEvents.js <coach-id>');
      console.error('Example: node cleanupDuplicateCalendarEvents.js 12345678-1234-1234-1234-123456789012');
      process.exit(1);
    }

    console.log(`Cleaning up duplicate events for coach: ${coachId}`);

    // Clean up all duplicate events for the coach
    await calendarSyncService.cleanupAllDuplicateEvents(coachId);

    // Clean up failed sync jobs for non-existent sessions
    await calendarSyncService.cleanupFailedSyncJobs();

    console.log('Cleanup completed successfully!');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDuplicateEvents().then(() => {
    console.log('Script finished');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { cleanupDuplicateEvents };