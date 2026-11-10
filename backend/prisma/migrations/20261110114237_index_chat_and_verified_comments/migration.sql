-- CreateIndex
CREATE INDEX "comments_is_expert_verified_is_hidden_created_at_idx" ON "comments"("is_expert_verified", "is_hidden", "created_at");

-- CreateIndex
CREATE INDEX "messages_sender_id_receiver_id_created_at_idx" ON "messages"("sender_id", "receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_receiver_id_created_at_idx" ON "messages"("receiver_id", "created_at");
