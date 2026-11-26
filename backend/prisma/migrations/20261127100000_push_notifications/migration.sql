-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('ANDROID');

-- CreateEnum
CREATE TYPE "ReminderSlot" AS ENUM ('MORNING', 'EVENING');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "reminder_evening_min" SMALLINT DEFAULT 1080,
ADD COLUMN     "reminder_morning_min" SMALLINT DEFAULT 420;

-- CreateTable
CREATE TABLE "push_devices" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminder_sends" (
    "user_id" TEXT NOT NULL,
    "slot" "ReminderSlot" NOT NULL,
    "ist_date" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminder_sends_pkey" PRIMARY KEY ("user_id","slot","ist_date")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_devices_token_key" ON "push_devices"("token");

-- CreateIndex
CREATE INDEX "push_devices_user_id_idx" ON "push_devices"("user_id");

-- CreateIndex
CREATE INDEX "push_devices_last_seen_at_idx" ON "push_devices"("last_seen_at");

-- CreateIndex
CREATE INDEX "reminder_sends_created_at_idx" ON "reminder_sends"("created_at");

-- CreateIndex
CREATE INDEX "users_reminder_morning_min_idx" ON "users"("reminder_morning_min");

-- CreateIndex
CREATE INDEX "users_reminder_evening_min_idx" ON "users"("reminder_evening_min");

-- AddForeignKey
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder_sends" ADD CONSTRAINT "reminder_sends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

