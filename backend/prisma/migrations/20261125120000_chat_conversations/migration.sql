-- CreateTable
CREATE TABLE "conversations" (
    "user_a" TEXT NOT NULL,
    "user_b" TEXT NOT NULL,
    "last_message_id" TEXT NOT NULL,
    "last_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("user_a","user_b")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_last_message_id_key" ON "conversations"("last_message_id");

-- CreateIndex
CREATE INDEX "conversations_user_a_last_at_idx" ON "conversations"("user_a", "last_at");

-- CreateIndex
CREATE INDEX "conversations_user_b_last_at_idx" ON "conversations"("user_b", "last_at");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: the latest message of every existing pair.
INSERT INTO "conversations" ("user_a", "user_b", "last_message_id", "last_at")
SELECT DISTINCT ON (LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id"))
    LEAST("sender_id", "receiver_id"),
    GREATEST("sender_id", "receiver_id"),
    "id",
    "created_at"
FROM "messages"
ORDER BY LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id"), "created_at" DESC, "id" DESC;
