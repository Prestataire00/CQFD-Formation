CREATE TABLE "badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"category" text NOT NULL,
	"rarity" text DEFAULT 'common' NOT NULL,
	"condition" text NOT NULL,
	"condition_type" text NOT NULL,
	"condition_value" integer NOT NULL,
	"xp_reward" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_template_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"version" integer NOT NULL,
	"url" text NOT NULL,
	"uploaded_by" varchar,
	"change_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"for_role" text NOT NULL,
	"url" text NOT NULL,
	"description" text,
	"version" integer DEFAULT 1 NOT NULL,
	"client_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "in_app_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"mission_id" integer,
	"reminder_id" integer,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "mission_trainers" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"trainer_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reminder_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"reminder_type" text NOT NULL,
	"days_before" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_subject" text,
	"email_template" text,
	"notify_admin" boolean DEFAULT false NOT NULL,
	"notify_trainer" boolean DEFAULT false NOT NULL,
	"notify_client" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_id" integer,
	"mission_id" integer,
	"task_id" integer,
	"scheduled_date" timestamp NOT NULL,
	"sent_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_email" text,
	"recipient_name" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "template_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"badge_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"notified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "xp_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" integer NOT NULL,
	"action_type" text NOT NULL,
	"reason" text NOT NULL,
	"entity_type" text,
	"entity_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "contract_status" text DEFAULT 'negotiation' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "contract_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "assigned_trainer_id" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "demand" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "template_id" integer;--> statement-breakpoint
ALTER TABLE "mission_participants" ADD COLUMN "positioning_questionnaire_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "mission_participants" ADD COLUMN "positioning_questionnaire_received_at" timestamp;--> statement-breakpoint
ALTER TABLE "mission_participants" ADD COLUMN "evaluation_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "mission_participants" ADD COLUMN "evaluation_received_at" timestamp;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "assignee_id" varchar;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "comment_author_id" varchar;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "comment_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD COLUMN "created_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "parent_mission_id" integer;--> statement-breakpoint
ALTER TABLE "missions" ADD COLUMN "is_original" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_level" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_xp" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak_days" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_activity_date" timestamp;--> statement-breakpoint
ALTER TABLE "document_template_versions" ADD CONSTRAINT "document_template_versions_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_template_versions" ADD CONSTRAINT "document_template_versions_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "in_app_notifications" ADD CONSTRAINT "in_app_notifications_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_trainers" ADD CONSTRAINT "mission_trainers_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_trainers" ADD CONSTRAINT "mission_trainers_trainer_id_users_id_fk" FOREIGN KEY ("trainer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_setting_id_reminder_settings_id_fk" FOREIGN KEY ("setting_id") REFERENCES "public"."reminder_settings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_task_id_mission_steps_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."mission_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_notifications" ADD CONSTRAINT "template_notifications_template_id_document_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."document_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_notifications" ADD CONSTRAINT "template_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD CONSTRAINT "mission_steps_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mission_steps" ADD CONSTRAINT "mission_steps_comment_author_id_users_id_fk" FOREIGN KEY ("comment_author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;