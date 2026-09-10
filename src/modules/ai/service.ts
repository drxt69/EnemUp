import { env } from "@/lib/env";
import type { AIChatInput, AIChatOutput, AIProvider } from "./provider";

class MockAIProvider implements AIProvider {
  id = "mock" as const;

  async chat(input: AIChatInput): Promise<AIChatOutput> {
    const lastUserMessage = [...input.messages]
      .reverse()
      .find((message) => message.role === "user")?.content;

    const focus = lastUserMessage?.toLowerCase() ?? "";
    const suggestion = focus.includes("redação")
      ? "Para redação, revise tese, repertório, dois argumentos e uma proposta de intervenção com agente, ação, meio e finalidade."
      : focus.includes("matemática")
        ? "Para matemática, transforme o enunciado em dados, escolha a fórmula e confira unidades antes de marcar a alternativa."
        : focus.includes("simulado")
          ? "Para simulados, corrija primeiro os erros por assunto e refaça questões parecidas antes do próximo treino."
          : "Monte um bloco de estudo de 50 minutos: 10 min de revisão, 30 min de prática ativa e 10 min corrigindo erros.";

    return {
      provider: this.id,
      content: `Resposta do tutor ENEM: ${suggestion} Pergunta recebida: "${lastUserMessage ?? "sem pergunta"}"`,
    };
  }
}

class GeminiAIProvider implements AIProvider {
  id = "gemini" as const;

  async chat(input: AIChatInput): Promise<AIChatOutput> {
    if (!env.GEMINI_API_KEY) {
      return new MockAIProvider().chat(input);
    }

    const systemMessage = input.messages.find((message) => message.role === "system")?.content;
    const userMessages = input.messages
      .filter((message) => message.role !== "system")
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n\n");
    const model = env.AI_MODEL ?? "gemini-3.5-flash-lite";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: systemMessage
            ? { parts: [{ text: systemMessage }] }
            : undefined,
          contents: [{ role: "user", parts: [{ text: userMessages }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 520,
          },
        }),
      },
    );

    if (!response.ok) {
      return new MockAIProvider().chat(input);
    }

    const data = await response.json();
    const content =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text)
        .filter(Boolean)
        .join("\n")
        .trim() ?? "";

    return {
      provider: this.id,
      content: content || (await new MockAIProvider().chat(input)).content,
    };
  }
}

class OpenRouterAIProvider implements AIProvider {
  id = "openrouter" as const;

  async chat(input: AIChatInput): Promise<AIChatOutput> {
    if (!env.OPENROUTER_API_KEY) {
      return new MockAIProvider().chat(input);
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL ?? "google/gemini-3.5-flash-lite",
        messages: input.messages,
        temperature: 0.25,
        max_tokens: 520,
      }),
    });

    if (!response.ok) {
      return new MockAIProvider().chat(input);
    }

    const data = await response.json();
    const content = String(data?.choices?.[0]?.message?.content ?? "").trim();

    return {
      provider: this.id,
      content: content || (await new MockAIProvider().chat(input)).content,
    };
  }
}

export class AIService {
  constructor(private readonly provider: AIProvider = new MockAIProvider()) {}

  chat(input: AIChatInput) {
    return this.provider.chat(input);
  }
}

function createAIProvider() {
  if (env.AI_PROVIDER === "gemini") {
    return new GeminiAIProvider();
  }

  if (env.AI_PROVIDER === "openrouter") {
    return new OpenRouterAIProvider();
  }

  return new MockAIProvider();
}

export const aiService = new AIService(
  createAIProvider(),
);
