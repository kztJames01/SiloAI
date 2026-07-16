-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FIELD');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';
