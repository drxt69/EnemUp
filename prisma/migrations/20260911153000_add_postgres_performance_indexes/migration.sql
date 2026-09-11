-- Performance indexes for Vercel/PostgreSQL dynamic pages.
CREATE INDEX "User_status_role_idx" ON "User"("status", "role");
CREATE INDEX "Session_userId_expires_idx" ON "Session"("userId", "expires");
CREATE INDEX "Subscription_userId_status_currentPeriodEnd_idx" ON "Subscription"("userId", "status", "currentPeriodEnd");
CREATE INDEX "Payment_userId_status_createdAt_idx" ON "Payment"("userId", "status", "createdAt");
CREATE INDEX "Question_isPublished_subjectId_idx" ON "Question"("isPublished", "subjectId");
CREATE INDEX "Question_isPublished_areaId_idx" ON "Question"("isPublished", "areaId");
CREATE INDEX "StudentAnswer_userId_isCorrect_idx" ON "StudentAnswer"("userId", "isCorrect");
CREATE INDEX "StudentAnswer_userId_answeredAt_idx" ON "StudentAnswer"("userId", "answeredAt");
CREATE INDEX "SimulationRun_userId_status_idx" ON "SimulationRun"("userId", "status");
CREATE INDEX "EssaySubmission_userId_submittedAt_idx" ON "EssaySubmission"("userId", "submittedAt");
CREATE INDEX "ProgressRecord_userId_metric_recordedAt_idx" ON "ProgressRecord"("userId", "metric", "recordedAt");
