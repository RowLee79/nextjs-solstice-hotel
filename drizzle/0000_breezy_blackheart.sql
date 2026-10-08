CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`room_id` integer NOT NULL,
	`guest_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`check_in` text NOT NULL,
	`check_out` text NOT NULL,
	`adults` integer NOT NULL,
	`children` integer NOT NULL,
	`total_cents` integer NOT NULL,
	`status` text DEFAULT 'Confirmed' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_bookings_reference` ON `bookings` (`reference`);--> statement-breakpoint
CREATE INDEX `idx_bookings_room_dates` ON `bookings` (`room_id`,`check_in`,`check_out`);--> statement-breakpoint
CREATE INDEX `idx_bookings_email` ON `bookings` (`email`);--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`bed` text NOT NULL,
	`capacity` integer NOT NULL,
	`area` integer NOT NULL,
	`amenities` text NOT NULL,
	`nightly_cents` integer NOT NULL,
	`image_key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_room_types_name` ON `room_types` (`name`);--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type_id` integer NOT NULL,
	`code` text NOT NULL,
	`floor` integer NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	FOREIGN KEY (`type_id`) REFERENCES `room_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_rooms_code` ON `rooms` (`code`);--> statement-breakpoint
CREATE INDEX `idx_rooms_type_status` ON `rooms` (`type_id`,`status`);