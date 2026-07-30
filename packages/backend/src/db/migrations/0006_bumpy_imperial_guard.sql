CREATE TABLE `app_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_name` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `vendors` (`name`, `created_at`, `updated_at`)
SELECT 'Unknown', unixepoch() * 1000, unixepoch() * 1000
WHERE NOT EXISTS (SELECT 1 FROM `vendors` WHERE `name` = 'Unknown')
	AND EXISTS (SELECT 1 FROM `categorisation_rules` WHERE `vendor_id` IS NULL);
--> statement-breakpoint
UPDATE `categorisation_rules`
SET `vendor_id` = (SELECT `id` FROM `vendors` WHERE `name` = 'Unknown')
WHERE `vendor_id` IS NULL;
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categorisation_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pattern` text NOT NULL,
	`category_id` integer NOT NULL,
	`vendor_id` integer NOT NULL,
	`match_type` text DEFAULT 'fuzzy' NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`source` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_categorisation_rules`("id", "pattern", "category_id", "vendor_id", "match_type", "priority", "source", "created_at", "updated_at") SELECT "id", "pattern", "category_id", "vendor_id", "match_type", "priority", "source", "created_at", "updated_at" FROM `categorisation_rules`;--> statement-breakpoint
DROP TABLE `categorisation_rules`;--> statement-breakpoint
ALTER TABLE `__new_categorisation_rules` RENAME TO `categorisation_rules`;--> statement-breakpoint
PRAGMA foreign_keys=ON;