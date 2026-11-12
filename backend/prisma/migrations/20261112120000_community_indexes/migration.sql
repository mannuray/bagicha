-- District feed, comment counts per post, and the author foreign keys.
CREATE INDEX "posts_district_is_hidden_created_at_idx" ON "posts"("district", "is_hidden", "created_at");
CREATE INDEX "posts_author_id_idx" ON "posts"("author_id");
CREATE INDEX "comments_post_id_is_hidden_idx" ON "comments"("post_id", "is_hidden");
CREATE INDEX "comments_author_id_idx" ON "comments"("author_id");
