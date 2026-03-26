/**
 * Asaas API Configuration - Environment-Aware
 * 
 * Secrets necessários:
 * - ASAAS_API_KEY: Chave da API (usada em ambos ambientes, ou separar com ASAAS_SANDBOX_API_KEY)
 * - ASAAS_ENVIRONMENT: 'sandbox' | 'production' (default: sandbox)
 * - ASAAS_BASE_URL: URL base para produção (opcional, default: https://api.asaas.com/v3)
 * - ASAAS_SANDBOX_API_KEY: Chave sandbox separada (opcional, fallback para ASAAS_API_KEY)
 * - ASAAS_SANDBOX_BASE_URL: URL sandbox (opcional, default: https://sandbox.asaas.com/api/v3)
 */

export interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
  environment: "sandbox" | "production";
}

export const getAsaasConfig = (): AsaasConfig => {
  const environment = Deno.env.get("ASAAS_ENVIRONMENT") || "sandbox";

  if (environment === "production") {
    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) throw new Error("ASAAS_API_KEY não configurada para produção");

    return {
      apiKey,
      baseUrl: Deno.env.get("ASAAS_BASE_URL") || "https://api.asaas.com/v3",
      environment: "production",
    };
  }

  // Sandbox: try dedicated key first, then fallback to generic
  const apiKey = Deno.env.get("ASAAS_SANDBOX_API_KEY") || Deno.env.get("ASAAS_API_KEY");
  if (!apiKey) throw new Error("ASAAS_API_KEY ou ASAAS_SANDBOX_API_KEY não configurada");

  return {
    apiKey,
    baseUrl: Deno.env.get("ASAAS_SANDBOX_BASE_URL") || "https://sandbox.asaas.com/api/v3",
    environment: "sandbox",
  };
};

export const isProduction = (): boolean => {
  return Deno.env.get("ASAAS_ENVIRONMENT") === "production";
};

export async function asaasRequest(path: string, options: RequestInit = {}) {
  const config = getAsaasConfig();

  const res = await fetch(`${config.baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      access_token: config.apiKey,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    console.error(`[Asaas ${config.environment}] Error:`, JSON.stringify(data));
    throw new Error(data.errors?.[0]?.description || `API error: ${res.status}`);
  }
  return data;
}
