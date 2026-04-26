CREATE TYPE "DiagnosisSubjectType" AS ENUM ('TREE', 'CROP_SEASON', 'FLOWER_SEASON');
CREATE TYPE "DiagnosisStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');
CREATE TYPE "DiagnosisIssueType" AS ENUM ('PEST', 'DISEASE', 'NUTRIENT', 'WATER_STRESS', 'WEATHER_DAMAGE', 'FRUIT_DROP', 'FLOWER_DROP', 'UNKNOWN');
CREATE TYPE "DiagnosisSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'UNKNOWN');

CREATE TABLE "diagnosis_sessions" (
  "id" TEXT NOT NULL,
  "subject_type" "DiagnosisSubjectType" NOT NULL,
  "subject_id" TEXT NOT NULL,
  "tree_id" TEXT,
  "status" "DiagnosisStatus" NOT NULL DEFAULT 'OPEN',
  "messages" JSONB,
  "attachments" JSONB,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "diagnosis_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "diagnosis_outcomes" (
  "id" TEXT NOT NULL,
  "session_id" TEXT NOT NULL,
  "tree_id" TEXT,
  "event_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "primary_issue" "DiagnosisIssueType" NOT NULL DEFAULT 'UNKNOWN',
  "secondary_issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "symptoms" JSONB,
  "confidence" TEXT,
  "severity" "DiagnosisSeverity" NOT NULL DEFAULT 'UNKNOWN',
  "affected_part" TEXT,
  "reasoning_summary" TEXT,
  "recommended_actions" JSONB,
  "needs_follow_up" BOOLEAN NOT NULL DEFAULT false,
  "follow_up_days" INTEGER,
  "attachments" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "diagnosis_outcomes_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tree_logs" ADD COLUMN "diagnosis_outcome_id" TEXT;
ALTER TABLE "tasks" ADD COLUMN "diagnosis_outcome_id" TEXT;

CREATE INDEX "diagnosis_sessions_subject_type_subject_id_status_idx" ON "diagnosis_sessions"("subject_type", "subject_id", "status");
CREATE INDEX "diagnosis_sessions_tree_id_created_at_idx" ON "diagnosis_sessions"("tree_id", "created_at");
CREATE INDEX "diagnosis_outcomes_session_id_idx" ON "diagnosis_outcomes"("session_id");
CREATE INDEX "diagnosis_outcomes_tree_id_event_at_idx" ON "diagnosis_outcomes"("tree_id", "event_at");
CREATE INDEX "diagnosis_outcomes_primary_issue_severity_idx" ON "diagnosis_outcomes"("primary_issue", "severity");
CREATE INDEX "tree_logs_diagnosis_outcome_id_idx" ON "tree_logs"("diagnosis_outcome_id");
CREATE INDEX "tasks_diagnosis_outcome_id_idx" ON "tasks"("diagnosis_outcome_id");

ALTER TABLE "diagnosis_sessions"
ADD CONSTRAINT "diagnosis_sessions_tree_id_fkey"
FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "diagnosis_outcomes"
ADD CONSTRAINT "diagnosis_outcomes_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "diagnosis_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "diagnosis_outcomes"
ADD CONSTRAINT "diagnosis_outcomes_tree_id_fkey"
FOREIGN KEY ("tree_id") REFERENCES "trees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tree_logs"
ADD CONSTRAINT "tree_logs_diagnosis_outcome_id_fkey"
FOREIGN KEY ("diagnosis_outcome_id") REFERENCES "diagnosis_outcomes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_diagnosis_outcome_id_fkey"
FOREIGN KEY ("diagnosis_outcome_id") REFERENCES "diagnosis_outcomes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
