CREATE TABLE `subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`provider` text,
	`amount` integer NOT NULL,
	`frequency` text NOT NULL,
	`category_id` integer,
	`start_date` text NOT NULL,
	`next_renewal_date` text NOT NULL,
	`cancelled_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
