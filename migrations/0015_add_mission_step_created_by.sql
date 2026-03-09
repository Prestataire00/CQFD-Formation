ALTER TABLE "mission_steps" ADD COLUMN "created_by" varchar REFERENCES "users"("id");
