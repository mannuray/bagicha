-- Weather reminders (heat, heavy rain, cold night) from the daily weather job.
ALTER TYPE "TaskSource" ADD VALUE IF NOT EXISTS 'WEATHER';
