-- Query indexes for question filters and latest student answers.
CREATE INDEX "Question_isPublished_difficulty_idx" ON "Question"("isPublished", "difficulty");
CREATE INDEX "Question_isPublished_subjectId_difficulty_id_idx" ON "Question"("isPublished", "subjectId", "difficulty", "id");
CREATE INDEX "Question_isPublished_areaId_difficulty_id_idx" ON "Question"("isPublished", "areaId", "difficulty", "id");
CREATE INDEX "StudentAnswer_userId_questionId_answeredAt_idx" ON "StudentAnswer"("userId", "questionId", "answeredAt");
