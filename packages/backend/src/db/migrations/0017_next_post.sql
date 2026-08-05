PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_insurance_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`coverage_amount` integer,
	`excess_amount` integer,
	`premium_amount` integer NOT NULL,
	`premium_frequency` text NOT NULL,
	`effective_date` text NOT NULL,
	`renewal_date` text NOT NULL,
	`provider` text,
	`notes` text,
	`policy_number` text,
	`vehicle_registration` text,
	`postcode` text,
	`cancelled_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_insurance_plans`("id", "name", "type", "coverage_amount", "excess_amount", "premium_amount", "premium_frequency", "effective_date", "renewal_date", "provider", "notes", "policy_number", "vehicle_registration", "postcode", "cancelled_at", "created_at", "updated_at") SELECT "id", "name", "type", "coverage_amount", NULL, "premium_amount", "premium_frequency", "effective_date", "renewal_date", "provider", "notes", "policy_number", "vehicle_registration", "postcode", "cancelled_at", "created_at", "updated_at" FROM `insurance_plans`;--> statement-breakpoint
DROP TABLE `insurance_plans`;--> statement-breakpoint
ALTER TABLE `__new_insurance_plans` RENAME TO `insurance_plans`;--> statement-breakpoint
PRAGMA foreign_keys=ON;