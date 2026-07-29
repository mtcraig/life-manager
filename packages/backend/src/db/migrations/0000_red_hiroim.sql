CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`institution` text,
	`ingestion_mode` text DEFAULT 'manual' NOT NULL,
	`folder_path` text,
	`column_mapping` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_name_unique` ON `accounts` (`name`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`is_transfer` integer DEFAULT false NOT NULL,
	`kind` text,
	`color` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `categorisation_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pattern` text NOT NULL,
	`category_id` integer NOT NULL,
	`match_type` text DEFAULT 'fuzzy' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`date` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`normalized_description` text NOT NULL,
	`category_id` integer,
	`category_source` text,
	`matched_rule_id` integer,
	`dedupe_hash` text NOT NULL,
	`raw_csv_row` text,
	`imported_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`matched_rule_id`) REFERENCES `categorisation_rules`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_account_dedupe_unique` ON `transactions` (`account_id`,`dedupe_hash`);--> statement-breakpoint
CREATE TABLE `investment_valuations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`investment_id` integer NOT NULL,
	`as_of_date` text NOT NULL,
	`value` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`investment_id`) REFERENCES `investments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `investment_valuations_unique` ON `investment_valuations` (`investment_id`,`as_of_date`);--> statement-breakpoint
CREATE TABLE `investments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text,
	`notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `property_valuations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`property_id` integer NOT NULL,
	`as_of_date` text NOT NULL,
	`value` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `property_valuations_unique` ON `property_valuations` (`property_id`,`as_of_date`);--> statement-breakpoint
CREATE TABLE `liabilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`kind` text,
	`notes` text,
	`archived_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `liability_valuations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`liability_id` integer NOT NULL,
	`as_of_date` text NOT NULL,
	`value` integer NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`liability_id`) REFERENCES `liabilities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `liability_valuations_unique` ON `liability_valuations` (`liability_id`,`as_of_date`);--> statement-breakpoint
CREATE TABLE `projection_scenarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`growth_rate_pct` real NOT NULL,
	`monthly_contribution` integer DEFAULT 0 NOT NULL,
	`retirement_age` integer,
	`retirement_date` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `insurance_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`coverage_amount` integer NOT NULL,
	`premium_amount` integer NOT NULL,
	`premium_frequency` text NOT NULL,
	`renewal_date` text NOT NULL,
	`provider` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `areas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `areas_name_unique` ON `areas` (`name`);--> statement-breakpoint
CREATE TABLE `contents_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`area_id` integer NOT NULL,
	`value` integer NOT NULL,
	`purchase_date` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`area_id`) REFERENCES `areas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `energy_readings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meter_type` text NOT NULL,
	`reading_date` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`notes` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `energy_readings_unique` ON `energy_readings` (`meter_type`,`reading_date`);--> statement-breakpoint
CREATE TABLE `ingestion_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer,
	`source` text NOT NULL,
	`file_name` text NOT NULL,
	`status` text NOT NULL,
	`rows_ingested` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`ran_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
