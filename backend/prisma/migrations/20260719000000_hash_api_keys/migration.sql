CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Hash existing plaintext API keys and store display prefix
ALTER TABLE "api_keys" ADD COLUMN "keyPrefix" TEXT NOT NULL DEFAULT '';

UPDATE "api_keys"
SET "keyPrefix" = substring("key", 1, 11) || '...'
WHERE "key" LIKE 'sk_%';

UPDATE "api_keys"
SET "key" = encode(digest("key", 'sha256'), 'hex')
WHERE "key" LIKE 'sk_%';
