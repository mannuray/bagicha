-- Google sign-in replaces phone + OTP. This release only adds, so the server
-- still running until the deploy (which reads phone_number) keeps working and a
-- rollback stays possible. A later release drops phone_number once nothing
-- reads it. Deletes no rows and touches no trigger.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "email" TEXT,
ADD COLUMN "google_sub" TEXT;

-- New Google accounts have no phone number.
ALTER TABLE "users" ALTER COLUMN "phone_number" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_sub_key" ON "users"("google_sub");
