ALTER TABLE `companies` ADD `listing_status` text DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` ADD `stock_exchange` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `ticker` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `listed_entity` text;