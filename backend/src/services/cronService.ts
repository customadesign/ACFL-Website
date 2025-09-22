import * as cron from 'node-cron';
import { appointmentReminderService } from './appointmentReminderService';

export class CronService {
  private static instance: CronService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  private constructor() {}

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Start all cron jobs
   */
  public startAllJobs(): void {
    this.startReminderProcessingJob();
    this.startCleanupJob();
    console.log('All cron jobs started successfully');
  }

  /**
   * Stop all cron jobs
   */
  public stopAllJobs(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Stopped cron job: ${name}`);
    });
    this.jobs.clear();
    console.log('All cron jobs stopped');
  }

  /**
   * Start appointment reminder processing job
   * Runs every 5 minutes to process due reminders
   */
  private startReminderProcessingJob(): void {
    const jobName = 'appointmentReminders';

    const job = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Processing appointment reminders...');

        // Process scheduled reminders
        await appointmentReminderService.processDueReminders();

        // Check for sessions starting soon without reminders
        await appointmentReminderService.checkUpcomingSessions();
      } catch (error) {
        console.error('Error in reminder processing cron job:', error);
      }
    }, {
      timezone: "America/New_York" // Adjust timezone as needed
    });

    this.jobs.set(jobName, job);
    console.log(`Started cron job: ${jobName} - runs every 5 minutes`);
  }

  /**
   * Start cleanup job for old reminders
   * Runs daily at 2 AM to clean up old reminder records
   */
  private startCleanupJob(): void {
    const jobName = 'reminderCleanup';

    const job = cron.schedule('0 2 * * *', async () => {
      try {
        console.log('Cleaning up old reminder records...');
        await this.cleanupOldReminders();
      } catch (error) {
        console.error('Error in cleanup cron job:', error);
      }
    }, {
      timezone: "America/New_York"
    });

    this.jobs.set(jobName, job);
    console.log(`Started cron job: ${jobName} - runs daily at 2 AM`);
  }

  /**
   * Clean up old reminder records (older than 30 days)
   */
  private async cleanupOldReminders(): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('scheduled_reminders')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning up old reminders:', error);
      } else {
        console.log('Successfully cleaned up old reminder records');
      }
    } catch (error) {
      console.error('Error in cleanup process:', error);
    }
  }

  /**
   * Get status of all cron jobs
   */
  public getJobStatus(): { jobName: string; isRunning: boolean }[] {
    return Array.from(this.jobs.entries()).map(([jobName, job]) => ({
      jobName,
      isRunning: job.getStatus() === 'scheduled'
    }));
  }

  /**
   * Stop a specific job
   */
  public stopJob(jobName: string): boolean {
    const job = this.jobs.get(jobName);
    if (job) {
      job.stop();
      this.jobs.delete(jobName);
      console.log(`Stopped cron job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific job
   */
  public startJob(jobName: string): boolean {
    switch (jobName) {
      case 'appointmentReminders':
        this.startReminderProcessingJob();
        return true;
      case 'reminderCleanup':
        this.startCleanupJob();
        return true;
      default:
        console.error(`Unknown job name: ${jobName}`);
        return false;
    }
  }
}

// Export singleton instance
export const cronService = CronService.getInstance();