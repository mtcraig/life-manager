CREATE TABLE `vendors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_name_unique` ON `vendors` (`name`);--> statement-breakpoint
ALTER TABLE `categorisation_rules` ADD `vendor_id` integer REFERENCES vendors(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `vendor_id` integer REFERENCES vendors(id);--> statement-breakpoint
ALTER TABLE `transactions` ADD `vendor_source` text;