CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`paper_id` integer NOT NULL,
	PRIMARY KEY(`user_id`, `paper_id`),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`paper_id`) REFERENCES `research_papers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `bookmarks_paper_idx` ON `bookmarks` (`paper_id`);--> statement-breakpoint
ALTER TABLE `programs` ADD `description` text;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `department` text;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `sections` text;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `file_key` text;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `file_name` text;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `file_size` integer;--> statement-breakpoint
ALTER TABLE `research_papers` ADD `status` text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'public' NOT NULL;