import { env } from "@/lib/env";
import { aiService } from "@/modules/ai/service";

type QuestionFeedbackInput = {
  subjectName: string;
  statement: string;
  selectedLabel?: string | null;
  selectedContent?: string | null;
  correctLabel?: string | null;
  correctContent?: string | null;
  isCorrect: boolean;
  explanation?: string | null;
};

type QuestionFeedbackResult = {
  text: string;
  source: "ai" | "local";
};

function compactText(value?: string | null) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeSearchText(value: string) {
  return compactText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isTechnicalImportNote(value: string) {
  const text = normalizeSearchText(value);

  return [
    "gabarito",
    "importad",
    "extraid",
    "pendente de revisão",
    "revisao pedagogica",
    "official",
    "inep",
  ].some((term) => text.includes(term));
}

function getQuestionFocus(statement: string) {
  const cleanStatement = compactText(statement);
  const commandMatch = cleanStatement.match(
    /(portanto|assim|logo|nesse contexto|desse modo|com base no texto|de acordo com o texto|o texto|a questão|qual|quais|por que|porque|para que|conclui-se|infere-se)[^.?!]{20,220}/i,
  );
  const focus = commandMatch?.[0] ?? cleanStatement.slice(0, 220);

  return `${focus}${focus.length < cleanStatement.length ? "..." : ""}`;
}

function getSubjectReason(subjectName: string, statement: string, focus: string, correctContent: string) {
  const fullStatement = normalizeSearchText(statement);
  const correct = normalizeSearchText(correctContent);
  const subject = subjectName.toLowerCase();

  if (
    correct.includes("caatinga") &&
    fullStatement.includes("deserto") &&
    fullStatement.includes("adapt")
  ) {
    return "O enunciado descreve um animal adaptado a ambiente seco, com escassez de alimento e condições extremas. No Brasil, o ambiente que mais se aproxima desse contexto é a Caatinga, porque ela tem clima semiárido, longos períodos de seca, altas temperaturas e vegetação adaptada à pouca água. Por isso, se um lagarto desenvolvesse características semelhantes às de animais de deserto, seria mais provável encontrá-lo nesse bioma do que no Cerrado, Pampas, Restinga ou Pantanal.";
  }

  if (correct.includes("cerrado")) {
    return "O Cerrado é marcado por vegetação de savana, solos geralmente ácidos, queimadas naturais ou antrópicas e uma estação seca bem definida. Quando a alternativa correta aponta o Cerrado, ela costuma relacionar essas características ao contexto apresentado no enunciado.";
  }

  if (correct.includes("pampas")) {
    return "Os Pampas são campos sulinos, com predomínio de vegetação rasteira e clima subtropical. Essa alternativa é correta quando o enunciado aponta para paisagens campestres abertas, pecuária, relevo suave ou dinâmicas típicas do sul do Brasil.";
  }

  if (correct.includes("pantanal")) {
    return "O Pantanal se destaca por planícies alagáveis e forte dependência do ciclo das cheias e vazantes. Essa alternativa é correta quando o enunciado envolve inundações periódicas, áreas úmidas e grande biodiversidade associada a ambientes aquáticos.";
  }

  if (correct.includes("restinga")) {
    return "A Restinga ocorre em áreas litorâneas, com solo arenoso, salinidade e vegetação adaptada ao ambiente costeiro. Ela é a resposta correta quando o enunciado aponta para condições de praia, dunas, litoral ou ecossistemas costeiros.";
  }

  if (fullStatement.includes("radio") && fullStatement.includes("podcast")) {
    return "O enunciado compara o rádio com o podcast para mostrar continuidade e transformação, não desaparecimento. A alternativa correta deve reconhecer que uma tecnologia mais nova pode mudar formatos e formas de consumo sem tornar a anterior automaticamente obsoleta.";
  }

  if (fullStatement.includes("usina") && fullStatement.includes("hidreletrica")) {
    return "O enunciado trata de energia e impacto ambiental. A alternativa correta é a que relaciona a informação apresentada com o efeito mais coerente sobre a produção de energia, o uso dos recursos naturais ou a pressão sobre o ambiente.";
  }

  if (subject.includes("matemática")) {
    return `Na Matemática, essa alternativa deve ser lida junto com os dados do problema. Ela fecha melhor com o que foi pedido porque transforma o enunciado em uma relação de cálculo coerente, sem mudar as medidas, as grandezas ou a conclusão esperada.`;
  }

  if (subject.includes("física") || subject.includes("química")) {
    return `Em Ciências da Natureza, a resposta correta precisa respeitar a relação de causa, efeito e unidade indicada no problema. Essa alternativa é a melhor porque combina o fenômeno descrito no enunciado com a consequência apresentada na opção.`;
  }

  if (subject.includes("biologia")) {
    return `Em Biologia, a alternativa correta normalmente liga uma estrutura, processo ou função ao contexto apresentado. Aqui, a opção escolhida como correta faz essa ligação de modo mais direto do que as demais.`;
  }

  if (subject.includes("lingua") || subject.includes("língua") || subject.includes("literatura") || subject.includes("ingles") || subject.includes("inglês") || subject.includes("espanhol")) {
    return `Em Linguagens, a chave é interpretar o sentido do texto e a intenção do comando. Essa alternativa é correta porque preserva a ideia do enunciado e não acrescenta uma interpretação que o texto não sustenta.`;
  }

  if (subject.includes("historia") || subject.includes("história") || subject.includes("geografia") || subject.includes("filosofia") || subject.includes("sociologia")) {
    return `Em Ciências Humanas, a resposta precisa manter a relação entre contexto, conceito e consequência. Essa alternativa é a correta porque explica melhor o ponto central do enunciado sem trocar o tema principal.`;
  }

  return `Essa alternativa é a correta porque responde diretamente ao foco da pergunta e se conecta melhor ao trecho decisivo do enunciado: "${focus}".`;
}

function getWrongAlternativeReason(selectedContent: string, correctContent: string, statement: string) {
  const selected = normalizeSearchText(selectedContent);
  const correct = normalizeSearchText(correctContent);
  const fullStatement = normalizeSearchText(statement);

  if (selected.includes("cerrado") && correct.includes("caatinga") && fullStatement.includes("deserto")) {
    return "O Cerrado até possui período seco, mas não é o bioma brasileiro mais parecido com um deserto. A Caatinga se ajusta melhor porque é semiárida e tem organismos adaptados à escassez de água e alimento.";
  }

  if (selected.includes("pantanal") && fullStatement.includes("deserto")) {
    return "O Pantanal não combina com a pista do enunciado porque é uma planície alagável, muito dependente de cheias. Isso vai na direção oposta de um ambiente desértico.";
  }

  if (selected.includes("pampas") && fullStatement.includes("deserto")) {
    return "Os Pampas são campos do sul do Brasil, não um ambiente semiárido. Por isso, não representam tão bem as condições de seca extrema citadas no enunciado.";
  }

  if (selected.includes("restinga") && fullStatement.includes("deserto")) {
    return "A Restinga está ligada ao ambiente litorâneo, com solo arenoso e influência marinha. O enunciado pede um ambiente semelhante ao deserto, por isso ela não é a melhor escolha.";
  }

  return "A alternativa marcada pode até tocar em parte do tema, mas deixa escapar a pista principal do enunciado. Ela não explica tão bem a relação pedida quanto a resposta correta.";
}

function buildLocalQuestionFeedback(input: QuestionFeedbackInput) {
  const selectedLabel = compactText(input.selectedLabel) || "a alternativa marcada";
  const selectedContent = compactText(input.selectedContent);
  const correctLabel = compactText(input.correctLabel) || "a resposta correta";
  const correctContent = compactText(input.correctContent);
  const rawExplanation = compactText(input.explanation);
  const explanation = rawExplanation && !isTechnicalImportNote(rawExplanation) ? rawExplanation : "";
  const statement = compactText(input.statement);
  const focus = getQuestionFocus(statement);

  const verdict = input.isCorrect
    ? `Você acertou.`
    : `Você errou.`;

  const chosenReason = selectedContent && !input.isCorrect
    ? `A alternativa ${selectedLabel}, que você marcou, não é a melhor resposta. ${getWrongAlternativeReason(selectedContent, correctContent, statement)}`
    : "";

  const correctReason = correctContent
    ? `A resposta certa é a letra ${correctLabel}: "${correctContent}". ${getSubjectReason(input.subjectName, statement, focus, correctContent)}`
    : "";

  const officialReason = explanation
    ? `Explicação: ${explanation}`
    : "";

  return [verdict, chosenReason, correctReason, officialReason]
    .filter(Boolean)
    .join("\n\n");
}

function hasExternalProvider() {
  return (
    (env.AI_PROVIDER === "gemini" && Boolean(env.GEMINI_API_KEY)) ||
    (env.AI_PROVIDER === "openrouter" && Boolean(env.OPENROUTER_API_KEY))
  );
}

function cleanAIText(value: string) {
  return value
    .replace(/gabarito/gi, "resposta correta")
    .replace(/quest[aã]o importada/gi, "questão")
    .replace(/extra[ií]da/gi, "selecionada")
    .replace(/pendente de revis[aã]o/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function buildQuestionFeedback(input: QuestionFeedbackInput): Promise<QuestionFeedbackResult> {
  const localFeedback = buildLocalQuestionFeedback(input);

  if (!hasExternalProvider()) {
    return { text: localFeedback, source: "local" };
  }

  const correctLabel = compactText(input.correctLabel) || "a resposta correta";
  const correctContent = compactText(input.correctContent);
  const selectedLabel = compactText(input.selectedLabel);
  const selectedContent = compactText(input.selectedContent);

  try {
    const output = await aiService.chat({
      messages: [
        {
          role: "system",
          content:
            "Você é um corretor pedagógico do ENEM. Explique para o aluno, em português do Brasil, por que a alternativa correta responde ao enunciado. Não mencione importação, revisão, banco de dados, fonte, sistema, gabarito ou termos técnicos internos. Seja específico, claro e didático. Use no máximo 3 parágrafos curtos.",
        },
        {
          role: "user",
          content: [
            `Disciplina: ${input.subjectName}`,
            `Enunciado: ${input.statement}`,
            selectedLabel && selectedContent
              ? `Alternativa marcada pelo aluno: ${selectedLabel}) ${selectedContent}`
              : "",
            `Resposta correta: ${correctLabel}) ${correctContent}`,
            `Resultado do aluno: ${input.isCorrect ? "acertou" : "errou"}`,
            "Explique o motivo da resposta correta como se estivesse respondendo à pergunta: por que essa letra é a certa?",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
    });
    const content = cleanAIText(output.content);

    if (content.length > 80 && !isTechnicalImportNote(content)) {
      return {
        text: `${input.isCorrect ? "Você acertou." : "Você errou."}\n\n${content}`,
        source: "ai",
      };
    }
  } catch {
    return { text: localFeedback, source: "local" };
  }

  return { text: localFeedback, source: "local" };
}
