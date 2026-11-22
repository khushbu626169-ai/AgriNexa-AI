const cron = require('node-cron');
const config = require('../config');
const updateIngestionService = require('./updateIngestionService');

class SchedulerService {
  constructor() {
    this.cronTask = null;
    this.lastRun = null;
    this.isRunning = false;
  }

  start() {
    console.log(`Starting automated ingestion scheduler with cron schedule: [${config.INGESTION_CRON_SCHEDULE}]`);

    this.cronTask = cron.schedule(config.INGESTION_CRON_SCHEDULE, async () => {
      console.log('Automated scheduled ingestion job triggered at:', new Date().toISOString());
      this.isRunning = true;
      try {
        await updateIngestionService.runAllSources();
        this.lastRun = new Date().toISOString();
      } catch (err) {
        console.error('Error during scheduled ingestion run:', err);
      } finally {
        this.isRunning = false;
      }
    });

    if (config.INGESTION_RUN_ON_STARTUP) {
      console.log('Executing initial ingestion run on server startup...');
      setTimeout(async () => {
        try {
          await updateIngestionService.runAllSources();
          this.lastRun = new Date().toISOString();
          console.log('Initial startup ingestion completed successfully.');
        } catch (e) {
          console.error('Startup ingestion error:', e.message);
        }
      }, 1000);
    }
  }

  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
  }

  getStatus() {
    return {
      scheduled: !!this.cronTask,
      cron_expression: config.INGESTION_CRON_SCHEDULE,
      last_run: this.lastRun,
      is_running: this.isRunning || updateIngestionService.isRunning
    };
  }
}

module.exports = new SchedulerService();
