// OCR.space fallback — usado APENAS quando o pipeline determinístico identifica
// que o PDF é uma imagem escaneada (scan_sem_texto_real). Envia o PDF original
// para a API externa, obtém o texto reconhecido e devolve para os mesmos
// parsers regex usados pelos PDFs nativos.
//
// Free tier OCR.space (filesize <= 1MB):  25.000 req/mês.
// PRO API (filesize <= 5MB):              ajuste OCR_MAX_BYTES.

export const OCR_MAX_BYTES = 1_000_000; // limite do free tier

export interface OcrResult {
  ok: boolean;
  text: string;
  reason?: string;
  elapsedMs: number;
}

export async function runOcrFallback(bytes: Uint8Array, filename = "documento.pdf"): Promise<OcrResult> {
  const t0 = Date.now();
  const apiKey = Deno.env.get("OCRSPACE_API_KEY");
  if (!apiKey) {
    return { ok: false, text: "", reason: "OCRSPACE_API_KEY ausente", elapsedMs: 0 };
  }
  if (bytes.length > OCR_MAX_BYTES) {
    return {
      ok: false,
      text: "",
      reason: `arquivo ${(bytes.length / 1024 / 1024).toFixed(2)}MB excede limite OCR (${(OCR_MAX_BYTES / 1024 / 1024).toFixed(0)}MB)`,
      elapsedMs: 0,
    };
  }

  try {
    const form = new FormData();
    form.append("apikey", apiKey);
    form.append("language", "por");
    form.append("isOverlayRequired", "false");
    form.append("OCREngine", "2"); // melhor para formulários impressos
    form.append("scale", "true");
    form.append("isTable", "false");
    form.append("filetype", "PDF");
    form.append("file", new Blob([bytes], { type: "application/pdf" }), filename);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45_000);

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        ok: false,
        text: "",
        reason: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        elapsedMs: Date.now() - t0,
      };
    }

    // deno-lint-ignore no-explicit-any
    const data: any = await res.json();
    if (data?.IsErroredOnProcessing) {
      const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(" | ") : String(data.ErrorMessage || "erro OCR");
      return { ok: false, text: "", reason: msg, elapsedMs: Date.now() - t0 };
    }
    // deno-lint-ignore no-explicit-any
    const pages: any[] = Array.isArray(data?.ParsedResults) ? data.ParsedResults : [];
    const text = pages.map((p) => String(p?.ParsedText || "")).join("\n\n").trim();
    return { ok: true, text, elapsedMs: Date.now() - t0 };
  } catch (e) {
    return {
      ok: false,
      text: "",
      reason: (e as Error).message || "erro de rede OCR",
      elapsedMs: Date.now() - t0,
    };
  }
}
