-- Add typology and trainer_role columns to task_explanations
-- to allow different consignes per typology/role combination
ALTER TABLE "task_explanations" ADD COLUMN "typology" text;
ALTER TABLE "task_explanations" ADD COLUMN "trainer_role" text;

-- Drop the old unique constraint on task_name alone (may be named _unique or _key)
ALTER TABLE "task_explanations" DROP CONSTRAINT IF EXISTS "task_explanations_task_name_unique";
ALTER TABLE "task_explanations" DROP CONSTRAINT IF EXISTS "task_explanations_task_name_key";

-- Add a new unique constraint on the triplet (task_name, typology, trainer_role)
CREATE UNIQUE INDEX "task_explanations_name_typo_role_idx" ON "task_explanations" (
  "task_name",
  COALESCE("typology", ''),
  COALESCE("trainer_role", '')
);
