/*
  Warnings:

  - You are about to drop the column `baseUrl` on the `integrations` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `integrations` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `integrations` table. All the data in the column will be lost.
  - You are about to drop the `user_integrations` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider]` on the table `integrations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `integrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `integrations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ERROR', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "LLMProvider" AS ENUM ('OPENAI', 'ANTHROPIC', 'GEMINI', 'OLLAMA', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AIDebugType" AS ENUM ('PROMPT', 'RESPONSE', 'ERROR', 'TOOL_CALL');

-- CreateEnum
CREATE TYPE "AgentExecutionStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "user_integrations" DROP CONSTRAINT "user_integrations_integrationId_fkey";

-- DropIndex
DROP INDEX "integrations_name_key";

-- AlterTable
ALTER TABLE "integrations" DROP COLUMN "baseUrl",
DROP COLUMN "displayName",
DROP COLUMN "iconUrl",
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "docUrl" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "user_integrations";

-- CreateTable
CREATE TABLE "integration_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "credentials" TEXT NOT NULL,
    "status" "ConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsed" TIMESTAMP(3),
    "lastTested" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "duration" INTEGER NOT NULL,
    "requestId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth2_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth2_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_configurations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" "LLMProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "apiKey" TEXT,
    "baseUrl" TEXT,
    "temperature" DOUBLE PRECISION DEFAULT 0.7,
    "maxTokens" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "systemPrompt" TEXT,
    "variables" JSONB NOT NULL,
    "examples" JSONB,
    "category" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_contexts" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "variables" JSONB NOT NULL,
    "metadata" JSONB,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workflowId" TEXT,
    "executionId" TEXT,
    "nodeId" TEXT,
    "provider" "LLMProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_debug_logs" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "type" "AIDebugType" NOT NULL,
    "provider" "LLMProvider" NOT NULL,
    "model" TEXT NOT NULL,
    "messages" JSONB,
    "response" JSONB,
    "error" TEXT,
    "latency" INTEGER NOT NULL,
    "tokenUsage" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_debug_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "llmProvider" "LLMProvider" NOT NULL,
    "llmModel" TEXT NOT NULL,
    "tools" JSONB,
    "maxIterations" INTEGER NOT NULL DEFAULT 5,
    "enableMemory" BOOLEAN NOT NULL DEFAULT false,
    "ragConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agent_executions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "steps" JSONB NOT NULL,
    "status" "AgentExecutionStatus" NOT NULL DEFAULT 'RUNNING',
    "error" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ai_agent_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "indexName" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_connections_userId_idx" ON "integration_connections"("userId");

-- CreateIndex
CREATE INDEX "integration_connections_integrationId_idx" ON "integration_connections"("integrationId");

-- CreateIndex
CREATE INDEX "integration_connections_status_idx" ON "integration_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "integration_connections_userId_integrationId_name_key" ON "integration_connections"("userId", "integrationId", "name");

-- CreateIndex
CREATE INDEX "integration_logs_userId_idx" ON "integration_logs"("userId");

-- CreateIndex
CREATE INDEX "integration_logs_connectionId_idx" ON "integration_logs"("connectionId");

-- CreateIndex
CREATE INDEX "integration_logs_provider_idx" ON "integration_logs"("provider");

-- CreateIndex
CREATE INDEX "integration_logs_timestamp_idx" ON "integration_logs"("timestamp");

-- CreateIndex
CREATE INDEX "oauth2_tokens_userId_idx" ON "oauth2_tokens"("userId");

-- CreateIndex
CREATE INDEX "oauth2_tokens_expiresAt_idx" ON "oauth2_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth2_tokens_userId_provider_key" ON "oauth2_tokens"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "ai_contexts_conversationId_key" ON "ai_contexts"("conversationId");

-- CreateIndex
CREATE INDEX "ai_contexts_userId_idx" ON "ai_contexts"("userId");

-- CreateIndex
CREATE INDEX "ai_contexts_lastAccessedAt_idx" ON "ai_contexts"("lastAccessedAt");

-- CreateIndex
CREATE INDEX "token_usage_logs_userId_idx" ON "token_usage_logs"("userId");

-- CreateIndex
CREATE INDEX "token_usage_logs_workflowId_idx" ON "token_usage_logs"("workflowId");

-- CreateIndex
CREATE INDEX "token_usage_logs_executionId_idx" ON "token_usage_logs"("executionId");

-- CreateIndex
CREATE INDEX "token_usage_logs_timestamp_idx" ON "token_usage_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ai_debug_logs_executionId_idx" ON "ai_debug_logs"("executionId");

-- CreateIndex
CREATE INDEX "ai_debug_logs_nodeId_idx" ON "ai_debug_logs"("nodeId");

-- CreateIndex
CREATE INDEX "ai_debug_logs_timestamp_idx" ON "ai_debug_logs"("timestamp");

-- CreateIndex
CREATE INDEX "ai_agent_executions_agentId_idx" ON "ai_agent_executions"("agentId");

-- CreateIndex
CREATE INDEX "ai_agent_executions_status_idx" ON "ai_agent_executions"("status");

-- CreateIndex
CREATE INDEX "rag_documents_userId_idx" ON "rag_documents"("userId");

-- CreateIndex
CREATE INDEX "rag_documents_indexName_idx" ON "rag_documents"("indexName");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_provider_key" ON "integrations"("provider");

-- AddForeignKey
ALTER TABLE "integration_connections" ADD CONSTRAINT "integration_connections_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agent_executions" ADD CONSTRAINT "ai_agent_executions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
