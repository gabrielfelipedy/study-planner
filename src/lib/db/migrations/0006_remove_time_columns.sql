ALTER TABLE `topics` DROP COLUMN `estimated_hours`;--> statement-breakpoint
ALTER TABLE `study_plans` DROP COLUMN `hours_per_day`;--> statement-breakpoint
ALTER TABLE `study_plans` DROP COLUMN `hours_per_week`;--> statement-breakpoint
ALTER TABLE `study_plans` DROP COLUMN `study_days`;--> statement-breakpoint
ALTER TABLE `study_plans` DROP COLUMN `last_schedule_hours_per_week`;--> statement-breakpoint
ALTER TABLE `study_plans` DROP COLUMN `last_schedule_study_days`;--> statement-breakpoint
ALTER TABLE `schedule_slots` DROP COLUMN `estimated_minutes`;--> statement-breakpoint
ALTER TABLE `study_sessions` DROP COLUMN `duration_minutes`;
