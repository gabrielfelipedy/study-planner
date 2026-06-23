ALTER TABLE revisions ADD COLUMN `stability` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `difficulty` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `retrievability` real DEFAULT 1.0 NOT NULL;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `card_state` text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `elapsed_days` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `scheduled_days` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `reps` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `lapses` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `rating` text;--> statement-breakpoint
ALTER TABLE revisions ADD COLUMN `last_review_at` text;
