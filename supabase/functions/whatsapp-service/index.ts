import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function evoFetch(path: string, method = "GET", body?: unknown) {
  const baseUrl = Deno.env.get("EVOLUTION_API_URL");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  if (!baseUrl || !apiKey) throw new Error("Evolution API not configured");

  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const opts: RequestInit = {
    method,
    headers: { "Content-Type": "application/json", apikey: apiKey },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();
  if (!res.ok) {
    console.error("Evolution API error:", JSON.stringify(data));
    throw new Error(`Evolution API [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    // Get escritorio_id
    const { data: usuario } = await supabaseAdmin
      .from("usuarios")
      .select("escritorio_id, papel")
      .eq("id", userId)
      .single();

    if (!usuario) return jsonResponse({ error: "User not found" }, 404);

    // Check addon is active
    const { data: addonAtivo } = await supabaseAdmin
      .from("escritorio_addons")
      .select("id, addons!inner(nome)")
      .eq("escritorio_id", usuario.escritorio_id)
      .eq("status", "ativo")
      .ilike("addons.nome", "%whatsapp%")
      .maybeSingle();

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Actions that require addon
    const addonRequired = ["create-instance", "connect", "send-message"];
    if (addonRequired.includes(action || "") && !addonAtivo) {
      return jsonResponse({ error: "Add-on WhatsApp não está ativo" }, 403);
    }

    switch (action) {
      case "create-instance": {
        const instanceName = `declarair_${usuario.escritorio_id.replace(/-/g, "").slice(0, 12)}`;

        // Check existing
        const { data: existing } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("id")
          .eq("escritorio_id", usuario.escritorio_id)
          .maybeSingle();

        if (existing) {
          return jsonResponse({ error: "Já existe uma instância para este escritório" }, 409);
        }

        const evoResult = await evoFetch("/instance/create", "POST", {
          instanceName,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
          rejectCall: false,
          webhookByEvents: false,
        });

        // Save to DB
        const { data: instance, error: insertErr } = await supabaseAdmin
          .from("whatsapp_instances")
          .insert({
            escritorio_id: usuario.escritorio_id,
            instance_name: instanceName,
            status: "pending",
            qrcode_base64: evoResult?.qrcode?.base64 || null,
          })
          .select()
          .single();

        if (insertErr) throw insertErr;

        return jsonResponse({
          instance,
          qrcode: evoResult?.qrcode?.base64 || null,
        });
      }

      case "connect": {
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("escritorio_id", usuario.escritorio_id)
          .single();

        if (!inst) return jsonResponse({ error: "Nenhuma instância encontrada" }, 404);

        const evoResult = await evoFetch(`/instance/connect/${inst.instance_name}`);

        // Update QR code in DB
        await supabaseAdmin
          .from("whatsapp_instances")
          .update({
            qrcode_base64: evoResult?.base64 || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", inst.id);

        return jsonResponse({
          qrcode: evoResult?.base64 || null,
          pairingCode: evoResult?.pairingCode || null,
        });
      }

      case "status": {
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("escritorio_id", usuario.escritorio_id)
          .maybeSingle();

        if (!inst) return jsonResponse({ status: "not_created", instance: null });

        try {
          const evoResult = await evoFetch(`/instance/connectionState/${inst.instance_name}`);
          const connected = evoResult?.state === "open" || evoResult?.instance?.state === "open";
          const newStatus = connected ? "connected" : "disconnected";

          const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
          if (inst.status !== newStatus) updateData.status = newStatus;

          // Fetch profile details when connected
          let profileData: Record<string, unknown> = {};
          if (connected) {
            try {
              const instances = await evoFetch(`/instance/fetchInstances?instanceName=${inst.instance_name}`);
              const detail = Array.isArray(instances) ? instances[0] : instances;
              const owner = detail?.instance?.owner || detail?.owner || "";
              const phone = owner.replace(/@.*$/, "");
              const profileName = detail?.instance?.profileName || detail?.profileName || null;
              const profilePictureUrl = detail?.instance?.profilePictureUrl || detail?.profilePictureUrl || null;

              if (phone) updateData.phone = phone;
              if (profileName) updateData.profile_name = profileName;
              if (profilePictureUrl) updateData.profile_picture_url = profilePictureUrl;

              profileData = { phone, profileName, profilePictureUrl };
            } catch (e) {
              console.error("Failed to fetch instance details:", e);
            }
          }

          await supabaseAdmin
            .from("whatsapp_instances")
            .update(updateData)
            .eq("id", inst.id);

          // Count messages sent
          const { count: msgCount } = await supabaseAdmin
            .from("mensagens_enviadas")
            .select("id", { count: "exact", head: true })
            .eq("escritorio_id", usuario.escritorio_id)
            .eq("canal", "whatsapp");

          return jsonResponse({
            status: newStatus,
            instance: { ...inst, status: newStatus, ...updateData },
            profile: profileData,
            mensagensEnviadas: msgCount || 0,
            raw: evoResult,
          });
        } catch {
          return jsonResponse({ status: inst.status, instance: inst });
        }
      }

      case "send-message": {
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("escritorio_id", usuario.escritorio_id)
          .single();

        if (!inst) return jsonResponse({ error: "Nenhuma instância WhatsApp conectada" }, 400);
        if (inst.status !== "connected") {
          return jsonResponse({ error: "WhatsApp não está conectado" }, 400);
        }

        const body = await req.json();
        const { phone, message, clienteId, templateId } = body;

        if (!phone || !message) {
          return jsonResponse({ error: "phone e message são obrigatórios" }, 400);
        }

        // Format phone: ensure country code
        let formattedPhone = phone.replace(/\D/g, "");
        if (!formattedPhone.startsWith("55")) {
          formattedPhone = `55${formattedPhone}`;
        }

        const evoResult = await evoFetch(`/message/sendText/${inst.instance_name}`, "POST", {
          number: formattedPhone,
          text: message,
        });

        // Log in mensagens_enviadas
        await supabaseAdmin.from("mensagens_enviadas").insert({
          escritorio_id: usuario.escritorio_id,
          cliente_id: clienteId || null,
          template_id: templateId || null,
          canal: "whatsapp",
          conteudo_final: message,
          status: "enviado",
        });

        return jsonResponse({ success: true, messageId: evoResult?.key?.id });
      }

      case "disconnect": {
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("escritorio_id", usuario.escritorio_id)
          .single();

        if (!inst) return jsonResponse({ error: "Nenhuma instância encontrada" }, 404);

        try {
          await evoFetch(`/instance/logout/${inst.instance_name}`, "DELETE");
        } catch {
          // Instance may already be disconnected
        }

        await supabaseAdmin
          .from("whatsapp_instances")
          .update({ status: "disconnected", qrcode_base64: null, phone: null, updated_at: new Date().toISOString() })
          .eq("id", inst.id);

        return jsonResponse({ success: true });
      }

      case "delete": {
        const { data: inst } = await supabaseAdmin
          .from("whatsapp_instances")
          .select("*")
          .eq("escritorio_id", usuario.escritorio_id)
          .single();

        if (!inst) return jsonResponse({ error: "Nenhuma instância encontrada" }, 404);

        try {
          await evoFetch(`/instance/delete/${inst.instance_name}`, "DELETE");
        } catch {
          // OK if already deleted on Evolution side
        }

        await supabaseAdmin
          .from("whatsapp_instances")
          .delete()
          .eq("id", inst.id);

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Action not found" }, 400);
    }
  } catch (err) {
    console.error("whatsapp-service error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});
