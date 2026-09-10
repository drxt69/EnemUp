"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireActiveSubscription } from "@/lib/auth/subscription";
import { aiService } from "./service";

export async function askAIAction(formData: FormData) {
  const user = await requireActiveSubscription();
  const message = formData.get("message");

  if (typeof message !== "string" || message.trim().length < 3) {
    return;
  }

  const conversation =
    (await prisma.aIConversation.findFirst({
      where: { userId: user.id, context: "STUDENT_TUTOR" },
      orderBy: { updatedAt: "desc" },
    })) ??
    (await prisma.aIConversation.create({
      data: {
        userId: user.id,
        context: "STUDENT_TUTOR",
        title: "Tutor ENEM",
        provider: "mock",
      },
    }));

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "user",
      content: message.trim(),
    },
  });

  const history = await prisma.aIMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const output = await aiService.chat({
    userId: user.id,
    messages: [
      {
        role: "system",
        content:
          "Você é um tutor de estudos para ENEM. Responda com orientação prática, clara e segura.",
      },
      ...history.map((item) => ({
        role: item.role as "user" | "assistant" | "system",
        content: item.content,
      })),
    ],
  });

  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: output.content,
    },
  });

  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: { provider: output.provider },
  });

  revalidatePath("/ai-tutor");
}
