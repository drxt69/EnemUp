import { ZodError } from "zod";

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function getErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { error: { code: error.code, message: error.message } },
    };
  }

  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: {
          code: "BAD_REQUEST" satisfies AppErrorCode,
          message: "Dados inválidos.",
          issues: error.issues,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL_ERROR" satisfies AppErrorCode,
        message: "Não foi possível concluir a operação agora.",
      },
    },
  };
}
