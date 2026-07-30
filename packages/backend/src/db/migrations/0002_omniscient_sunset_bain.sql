ALTER TABLE `insurance_plans` ADD `effective_date` text NOT NULL DEFAULT '';--> statement-breakpoint
UPDATE `insurance_plans` SET `effective_date` = `renewal_date` WHERE `effective_date` = '';--> statement-breakpoint
ALTER TABLE `insurance_plans` ADD `cancelled_at` integer;