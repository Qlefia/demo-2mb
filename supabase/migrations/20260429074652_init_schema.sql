CREATE TYPE "public"."activity_type" AS ENUM('stage_change', 'owner_change', 'audit', 'call', 'email', 'linkedin', 'note', 'dossier_delivered', 'opt_out', 'task_completed');--> statement-breakpoint
CREATE TYPE "public"."dossier_status" AS ENUM('draft', 'in_review', 'ready', 'archived');--> statement-breakpoint
CREATE TYPE "public"."enrichment_job_status" AS ENUM('queued', 'running', 'success', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lost_reason" AS ENUM('icp_mismatch', 'no_budget', 'no_timing', 'competitor_won', 'no_response', 'other');--> statement-breakpoint
CREATE TYPE "public"."prospect_source" AS ENUM('inbound_form', 'linkedin_outreach', 'competitionline', 'immobilienmanager', 'propertyweek', 'manual', 'referral');--> statement-breakpoint
CREATE TYPE "public"."prospect_stage" AS ENUM('new', 'triaged', 'enriching', 'dossier_in_progress', 'dossier_ready', '1st_call', 'meeting_scheduled', 'proposal_sent', 'won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."public_private" AS ENUM('public', 'private', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."territory" AS ENUM('DE', 'UK', 'EU_other');--> statement-breakpoint
CREATE TYPE "public"."triage_decision" AS ENUM('accept', 'reject');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_form" text,
	"hq_country" text,
	"hq_city" text,
	"employees" integer,
	"founded_year" integer,
	"website" text,
	"public_private" "public_private" DEFAULT 'unknown' NOT NULL,
	"opt_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"actor_id" uuid,
	"type" "activity_type" NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- auth.users is managed by Supabase Auth and already exists in this project.
-- The Drizzle pgSchema('auth').table('users') definition is for FK references only.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"full_name" text NOT NULL,
	"role" text,
	"email" "citext",
	"phone" text,
	"linkedin_url" text,
	"languages" text[],
	"opt_out_at" timestamp with time zone,
	"source_provider" text,
	"source_fetched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dossiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"status" "dossier_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"sections" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ai_metadata" jsonb,
	"suggested_playbook_id" uuid,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dossier_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dossier_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"sections_diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrichment_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"query_hash" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ttl_seconds" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrichment_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"job_key" text NOT NULL,
	"status" "enrichment_job_status" DEFAULT 'queued' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "playbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"language" text NOT NULL,
	"body" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "prospects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"owner_id" uuid,
	"source" "prospect_source" NOT NULL,
	"territory" "territory" NOT NULL,
	"stage" "prospect_stage" DEFAULT 'new' NOT NULL,
	"priority" smallint DEFAULT 3 NOT NULL,
	"triage_decision" "triage_decision",
	"lost_reason" "lost_reason",
	"suggested_playbook_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"prospect_id" uuid,
	"type" text NOT NULL,
	"source_url" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prospect_id" uuid,
	"assignee_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"due_at" timestamp with time zone,
	"playbook_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_suggested_playbook_id_playbooks_id_fk" FOREIGN KEY ("suggested_playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dossier_versions" ADD CONSTRAINT "dossier_versions_dossier_id_dossiers_id_fk" FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dossier_versions" ADD CONSTRAINT "dossier_versions_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrichment_jobs" ADD CONSTRAINT "enrichment_jobs_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prospects" ADD CONSTRAINT "prospects_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prospects" ADD CONSTRAINT "prospects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "prospects" ADD CONSTRAINT "prospects_suggested_playbook_id_playbooks_id_fk" FOREIGN KEY ("suggested_playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "triggers" ADD CONSTRAINT "triggers_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "triggers" ADD CONSTRAINT "triggers_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tasks" ADD CONSTRAINT "tasks_playbook_id_playbooks_id_fk" FOREIGN KEY ("playbook_id") REFERENCES "public"."playbooks"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_name_idx" ON "accounts" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_website_unique" ON "accounts" USING btree ("website") WHERE "accounts"."website" is not null;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "activities_prospect_id_created_at_idx" ON "activities" USING btree ("prospect_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_account_id_idx" ON "contacts" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dossiers_prospect_id_unique" ON "dossiers" USING btree ("prospect_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "dossier_versions_dossier_version_unique" ON "dossier_versions" USING btree ("dossier_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enrichment_cache_provider_query_hash_unique" ON "enrichment_cache" USING btree ("provider","query_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_cache_fetched_at_idx" ON "enrichment_cache" USING btree ("fetched_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "enrichment_jobs_job_key_unique" ON "enrichment_jobs" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_jobs_prospect_id_idx" ON "enrichment_jobs" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "enrichment_jobs_status_idx" ON "enrichment_jobs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "playbooks_name_lang_version_unique" ON "playbooks" USING btree ("name","language","version");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_stage_idx" ON "prospects" USING btree ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_territory_stage_idx" ON "prospects" USING btree ("territory","stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_owner_id_idx" ON "prospects" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "prospects_account_id_idx" ON "prospects" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "triggers_account_id_idx" ON "triggers" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "triggers_prospect_id_idx" ON "triggers" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "triggers_occurred_at_idx" ON "triggers" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_assignee_status_idx" ON "tasks" USING btree ("assignee_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_prospect_id_idx" ON "tasks" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_due_at_idx" ON "tasks" USING btree ("due_at");--> statement-breakpoint
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "prospects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "triggers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dossiers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "dossier_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "playbooks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enrichment_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "enrichment_jobs" ENABLE ROW LEVEL SECURITY;