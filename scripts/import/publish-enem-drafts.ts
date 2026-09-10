import "dotenv/config";
import { prisma } from "../../src/lib/prisma";

const labels = ["A", "B", "C", "D", "E"] as const;

type Label = (typeof labels)[number];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanPdfNoise(value: string) {
  return value
    .replace(/(?:ENEM|ENEN|M)20\d{2}/g, " ")
    .replace(/\*[A-Z0-9]+\*/g, " ")
    .replace(/\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\b/g, " ")
    .replace(/\b\d{2,4}\/\/\d{2,4}\/\/[0-9/:\s]+\b/g, " ")
    .replace(/::[0-9:]+/g, " ")
    .replace(/\b(?:\d\s*){8,}\b/g, " ")
    .replace(/[A-Z ]+ E SUAS TECNOLOGIAS\s*\|\s*\d+[ºo] DIA\s*\|[^\n]*/gi, " ")
    .replace(/[a-z0-9_.-]+\.indb\s*\d+/gi, " ");
}

function questionRef(draft: { externalRef: string | null; questionNumber: number | null }) {
  return draft.externalRef ?? String(draft.questionNumber ?? "sem-numero");
}

function sourceUrlForDraft(draft: {
  id: string;
  externalRef: string | null;
  questionNumber: number | null;
  source: { sourceUrl: string };
}) {
  return `${draft.source.sourceUrl}#q=${questionRef(draft)}&draft=${draft.id}`;
}

function inferSubjectSlug(day: number | null, questionNumber: number | null) {
  if (day === 1) {
    if (questionNumber && questionNumber >= 46) {
      return "historia";
    }
    return "lingua-portuguesa";
  }

  if (questionNumber && questionNumber >= 136) {
    return "matematica";
  }

  return "biologia";
}

function normalizeForClassification(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function classifySubjectSlug(day: number | null, questionNumber: number | null, statement: string) {
  const text = normalizeForClassification(statement);

  if (day === 1 && questionNumber && questionNumber <= 5) {
    if (hasAny(text, [" el ", " la ", " los ", " las ", " una ", " para ", " como ", " que se ", " espanol"])) {
      return "espanhol";
    }
    if (hasAny(text, [" the ", " and ", " of ", " in ", " to ", " english", " song", " text"])) {
      return "ingles";
    }
  }

  if (day === 1 && questionNumber && questionNumber <= 45) {
    if (hasAny(text, ["poema", "romance", "conto", "cronica", "narrador", "verso", "estrofe", "literatura", "personagem"])) {
      return "literatura";
    }
    if (hasAny(text, ["obra", "artista", "musica", "danca", "teatro", "cinema", "fotografia", "performance", "museu"])) {
      return "artes";
    }
    if (hasAny(text, ["esporte", "corpo", "atividade fisica", "jogo", "atleta", "ginastica", "capoeira", "futebol"])) {
      return "educacao-fisica";
    }
    return "lingua-portuguesa";
  }

  if (day === 1 && questionNumber && questionNumber >= 46) {
    if (hasAny(text, ["mapa", "territorio", "clima", "relevo", "urbano", "rural", "paisagem", "bioma", "regiao", "migracao", "industrializacao", "agricultura", "solo"])) {
      return "geografia";
    }
    if (hasAny(text, ["socrates", "platao", "aristoteles", "kant", "nietzsche", "filosofia", "etica", "moral", "razao", "conhecimento"])) {
      return "filosofia";
    }
    if (hasAny(text, ["sociedade", "sociologia", "cultura", "genero", "desigualdade", "classe social", "movimento social", "cidadania"])) {
      return "sociologia";
    }
    return "historia";
  }

  if (day === 2 && questionNumber && questionNumber <= 135) {
    if (hasAny(text, ["atomo", "molecula", "reacao", "substancia", "solucao", "ph", "oxidacao", "quimica", "carbono", "hidrogenio", "concentracao", "mol"])) {
      return "quimica";
    }
    if (hasAny(text, ["velocidade", "forca", "energia", "potencia", "corrente", "tensao", "circuito", "onda", "frequencia", "calor", "temperatura", "pressao"])) {
      return "fisica";
    }
    return "biologia";
  }

  return inferSubjectSlug(day, questionNumber);
}

function inferDayFromTitle(title: string) {
  if (title.includes("_1") || title.includes("1o") || title.includes("1º")) {
    return 1;
  }
  if (title.includes("_2") || title.includes("2o") || title.includes("2º")) {
    return 2;
  }
  return null;
}

function splitQuestionParts(rawText: string, answerLabel: string) {
  const cleanText = cleanPdfNoise(rawText);
  const lines = cleanText.split(/\r?\n/);
  const lineStarts: number[] = [];
  let cursor = 0;

  for (const line of lines) {
    lineStarts.push(cursor);
    cursor += line.length + 1;
  }

  const markerIndexes = lines
    .map((line, index) => {
      const match = line.match(/^\s*([A-E])(?:\s+(.+)|\s*)$/);
      if (!match) {
        return null;
      }
      return { index, label: match[1] as Label };
    })
    .filter((item): item is { index: number; label: Label } => item !== null);

  let bestStart: number | null = null;

  for (let position = 0; position < markerIndexes.length; position += 1) {
    if (markerIndexes[position]?.label !== "A") {
      continue;
    }

    let expected = 0;
    for (let next = position; next < markerIndexes.length && expected < labels.length; next += 1) {
      if (markerIndexes[next].label === labels[expected]) {
        expected += 1;
      }
    }

    if (expected === labels.length) {
      bestStart = position;
    }
  }

  const parsed = new Map<string, string>();

  if (bestStart !== null) {
    for (let expected = 0, pos = bestStart; expected < labels.length; expected += 1) {
      const current = markerIndexes.find(
        (item, index) => index >= pos && item.label === labels[expected],
      );
      const next = markerIndexes.find(
        (item, index) => current && index > markerIndexes.indexOf(current) && item.label === labels[expected + 1],
      );

      if (!current) {
        continue;
      }

      pos = markerIndexes.indexOf(current) + 1;
      const start = lineStarts[current.index] + (lines[current.index].match(/^\s*[A-E]\s*/)?.[0].length ?? 0);
      const end = next ? lineStarts[next.index] : cleanText.length;
      const content = normalizeWhitespace(cleanText.slice(start, end));
      if (content.length >= 1 && content.length <= 1200) {
        parsed.set(current.label, content);
      }
    }
  }

  const firstAlternative = bestStart !== null ? markerIndexes[bestStart] : null;
  const statementEnd = firstAlternative ? lineStarts[firstAlternative.index] : cleanText.length;
  const statement = normalizeWhitespace(cleanText.slice(0, statementEnd)).slice(0, 4500);

  return {
    statement,
    alternatives: labels.map((label, index) => {
      const content = parsed.get(label) ?? `Opcao ${label}`;
      return {
        label,
        content,
        isCorrect: label === answerLabel,
        sortOrder: index + 1,
      };
    }),
  };
}

function parseAlternatives(rawText: string, answerLabel: string) {
  return splitQuestionParts(rawText, answerLabel).alternatives;
}

function isPublishable(statement: string, alternatives: ReturnType<typeof parseAlternatives>) {
  if (statement.length < 80) {
    return false;
  }
  if (/ENEM202|ENEN202|\.indb|\(cid:\d+\)/i.test(statement)) {
    return false;
  }

  for (const alternative of alternatives) {
    if (alternative.content.startsWith("Opcao ")) {
      return false;
    }
    if (/ENEM|ENEN|\.indb|CADERNO/i.test(alternative.content)) {
      return false;
    }
    if (alternative.content.length > 350 || /\(cid:\d+\)/i.test(alternative.content)) {
      return false;
    }
    if (/\/\/|::|Capa|Azul|Amarelo|Branco|Verde|Cinza|Rosa|Ledor|Atendimento|Especializado/i.test(alternative.content)) {
      return false;
    }
  }

  return true;
}

function buildStatement(rawText: string) {
  return splitQuestionParts(rawText, "A").statement;
}

async function ensureExam(year: number | null, day: number | null) {
  if (!year) {
    return null;
  }

  const examYear = await prisma.examYear.upsert({
    where: { year },
    update: {},
    create: { year },
  });

  const title = `ENEM ${year}${day ? ` - ${day} dia` : ""}`;
  const existing = await prisma.exam.findFirst({
    where: { yearId: examYear.id, title },
  });

  if (existing) {
    return existing;
  }

  return prisma.exam.create({
    data: {
      yearId: examYear.id,
      title,
      sourceUrl: "Importacao local ENEM.zip",
    },
  });
}

async function main() {
  const removed = await prisma.question.deleteMany({
    where: { legalStatus: "OFFICIAL_INEP_IMPORTED_NEEDS_REVIEW" },
  });
  console.log(`Removed ${removed.count} previously published imported ENEM questions.`);

  const drafts = await prisma.questionImportDraft.findMany({
    where: {
      answerLabel: { in: [...labels] },
      source: { sourceUrl: { startsWith: "local://ENEM.zip/" } },
    },
    include: { source: true },
    orderBy: [{ year: "asc" }, { sourceId: "asc" }, { questionNumber: "asc" }],
  });

  let published = 0;
  let skipped = 0;

  for (const draft of drafts) {
    const sourceUrl = sourceUrlForDraft(draft);
    const existing = await prisma.question.findFirst({ where: { sourceUrl } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const number = Number(draft.externalRef ?? draft.questionNumber ?? 0) || null;
    const day = inferDayFromTitle(draft.source.title);
    const alternatives = parseAlternatives(draft.rawText, draft.answerLabel as string);
    const statement = buildStatement(draft.rawText);
    const subjectSlug = classifySubjectSlug(day, number, statement);
    const subject = await prisma.subject.findUniqueOrThrow({
      where: { slug: subjectSlug },
      include: { area: true },
    });
    const topic = await prisma.topic.findFirstOrThrow({
      where: { subjectId: subject.id, name: "Fundamentos" },
    });
    const exam = await ensureExam(draft.year, day);

    if (!isPublishable(statement, alternatives)) {
      await prisma.questionImportDraft.update({
        where: { id: draft.id },
        data: { status: "NEEDS_MANUAL_REVIEW" },
      });
      continue;
    }

    await prisma.question.create({
      data: {
        yearId: exam?.yearId,
        examId: exam?.id,
        areaId: subject.areaId,
        subjectId: subject.id,
        statement,
        source: `ENEM ${draft.year ?? ""} importado`,
        sourceUrl,
        difficulty: "MEDIUM",
        explanation: null,
        legalStatus: "OFFICIAL_INEP_IMPORTED_NEEDS_REVIEW",
        isPublished: true,
        alternatives: {
          create: alternatives,
        },
        topics: {
          create: {
            topicId: topic.id,
          },
        },
      },
    });

    await prisma.questionImportDraft.update({
      where: { id: draft.id },
      data: { status: "PUBLISHED_TO_QUESTION" },
    });

    published += 1;
  }

  console.log(`Published ${published} imported ENEM questions. Skipped ${skipped} already published.`);
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
