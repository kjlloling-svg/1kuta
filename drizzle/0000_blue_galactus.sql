CREATE TABLE `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `authors_name_idx` ON `authors` (`name`);--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`major` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `program_slug_unique` ON `programs` (`slug`);--> statement-breakpoint
CREATE TABLE `research_paper_authors` (
	`paper_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`paper_id`, `author_id`),
	FOREIGN KEY (`paper_id`) REFERENCES `research_papers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `paper_authors_author_idx` ON `research_paper_authors` (`author_id`);--> statement-breakpoint
CREATE TABLE `research_papers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`abstract` text,
	`keywords` text,
	`year` integer NOT NULL,
	`program_id` integer NOT NULL,
	`adviser` text,
	`paper_type` text DEFAULT 'Research Paper' NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `paper_slug_unique` ON `research_papers` (`slug`);--> statement-breakpoint
CREATE INDEX `paper_year_program_idx` ON `research_papers` (`year`,`program_id`);--> statement-breakpoint
CREATE INDEX `paper_title_idx` ON `research_papers` (`title`);