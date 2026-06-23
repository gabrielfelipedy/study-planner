PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_schedule_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text,
	`date` text NOT NULL,
	`type` text DEFAULT 'study' NOT NULL,
	`estimated_minutes` integer,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_schedule_slots`("id", "plan_id", "topic_id", "date", "type", "estimated_minutes", "is_completed", "completed_at", "created_at") SELECT "id", "plan_id", "topic_id", "date", "type", "estimated_minutes", "is_completed", "completed_at", "created_at" FROM `schedule_slots`;--> statement-breakpoint
DROP TABLE `schedule_slots`;--> statement-breakpoint
ALTER TABLE `__new_schedule_slots` RENAME TO `schedule_slots`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `idx_slots_plan_date` ON `schedule_slots` (`plan_id`,`date`);--> statement-breakpoint
ALTER TABLE `study_plans` ADD `hours_per_week` real;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `study_days` text;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `last_schedule_generated_at` text;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `last_schedule_hours_per_week` real;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `last_schedule_study_days` text;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `last_schedule_start_date` text;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `last_schedule_deadline` text;--> statement-breakpoint
ALTER TABLE `study_plans` ADD `archived_at` text;--> statement-breakpoint
ALTER TABLE `subjects` ADD `archived_at` text;