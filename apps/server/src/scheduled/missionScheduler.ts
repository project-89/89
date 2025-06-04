import * as cron from 'node-cron';
import { ScheduledService } from '../services/game';

export class MissionScheduler {
  private static tasks: cron.ScheduledTask[] = [];
  private static isRunning = false;

  /**
   * Start all scheduled tasks
   */
  static start(): void {
    if (MissionScheduler.isRunning) {
      console.log('⚠️ Mission scheduler is already running');
      return;
    }

    console.log('🚀 Starting mission scheduler...');

    // Run mission completion checks every minute
    const missionCompletionTask = cron.schedule(
      '* * * * *',
      async () => {
        try {
          console.log('🔄 Running scheduled mission tasks...');
          const results = await ScheduledService.runAllScheduledTasks();

          // Log summary
          const totalAffected = results.reduce(
            (sum, r) => sum + r.affectedRecords,
            0
          );
          const hasErrors = results.some(
            (r) => r.errors && r.errors.length > 0
          );

          if (totalAffected > 0 || hasErrors) {
            console.log(
              `📊 Scheduled tasks summary: ${totalAffected} records affected${hasErrors ? ' (with errors)' : ''}`
            );
          }
        } catch (error) {
          console.error('❌ Critical error in scheduled tasks:', error);
        }
      },
      {
        scheduled: false, // Don't start immediately
      }
    );

    // Health check every 5 minutes
    const healthCheckTask = cron.schedule(
      '*/5 * * * *',
      async () => {
        try {
          const health = await ScheduledService.healthCheck();
          if (health.status === 'error') {
            console.error(
              `🚨 Mission system health check failed: ${health.details}`
            );
          }
        } catch (error) {
          console.error('❌ Health check failed:', error);
        }
      },
      {
        scheduled: false,
      }
    );

    // Cleanup old missions daily at 2 AM
    const cleanupTask = cron.schedule(
      '0 2 * * *',
      async () => {
        try {
          console.log('🧹 Running daily cleanup...');
          const result = await ScheduledService.cleanupOldMissions(30);
          console.log(`🧹 Cleanup completed: ${result.details}`);
        } catch (error) {
          console.error('❌ Cleanup task failed:', error);
        }
      },
      {
        scheduled: false,
      }
    );

    // Store tasks for later management
    MissionScheduler.tasks = [
      missionCompletionTask,
      healthCheckTask,
      cleanupTask,
    ];

    // Start all tasks
    MissionScheduler.tasks.forEach((task) => task.start());
    MissionScheduler.isRunning = true;

    console.log('✅ Mission scheduler started successfully');
    console.log('📅 Scheduled tasks:');
    console.log('  - Mission completion: Every minute');
    console.log('  - Health checks: Every 5 minutes');
    console.log('  - Cleanup: Daily at 2 AM');
  }

  /**
   * Stop all scheduled tasks
   */
  static stop(): void {
    if (!MissionScheduler.isRunning) {
      console.log('⚠️ Mission scheduler is not running');
      return;
    }

    console.log('🛑 Stopping mission scheduler...');

    MissionScheduler.tasks.forEach((task) => {
      task.stop();
    });

    MissionScheduler.tasks = [];
    MissionScheduler.isRunning = false;

    console.log('✅ Mission scheduler stopped');
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { isRunning: boolean; taskCount: number } {
    return {
      isRunning: MissionScheduler.isRunning,
      taskCount: MissionScheduler.tasks.length,
    };
  }

  /**
   * Run tasks manually (for testing)
   */
  static async runTasksManually(): Promise<void> {
    console.log('🔧 Running scheduled tasks manually...');

    try {
      const results = await ScheduledService.runAllScheduledTasks();

      console.log('📊 Manual task execution results:');
      results.forEach((result) => {
        console.log(`  - ${result.taskName}: ${result.details}`);
        if (result.errors) {
          result.errors.forEach((error) => console.log(`    ❌ ${error}`));
        }
      });
    } catch (error) {
      console.error('❌ Manual task execution failed:', error);
    }
  }
}

// Auto-start scheduler in production
if (process.env.NODE_ENV === 'production') {
  MissionScheduler.start();
}
