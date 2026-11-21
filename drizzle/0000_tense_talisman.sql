CREATE TABLE `archetypes` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_et` text NOT NULL,
	`name_en` text NOT NULL,
	`description` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `archetypes_code_unique` ON `archetypes` (`code`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`entity` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `canvas_items` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`company_id` text,
	`block` text NOT NULL,
	`text` text NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`author_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `canvas_product_idx` ON `canvas_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `canvas_company_idx` ON `canvas_items` (`company_id`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`segment` text NOT NULL,
	`name_et` text NOT NULL,
	`name_en` text NOT NULL,
	`subcategories` text,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_code_unique` ON `categories` (`code`);--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`market_id` text NOT NULL,
	`parent_id` text,
	`name` text NOT NULL,
	`brands` text,
	`type` text DEFAULT 'incumbent' NOT NULL,
	`group_name` text,
	`website` text,
	`segments` text,
	`strategy` text,
	`notes` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`market_id`) REFERENCES `markets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `company_kpis` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`metric` text NOT NULL,
	`period` text NOT NULL,
	`value` real NOT NULL,
	`unit` text DEFAULT '' NOT NULL,
	`currency` text,
	`scope` text,
	`source_id` text,
	`note` text,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `company_kpis_company_idx` ON `company_kpis` (`company_id`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text,
	`signal_id` text,
	`relevance` integer DEFAULT 3 NOT NULL,
	`hypothesis` text,
	`next_step` text,
	`owner` text,
	`author_id` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`success` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `markets` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`region` text,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`regulator` text,
	`population` integer,
	`gdp_per_capita` real,
	`mobile_operators` integer,
	`notes` text,
	`priority` integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `markets_code_unique` ON `markets` (`code`);--> statement-breakpoint
CREATE TABLE `pain_gain_items` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`kind` text NOT NULL,
	`customer_text` text NOT NULL,
	`product_response` text,
	`fit_score` integer DEFAULT 0 NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`author_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_addons` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`price` real,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`price_unit` text,
	`description` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_archetypes` (
	`product_id` text NOT NULL,
	`archetype_id` text NOT NULL,
	PRIMARY KEY(`product_id`, `archetype_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`archetype_id`) REFERENCES `archetypes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_kpis` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`metric` text NOT NULL,
	`period` text NOT NULL,
	`value` real NOT NULL,
	`unit` text DEFAULT '' NOT NULL,
	`is_estimate` integer DEFAULT false NOT NULL,
	`method` text,
	`source_id` text,
	`note` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `product_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`tier` text,
	`price` real,
	`currency` text DEFAULT 'EUR' NOT NULL,
	`price_eur` real,
	`price_unit` text DEFAULT 'month' NOT NULL,
	`contract_months` integer,
	`users_range` text,
	`sla` text,
	`included` text,
	`attributes` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text,
	`status` text DEFAULT 'active' NOT NULL,
	`launch_date` text,
	`url` text,
	`summary` text,
	`target_customer` text,
	`components` text,
	`addons_summary` text,
	`sla_notes` text,
	`pricing_model` text DEFAULT 'subscription' NOT NULL,
	`price_notes` text,
	`channel` text,
	`technology` text,
	`partners` text,
	`notes` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `products_company_idx` ON `products` (`company_id`);--> statement-breakpoint
CREATE INDEX `products_category_idx` ON `products` (`category_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `signal_tags` (
	`signal_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`signal_id`, `tag_id`),
	FOREIGN KEY (`signal_id`) REFERENCES `signals`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `trend_tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `signals` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`type` text DEFAULT 'other' NOT NULL,
	`market_id` text,
	`company_id` text,
	`product_id` text,
	`category_id` text,
	`novelty` integer DEFAULT 3 NOT NULL,
	`impact` integer DEFAULT 3 NOT NULL,
	`confidence` integer DEFAULT 3 NOT NULL,
	`horizon` text DEFAULT 'now' NOT NULL,
	`so_what` text,
	`source_id` text,
	`occurred_at` text,
	`created_by` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `signals_company_idx` ON `signals` (`company_id`);--> statement-breakpoint
CREATE INDEX `signals_created_idx` ON `signals` (`created_at`);--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text,
	`type` text DEFAULT 'other' NOT NULL,
	`title` text NOT NULL,
	`publisher` text,
	`published_at` text,
	`fetched_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`reliability` integer DEFAULT 3 NOT NULL,
	`excerpt` text,
	`company_id` text,
	`product_id` text,
	`notes` text,
	`created_by` text
);
--> statement-breakpoint
CREATE TABLE `swot_items` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`quadrant` text NOT NULL,
	`text` text NOT NULL,
	`origin` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`author_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `trend_tags` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name_et` text NOT NULL,
	`name_en` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trend_tags_code_unique` ON `trend_tags` (`code`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	`last_login_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `value_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`kind` text NOT NULL,
	`text` text NOT NULL,
	`original_text` text,
	`tone` text,
	`message_type` text,
	`origin` text DEFAULT 'manual' NOT NULL,
	`source_id` text,
	`author_id` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
