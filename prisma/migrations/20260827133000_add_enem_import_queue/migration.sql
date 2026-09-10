-- CreateTable
CREATE TABLE "EnemImportSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER,
    "title" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "localPath" TEXT,
    "downloadedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuestionImportDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "externalRef" TEXT,
    "year" INTEGER,
    "questionNumber" INTEGER,
    "rawText" TEXT NOT NULL,
    "statement" TEXT,
    "alternativesJson" TEXT,
    "answerLabel" TEXT,
    "areaName" TEXT,
    "subjectName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'EXTRACTED',
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionImportDraft_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "EnemImportSource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "EnemImportSource_sourceUrl_key" ON "EnemImportSource"("sourceUrl");

-- CreateIndex
CREATE INDEX "EnemImportSource_year_idx" ON "EnemImportSource"("year");

-- CreateIndex
CREATE INDEX "EnemImportSource_status_idx" ON "EnemImportSource"("status");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionImportDraft_sourceId_questionNumber_key" ON "QuestionImportDraft"("sourceId", "questionNumber");

-- CreateIndex
CREATE INDEX "QuestionImportDraft_year_idx" ON "QuestionImportDraft"("year");

-- CreateIndex
CREATE INDEX "QuestionImportDraft_status_idx" ON "QuestionImportDraft"("status");
