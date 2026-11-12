-- Sign-out: tokens carry this version; bumping it revokes every issued token.
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
