CREATE TABLE `mapping_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`seed_urls` text NOT NULL,
	`include_hints` text,
	`exclude_patterns` text,
	`segment` text DEFAULT 'B2B' NOT NULL,
	`max_pages` integer DEFAULT 30 NOT NULL,
	`schedule_days` integer DEFAULT 0 NOT NULL,
	`extract_model` text DEFAULT 'claude-opus-5-5' NOT NULL,
	`synthesis_model` text DEFAULT 'claude-opus-5-5' NOT NULL,
	`language` text DEFAULT 'et' NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`last_run_at` text,
	`next_run_at` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mapping_configs_company_id_unique` ON `mapping_configs` (`company_id`);--> statement-breakpoint
CREATE TABLE `mapping_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`trigger` text DEFAULT 'manual' NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`phase` text,
	`workflow_instance_id` text,
	`config_snapshot` text,
	`pages_total` integer DEFAULT 0 NOT NULL,
	`pages_done` integer DEFAULT 0 NOT NULL,
	`products_found` integer DEFAULT 0 NOT NULL,
	`products_created` integer DEFAULT 0 NOT NULL,
	`products_updated` integer DEFAULT 0 NOT NULL,
	`input_tokens` integer DEFAULT 0 NOT NULL,
	`output_tokens` integer DEFAULT 0 NOT NULL,
	`log` text,
	`error` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`started_at` text,
	`finished_at` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mapping_jobs_company_idx` ON `mapping_jobs` (`company_id`);--> statement-breakpoint
CREATE INDEX `mapping_jobs_created_idx` ON `mapping_jobs` (`created_at`);--> statement-breakpoint
CREATE TABLE `mapping_pages` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`company_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`http_status` integer,
	`content_hash` text,
	`text_length` integer,
	`text` text,
	`extracted` text,
	`products_found` integer DEFAULT 0 NOT NULL,
	`source_id` text,
	`error` text,
	`fetched_at` text,
	FOREIGN KEY (`job_id`) REFERENCES `mapping_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mapping_pages_job_idx` ON `mapping_pages` (`job_id`);--> statement-breakpoint
CREATE INDEX `mapping_pages_company_url_idx` ON `mapping_pages` (`company_id`,`url`);--> statement-breakpoint
ALTER TABLE `products` ADD `source_key` text;--> statement-breakpoint
ALTER TABLE `products` ADD `review_status` text DEFAULT 'reviewed' NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `last_mapped_at` text;--> statement-breakpoint
CREATE INDEX `products_source_key_idx` ON `products` (`source_key`);