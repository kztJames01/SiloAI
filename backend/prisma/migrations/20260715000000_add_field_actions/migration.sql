-- CreateTable
CREATE TABLE "field_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "notes" TEXT,
    "jobType" TEXT,
    "payload" JSONB,
    "workflowExecutionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_actions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "field_actions_userId_idx" ON "field_actions"("userId");

-- AddForeignKey
ALTER TABLE "field_actions" ADD CONSTRAINT "field_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
