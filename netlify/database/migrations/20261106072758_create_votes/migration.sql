CREATE TABLE "votes" (
	"id" serial PRIMARY KEY,
	"voter_id" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"name_key" text NOT NULL UNIQUE,
	"choice" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
