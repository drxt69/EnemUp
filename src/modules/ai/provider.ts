export type AIProviderId = "mock" | "gemini" | "openrouter";

export type AIChatInput = {
  userId?: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
};

export type AIChatOutput = {
  provider: AIProviderId;
  content: string;
};

export interface AIProvider {
  id: AIProviderId;
  chat(input: AIChatInput): Promise<AIChatOutput>;
}
