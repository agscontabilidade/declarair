import { extractText, getDocumentProxy } from "https://esm.sh/unpdf@0.12.1";

export type Tipo = "declaracao" | "recibo" | "mei" | "darf";

export async function extractRawTextFromPdf(bytes: Uint8Array): Promise<string> {
  if (bytes.length < 5 || bytes[0] !== 0x25 || bytes[1] !== 0x50 || bytes[2] !== 0x44 || bytes[3] !== 0x46) {
    return "";
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf as never, { mergePages: false });
    const byPage = Array.isArray(text) ? text : [String(text || "")];
    return byPage.join("\n\n").trim();
  } catch (e) {
    console.error("[extractRawTextFromPdf] falhou:", (e as Error).message);
    return "";
  }
}