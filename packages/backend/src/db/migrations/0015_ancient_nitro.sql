CREATE TABLE `utility_tariffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`meter_type` text NOT NULL,
	`provider_name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`standing_charge_per_day` real NOT NULL,
	`unit_rate` real NOT NULL,
	`wastewater_standing_charge_per_day` real,
	`wastewater_unit_rate` real,
	`rainwater_removal_standing_charge_per_day` real,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
