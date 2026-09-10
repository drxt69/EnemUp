import { prisma } from "../src/lib/prisma";

const permissions = [
  ["student:access", "Acessar área do aluno"],
  ["questions:solve", "Resolver questões"],
  ["essays:submit", "Enviar redações"],
  ["simulations:run", "Realizar simulados"],
  ["admin:access", "Acessar administração"],
  ["content:manage", "Gerenciar conteúdo"],
  ["billing:manage", "Gerenciar assinaturas e pagamentos"],
] as const;

const roles = [
  {
    key: "STUDENT",
    name: "Aluno",
    permissionKeys: [
      "student:access",
      "questions:solve",
      "essays:submit",
      "simulations:run",
    ],
  },
  {
    key: "ADMIN",
    name: "Administrador",
    permissionKeys: permissions.map(([key]) => key),
  },
] as const;

const areas = [
  {
    name: "Linguagens, Códigos e suas Tecnologias",
    slug: "linguagens",
    subjects: ["Língua Portuguesa", "Literatura", "Inglês", "Espanhol", "Artes", "Educação Física"],
  },
  {
    name: "Ciências Humanas e suas Tecnologias",
    slug: "ciencias-humanas",
    subjects: ["História", "Geografia", "Filosofia", "Sociologia"],
  },
  {
    name: "Ciências da Natureza e suas Tecnologias",
    slug: "ciencias-natureza",
    subjects: ["Biologia", "Física", "Química"],
  },
  {
    name: "Matemática e suas Tecnologias",
    slug: "matematica",
    subjects: ["Matemática"],
  },
] as const;

const essayCompetencies = [
  [
    1,
    "Norma padrão",
    "Demonstrar domínio da modalidade escrita formal da língua portuguesa.",
  ],
  [
    2,
    "Compreensão da proposta",
    "Compreender a proposta de redação e aplicar conceitos das várias áreas do conhecimento.",
  ],
  [
    3,
    "Argumentação",
    "Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos.",
  ],
  [
    4,
    "Coesão textual",
    "Demonstrar conhecimento dos mecanismos linguísticos necessários para construir a argumentação.",
  ],
  [
    5,
    "Proposta de intervenção",
    "Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos.",
  ],
] as const;

const demoQuestions = [
  {
    subjectSlug: "matematica",
    topicSlug: "matematica-fundamentos",
    difficulty: "EASY",
    statement:
      "Uma estudante resolveu 40 questões em uma semana e acertou 70%. Quantas questões ela acertou?",
    alternatives: [
      ["A", "24", false],
      ["B", "26", false],
      ["C", "28", true],
      ["D", "30", false],
      ["E", "32", false],
    ],
    explanation:
      "70% de 40 equivale a 0,70 x 40 = 28 questões corretas.",
  },
  {
    subjectSlug: "lingua-portuguesa",
    topicSlug: "lingua-portuguesa-fundamentos",
    difficulty: "MEDIUM",
    statement:
      "Em um texto dissertativo-argumentativo, qual elemento ajuda a ligar ideias entre parágrafos e manter a progressão textual?",
    alternatives: [
      ["A", "Coesão", true],
      ["B", "Narrador", false],
      ["C", "Rima", false],
      ["D", "Cenário", false],
      ["E", "Personagem", false],
    ],
    explanation:
      "A coesão usa conectivos, retomadas e organização linguística para ligar ideias.",
  },
  {
    subjectSlug: "biologia",
    topicSlug: "biologia-fundamentos",
    difficulty: "MEDIUM",
    statement:
      "Em uma cadeia alimentar, organismos produtores são importantes porque:",
    alternatives: [
      ["A", "consomem todos os decompositores", false],
      ["B", "transformam energia luminosa ou química em matéria orgânica", true],
      ["C", "impedem a circulação de nutrientes", false],
      ["D", "ocupam sempre o último nível trófico", false],
      ["E", "dependem exclusivamente de predadores", false],
    ],
    explanation:
      "Produtores formam a base energética de muitas cadeias ao sintetizar matéria orgânica.",
  },
  {
    subjectSlug: "historia",
    topicSlug: "historia-fundamentos",
    difficulty: "HARD",
    statement:
      "Ao estudar cidadania no Brasil, uma abordagem histórica adequada considera que direitos políticos e sociais:",
    alternatives: [
      ["A", "foram sempre iguais para toda a população", false],
      ["B", "surgiram prontos e sem conflitos", false],
      ["C", "resultam de disputas, movimentos sociais e mudanças institucionais", true],
      ["D", "não se relacionam com trabalho e educação", false],
      ["E", "dependem apenas de decisões individuais", false],
    ],
    explanation:
      "A cidadania é historicamente construída por conflitos, leis, instituições e mobilização social.",
  },
] as const;

const essayThemes = [
  {
    title: "Desafios para democratizar o acesso ao estudo de qualidade no Brasil",
    prompt:
      "Escreva um texto dissertativo-argumentativo sobre os desafios para democratizar o acesso ao estudo de qualidade no Brasil, apresentando proposta de intervenção.",
  },
  {
    title: "O uso da tecnologia na organização da rotina de estudos",
    prompt:
      "Discuta como a tecnologia pode contribuir para organizar a rotina de estudos sem substituir autonomia, disciplina e pensamento crítico.",
  },
] as const;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seedPlans() {
  await prisma.plan.upsert({
    where: { key: "monthly" },
    update: {
      name: "Plano Mensal",
      description: "Acesso premium mensal sem período de teste.",
      priceCents: 1999,
      billingInterval: "MONTH",
      trialDays: 0,
      isActive: true,
    },
    create: {
      key: "monthly",
      name: "Plano Mensal",
      description: "Acesso premium mensal sem período de teste.",
      priceCents: 1999,
      billingInterval: "MONTH",
      trialDays: 0,
    },
  });

  await prisma.plan.upsert({
    where: { key: "annual" },
    update: {
      name: "Plano Anual",
      description: "Acesso premium anual com melhor custo-benefício.",
      priceCents: 9999,
      billingInterval: "YEAR",
      trialDays: 0,
      isActive: true,
    },
    create: {
      key: "annual",
      name: "Plano Anual",
      description: "Acesso premium anual com melhor custo-benefício.",
      priceCents: 9999,
      billingInterval: "YEAR",
      trialDays: 0,
    },
  });
}

async function seedAccessControl() {
  for (const [key, name] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { name },
      create: { key, name },
    });
  }

  for (const role of roles) {
    const savedRole = await prisma.role.upsert({
      where: { key: role.key },
      update: { name: role.name },
      create: { key: role.key, name: role.name },
    });

    for (const permissionKey of role.permissionKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: savedRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: savedRole.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedAcademicTaxonomy() {
  for (const area of areas) {
    const savedArea = await prisma.area.upsert({
      where: { slug: area.slug },
      update: { name: area.name },
      create: { name: area.name, slug: area.slug },
    });

    for (const subject of area.subjects) {
      const savedSubject = await prisma.subject.upsert({
        where: { slug: slugify(subject) },
        update: { name: subject, areaId: savedArea.id },
        create: {
          name: subject,
          slug: slugify(subject),
          areaId: savedArea.id,
        },
      });

      await prisma.topic.upsert({
        where: { slug: `${savedSubject.slug}-fundamentos` },
        update: {
          name: "Fundamentos",
          subjectId: savedSubject.id,
        },
        create: {
          name: "Fundamentos",
          slug: `${savedSubject.slug}-fundamentos`,
          description: "Tópico inicial para organizar materiais e questões.",
          subjectId: savedSubject.id,
        },
      });
    }
  }
}

async function seedEssayCompetencies() {
  for (const [number, name, description] of essayCompetencies) {
    await prisma.essayCompetency.upsert({
      where: { number },
      update: { name, description, maxScore: 200 },
      create: { number, name, description, maxScore: 200 },
    });
  }
}

async function seedDemoQuestions() {
  for (const item of demoQuestions) {
    const subject = await prisma.subject.findUniqueOrThrow({
      where: { slug: item.subjectSlug },
      include: { area: true },
    });
    const topic = await prisma.topic.findUniqueOrThrow({
      where: { slug: item.topicSlug },
    });

    const existing = await prisma.question.findFirst({
      where: { statement: item.statement },
    });

    const question =
      existing ??
      (await prisma.question.create({
        data: {
          statement: item.statement,
          explanation: item.explanation,
          difficulty: item.difficulty,
          source: "Questão autoral demonstrativa",
          legalStatus: "OWNED",
          isPublished: true,
          areaId: subject.areaId,
          subjectId: subject.id,
          topics: {
            create: {
              topicId: topic.id,
            },
          },
        },
      }));

    for (const [label, content, isCorrect] of item.alternatives) {
      await prisma.alternative.upsert({
        where: {
          questionId_label: {
            questionId: question.id,
            label,
          },
        },
        update: { content, isCorrect },
        create: {
          questionId: question.id,
          label,
          content,
          isCorrect,
          sortOrder: label.charCodeAt(0) - 64,
        },
      });
    }
  }
}

async function seedDemoSimulations() {
  const questions = await prisma.question.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "asc" },
  });

  if (questions.length === 0) {
    return;
  }

  const simulation = await prisma.simulation.upsert({
    where: { id: "demo-enem-diagnostico" },
    update: {
      title: "Diagnóstico rápido ENEM",
      description: "Simulado demonstrativo com questões autorais para validar o fluxo.",
      durationMin: 20,
      isPublished: true,
    },
    create: {
      id: "demo-enem-diagnostico",
      title: "Diagnóstico rápido ENEM",
      description: "Simulado demonstrativo com questões autorais para validar o fluxo.",
      type: "DIAGNOSTIC",
      durationMin: 20,
      isPublished: true,
    },
  });

  for (const [index, question] of questions.entries()) {
    await prisma.simulationQuestion.upsert({
      where: {
        simulationId_questionId: {
          simulationId: simulation.id,
          questionId: question.id,
        },
      },
      update: { sortOrder: index + 1 },
      create: {
        simulationId: simulation.id,
        questionId: question.id,
        sortOrder: index + 1,
      },
    });
  }
}

async function seedEssayThemes() {
  for (const theme of essayThemes) {
    const existing = await prisma.essayTheme.findFirst({
      where: { title: theme.title },
    });

    if (existing) {
      await prisma.essayTheme.update({
        where: { id: existing.id },
        data: { prompt: theme.prompt, isPublished: true },
      });
    } else {
      await prisma.essayTheme.create({
        data: {
          title: theme.title,
          prompt: theme.prompt,
          source: "Tema autoral demonstrativo",
          isPublished: true,
        },
      });
    }
  }
}

async function seedMaterials() {
  const topic = await prisma.topic.findFirst({
    where: { slug: "matematica-fundamentos" },
  });

  const existing = await prisma.material.findFirst({
    where: { title: "Guia de Rotina ENEM" },
  });

  const material =
    existing ??
    (await prisma.material.create({
      data: {
        topicId: topic?.id,
        title: "Guia de Rotina ENEM",
        description: "PDF autoral demonstrativo com rotina semanal de estudos.",
        type: "PDF",
        fileUrl: "/materials/guia-rotina-enem.pdf",
        isPublished: true,
      },
    }));

  await prisma.pdfMaterial.upsert({
    where: { id: "pdf-guia-rotina-enem" },
    update: {
      materialId: material.id,
      fileName: "guia-rotina-enem.pdf",
      fileUrl: "/materials/guia-rotina-enem.pdf",
      pageCount: 1,
    },
    create: {
      id: "pdf-guia-rotina-enem",
      materialId: material.id,
      fileName: "guia-rotina-enem.pdf",
      fileUrl: "/materials/guia-rotina-enem.pdf",
      pageCount: 1,
      generatedBy: "reportlab",
    },
  });
}

async function main() {
  await seedPlans();
  await seedAccessControl();
  await seedAcademicTaxonomy();
  await seedEssayCompetencies();
  await seedDemoQuestions();
  await seedDemoSimulations();
  await seedEssayThemes();
  await seedMaterials();
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
