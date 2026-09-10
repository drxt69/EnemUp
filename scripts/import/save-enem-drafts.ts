import "dotenv/config";
import { readFileSync } from "node:fs";
import { prisma } from "../../src/lib/prisma";

const inputPath = process.argv[2] ?? "data/enem-imports/extracted-drafts.json";
const drafts = JSON.parse(readFileSync(inputPath, "utf-8")) as Array<{
  source: {
    title: string;
    sourceUrl: string;
    assetType: string;
    year?: number | null;
    localPath?: string;
  };
  questionNumber?: number;
  externalRef?: string | null;
  answerLabel?: string | null;
  rawText: string;
  status?: string;
  confidence?: number;
}>;

function guessAnswerLabel(rawText: string, importedAnswer?: string | null) {
  if (importedAnswer?.match(/^[A-E]$/)) {
    return importedAnswer;
  }

  const match = rawText.match(/GABARITO\s*[:.-]?\s*([A-E])/i);
  return match?.[1]?.toUpperCase() ?? null;
}

async function main() {
  let saved = 0;

  for (const draft of drafts) {
    const source = await prisma.enemImportSource.upsert({
      where: { sourceUrl: draft.source.sourceUrl },
      update: {
        title: draft.source.title,
        year: draft.source.year ?? undefined,
        assetType: draft.source.assetType,
        localPath: draft.source.localPath,
        status: "EXTRACTED",
        downloadedAt: new Date(),
      },
      create: {
        title: draft.source.title,
        sourceUrl: draft.source.sourceUrl,
        year: draft.source.year ?? undefined,
        assetType: draft.source.assetType,
        localPath: draft.source.localPath,
        status: "EXTRACTED",
        downloadedAt: new Date(),
      },
    });

    await prisma.questionImportDraft.upsert({
      where: {
        sourceId_questionNumber: {
          sourceId: source.id,
          questionNumber: draft.questionNumber ?? saved + 1,
        },
      },
      update: {
        rawText: draft.rawText,
        externalRef: draft.externalRef,
        answerLabel: guessAnswerLabel(draft.rawText, draft.answerLabel),
        status: draft.status ?? "EXTRACTED_NEEDS_REVIEW",
        confidence: draft.confidence ?? 0.35,
      },
      create: {
        sourceId: source.id,
        year: draft.source.year ?? undefined,
        questionNumber: draft.questionNumber ?? saved + 1,
        externalRef: draft.externalRef,
        rawText: draft.rawText,
        answerLabel: guessAnswerLabel(draft.rawText, draft.answerLabel),
        status: draft.status ?? "EXTRACTED_NEEDS_REVIEW",
        confidence: draft.confidence ?? 0.35,
      },
    });
    saved += 1;
  }

  console.log(`Saved ${saved} draft question blocks.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
