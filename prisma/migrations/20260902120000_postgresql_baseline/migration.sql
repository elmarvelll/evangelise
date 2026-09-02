-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "livestream_status" AS ENUM ('LIVE', 'SCHEDULED', 'ENDED');

-- CreateEnum
CREATE TYPE "StreamCategory" AS ENUM ('Music', 'Ministry', 'Teaching', 'Discussion', 'Prayer', 'Gospel', 'Other');

-- CreateEnum
CREATE TYPE "StreamGenre" AS ENUM ('Ministering', 'Worship', 'Prayer', 'BibleStudy', 'Teaching', 'Testimony', 'GospelMusic', 'Evangelism', 'Fellowship', 'Other');

-- CreateEnum
CREATE TYPE "ReportTargetType" AS ENUM ('LIVESTREAM', 'COMMENT');

-- CreateTable
CREATE TABLE "livestream" (
    "id" TEXT NOT NULL,
    "sessionName" TEXT NOT NULL,
    "sessionDescription" TEXT NOT NULL,
    "selectedTags" JSONB NOT NULL,
    "category" "StreamCategory" NOT NULL DEFAULT 'Other',
    "genre" "StreamGenre" NOT NULL DEFAULT 'Other',
    "thumbnailUrl" TEXT,
    "interactionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "status" "livestream_status" NOT NULL,
    "scheduleDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "peakViewerCount" INTEGER NOT NULL DEFAULT 0,
    "totalViewCount" INTEGER NOT NULL DEFAULT 0,
    "donationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "donationBankName" TEXT,
    "donationAccountName" TEXT,
    "donationAccountNumber" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "livestream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "livestreamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "livestream_userId_idx" ON "livestream"("userId");

-- CreateIndex
CREATE INDEX "livestream_category_idx" ON "livestream"("category");

-- CreateIndex
CREATE INDEX "livestream_genre_idx" ON "livestream"("genre");

-- CreateIndex
CREATE INDEX "livestream_startedAt_idx" ON "livestream"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "Comment_livestreamId_idx" ON "Comment"("livestreamId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "livestream" ADD CONSTRAINT "Livestream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_livestreamId_fkey" FOREIGN KEY ("livestreamId") REFERENCES "livestream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

