import { sqliteTable, integer, text, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const programs = sqliteTable('programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  major: text('major'),
  description: text('description'),
}, (t) => [uniqueIndex('program_slug_unique').on(t.slug)]);

export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  givenName: text('given_name'),
  familyName: text('family_name'),
  suffix: text('suffix'),
}, (t) => [index('authors_name_idx').on(t.name)]);

export const researchPapers = sqliteTable('research_papers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  title: text('title').notNull(),
  abstract: text('abstract'),
  keywords: text('keywords'),
  year: integer('year').notNull(),
  programId: integer('program_id').notNull().references(() => programs.id),
  paperType: text('paper_type').notNull().default('Research Paper'),
  department: text('department'),
  fullText: text('full_text'),
  fileKey: text('file_key'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(''),
}, (t) => [uniqueIndex('paper_slug_unique').on(t.slug), index('paper_year_program_idx').on(t.year, t.programId), index('paper_title_idx').on(t.title)]);

export const researchPaperAuthors = sqliteTable('research_paper_authors', {
  paperId: integer('paper_id').notNull().references(() => researchPapers.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => authors.id),
  position: integer('position').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.paperId, t.authorId] }), index('paper_authors_author_idx').on(t.authorId)]);

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  googleSub: text('google_sub').unique(),
  picture: text('picture'),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text('role').notNull().default('public'),
  createdAt: integer('created_at').notNull(),
}, (t) => [uniqueIndex('users_email_unique').on(t.email)]);

export const sessions = sqliteTable('sessions', {
  tokenHash: text('token_hash').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
}, (t) => [index('sessions_user_idx').on(t.userId)]);

export const loginAttempts = sqliteTable('login_attempts', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  windowStart: integer('window_start').notNull(),
});

export const bookmarks = sqliteTable('bookmarks', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  paperId: integer('paper_id').notNull().references(() => researchPapers.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.userId, t.paperId] }), index('bookmarks_paper_idx').on(t.paperId)]);

