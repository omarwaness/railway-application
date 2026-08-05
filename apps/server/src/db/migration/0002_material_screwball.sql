CREATE TABLE "railway_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"encrypted_token" text NOT NULL,
	"last4" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "railway_token_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "railway_token" ADD CONSTRAINT "railway_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;