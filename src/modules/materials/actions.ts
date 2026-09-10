"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth/subscription";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizePdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value: string) {
  return normalizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxLength = 88) {
  const words = normalizePdfText(value).split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (`${current} ${word}`.trim().length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }

  if (current) lines.push(current);
  return lines;
}

function buildPlanSections(formData: FormData) {
  const objective = getFormValue(formData, "objective") || "melhorar o desempenho no ENEM";
  const dailyTime = getFormValue(formData, "dailyTime") || "1 hora por dia";
  const deadline = getFormValue(formData, "deadline") || "próxima prova";
  const difficulty = getFormValue(formData, "difficulty") || "organizar a rotina";
  const subjects = getFormValue(formData, "subjects") || "disciplinas com menor desempenho";
  const learningStyle = getFormValue(formData, "learningStyle") || "prática com revisão";
  const routine = getFormValue(formData, "routine") || "sem rotina fixa";
  const confidence = getFormValue(formData, "confidence") || "médio";

  return [
    {
      title: "Diagnóstico do aluno",
      body: [
        `Objetivo principal: ${objective}.`,
        `Tempo disponível: ${dailyTime}. Prazo de estudo: ${deadline}.`,
        `Maior dificuldade informada: ${difficulty}. Confiança atual: ${confidence}.`,
      ],
    },
    {
      title: "Método recomendado pela IA",
      body: [
        `Use um ciclo de estudo ativo: teoria curta, questões, correção explicada e revisão dos erros.`,
        `Como você informou preferência por ${learningStyle}, o plano prioriza prática guiada e repetição inteligente.`,
        `A rotina atual foi descrita como: ${routine}. Por isso, o cronograma deve ser simples, repetível e fácil de medir.`,
      ],
    },
    {
      title: "Plano semanal",
      body: [
        `Segunda e quarta: estudar ${subjects} com 20 minutos de teoria e 30 minutos de questões.`,
        `Terça e quinta: corrigir erros, refazer questões parecidas e registrar o motivo de cada erro.`,
        `Sexta: treino misto com questões de duas disciplinas e revisão dos pontos fracos.`,
        `Sábado ou domingo: simulado curto, redação ou revisão geral, de acordo com o tempo disponível.`,
      ],
    },
    {
      title: "Como estudar melhor",
      body: [
        `Antes de estudar, defina uma meta pequena: por exemplo, acertar 8 de 12 questões de um assunto.`,
        `Durante o estudo, não leia passivamente por muito tempo. Intercale explicação curta com exercícios.`,
        `Depois do erro, escreva uma frase: errei por conteúdo, interpretação, conta, pressa ou falta de atenção.`,
        `A cada 7 dias, revise somente os erros mais repetidos. Isso acelera evolução sem aumentar carga horária.`,
      ],
    },
    {
      title: "Próxima ação",
      body: [
        `Comece hoje com uma missão de questões filtrada pela disciplina mais difícil.`,
        `Ao finalizar, leia a correção com IA e transforme cada erro em uma anotação de revisão.`,
      ],
    },
  ];
}

function createPdf(lines: string[]) {
  const pageLineLimit = 42;
  const pages: string[][] = [];

  for (let index = 0; index < lines.length; index += pageLineLimit) {
    pages.push(lines.slice(index, index + pageLineLimit));
  }

  const objects: string[] = [];
  const addObject = (content: string) => {
    objects.push(content);
    return objects.length;
  };

  const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = addObject("");
  const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds: number[] = [];

  for (const pageLines of pages) {
    const content = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      "15 TL",
      ...pageLines.map((line) => `(${escapePdfText(line)}) Tj T*`),
      "ET",
    ].join("\n");
    const contentId = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  const chunks = ["%PDF-1.4\n"];
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(chunks.join("")));
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""));
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");
  for (const offset of offsets.slice(1)) {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  }
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.from(chunks.join(""), "binary");
}

export async function generatePersonalizedStudyPdfAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const sections = buildPlanSections(formData);
  const lines = [
    "ENEM UP - Plano personalizado de estudos",
    `Aluno: ${user.name ?? user.email}`,
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    "",
  ];

  for (const section of sections) {
    lines.push(section.title);
    for (const paragraph of section.body) {
      lines.push(...wrapLine(paragraph));
    }
    lines.push("");
  }

  const directory = path.join(process.cwd(), "public", "materials", "generated");
  await mkdir(directory, { recursive: true });

  const fileName = `plano-personalizado-${user.id}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.pdf`;
  const filePath = path.join(directory, fileName);
  const publicUrl = `/materials/generated/${fileName}`;

  await writeFile(filePath, createPdf(lines));

  redirect(`/materials?generated=${encodeURIComponent(publicUrl)}`);
}
