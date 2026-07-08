-- CreateEnum
CREATE TYPE "AgentFunction" AS ENUM ('sales', 'care', 'both');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'admin';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agentFunction" "AgentFunction";
