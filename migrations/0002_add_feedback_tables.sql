CREATE TABLE "feedback_questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"mission_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" text DEFAULT 'rating' NOT NULL,
	"options" jsonb,
	"order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "feedback_response_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"participant_id" integer NOT NULL,
	"token" varchar NOT NULL,
	"sent_at" timestamp,
	"sent_via" text,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "feedback_response_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "feedback_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"token_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"rating_value" integer,
	"text_value" text,
	"selected_options" jsonb,
	"boolean_value" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ALTER COLUMN "contract_status" SET DEFAULT 'prospect';--> statement-breakpoint
ALTER TABLE "feedback_questionnaires" ADD CONSTRAINT "feedback_questionnaires_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_questions" ADD CONSTRAINT "feedback_questions_questionnaire_id_feedback_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."feedback_questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_response_tokens" ADD CONSTRAINT "feedback_response_tokens_questionnaire_id_feedback_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."feedback_questionnaires"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_response_tokens" ADD CONSTRAINT "feedback_response_tokens_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_token_id_feedback_response_tokens_id_fk" FOREIGN KEY ("token_id") REFERENCES "public"."feedback_response_tokens"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_responses" ADD CONSTRAINT "feedback_responses_question_id_feedback_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."feedback_questions"("id") ON DELETE no action ON UPDATE no action;