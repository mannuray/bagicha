-- Google sign-in replaces phone + OTP. Adds the Google columns, then drops the
-- phone column. Deletes no rows and touches no trigger.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" TEXT,
ADD COLUMN "google_sub" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");

-- DropIndex
DROP INDEX IF EXISTS "users_phone_number_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone_number";
