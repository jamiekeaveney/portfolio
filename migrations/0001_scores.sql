CREATE TABLE `limits` (
	`network` text NOT NULL,
	`bucket` integer NOT NULL,
	`used` integer NOT NULL,
	PRIMARY KEY(`network`, `bucket`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`player` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`score` integer NOT NULL,
	`achieved_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`token` text PRIMARY KEY NOT NULL,
	`player` text NOT NULL,
	`started_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `round_expiry` ON `rounds` (`expires_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
