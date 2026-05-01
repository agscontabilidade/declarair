/**
 * Helpers para tratar erros com tipagem segura.
 *
 * Use `getErrorMessage(err)` em blocos catch tipados como `unknown`
 * para extrair a mensagem sem precisar de `any`.
 */

export function getErrorMessage(error: unknown, fallback = "Erro inesperado"): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return fallback;
}

export function isErrorWithCode(error: unknown): error is { code: string; message?: string } {
  return !!error && typeof error === "object" && "code" in error && typeof (error as { code: unknown }).code === "string";
}
