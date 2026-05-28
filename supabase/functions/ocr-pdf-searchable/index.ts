// OCR sob demanda para PDFs escaneados.
// Gera sidecar `<path>.ocr.pdf` no mesmo bucket/pasta do original, preservando RLS.
// Idempotente: se sidecar existe, retorna ready imediatamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const BUCKET = 'documentos-clientes';
const MAX_BYTES = 3 * 1024 * 1024; // OCR.space free tier
const OCR_URL = 'https://api.ocr.space/parse/image';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sidecarPath(path: string): string {
  // foo/bar/baz.pdf -> foo/bar/baz.ocr.pdf
  if (path.toLowerCase().endsWith('.pdf')) {
    return path.slice(0, -4) + '.ocr.pdf';
  }
  return path + '.ocr.pdf';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const ocrApiKey = Deno.env.get('OCRSPACE_API_KEY');

  if (!ocrApiKey) return jsonResponse({ error: 'ocr_not_configured' }, 500);

  // Validate auth (caller must be a logged-in user)
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) return jsonResponse({ error: 'unauthorized' }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return jsonResponse({ error: 'unauthorized' }, 401);

  let body: { path?: string; mode?: 'searchable' | 'text' };
  try { body = await req.json(); } catch { return jsonResponse({ error: 'invalid_json' }, 400); }
  const path = (body.path ?? '').trim();
  const mode = body.mode === 'text' ? 'text' : 'searchable';
  if (!path || path.toLowerCase().endsWith('.ocr.pdf') || !path.toLowerCase().endsWith('.pdf')) {
    return jsonResponse({ error: 'invalid_path' }, 400);
  }

  // Permission check: caller must be able to read the original (createSignedUrl uses RLS).
  const { data: signed, error: signErr } = await userClient.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);
  if (signErr || !signed?.signedUrl) {
    return jsonResponse({ error: 'forbidden_or_missing' }, 403);
  }
  // ── Modo "text": extrai texto via OCR.space e retorna direto, sem sidecar.
  if (mode === 'text') {
    try {
      const dl = await fetch(signed.signedUrl);
      if (!dl.ok) throw new Error(`download failed ${dl.status}`);
      const buf = new Uint8Array(await dl.arrayBuffer());
      if (buf.byteLength > MAX_BYTES) {
        return jsonResponse({ status: 'skipped_too_large' }, 200);
      }
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      const form = new FormData();
      form.append('file', new Blob([buf], { type: 'application/pdf' }), fileName);
      form.append('OCREngine', '2');
      form.append('language', 'por');
      form.append('scale', 'true');
      form.append('detectOrientation', 'true');

      const ocrRes = await fetch(OCR_URL, {
        method: 'POST',
        headers: { apikey: ocrApiKey },
        body: form,
      });
      if (!ocrRes.ok) throw new Error(`ocr.space ${ocrRes.status}`);
      const ocrJson = await ocrRes.json() as {
        IsErroredOnProcessing?: boolean;
        ErrorMessage?: string | string[];
        ParsedResults?: Array<{ ParsedText?: string }>;
      };
      if (ocrJson.IsErroredOnProcessing) {
        const msg = Array.isArray(ocrJson.ErrorMessage) ? ocrJson.ErrorMessage.join('; ') : (ocrJson.ErrorMessage ?? 'unknown');
        throw new Error(`ocr: ${msg}`);
      }
      const text = (ocrJson.ParsedResults ?? []).map((r) => r.ParsedText ?? '').join('\n\n').trim();
      return jsonResponse({ status: 'ready', text });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonResponse({ status: 'failed', error: msg }, 200);
    }
  }

  // From here on, use service role for sidecar storage + job tracking.
  const admin = createClient(supabaseUrl, serviceKey);
  const outPath = sidecarPath(path);

  // 1. Sidecar already exists?
  const dir = outPath.includes('/') ? outPath.substring(0, outPath.lastIndexOf('/')) : '';
  const name = outPath.substring(outPath.lastIndexOf('/') + 1);
  const { data: existing } = await admin.storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  if (existing?.some((e) => e.name === name)) {
    return jsonResponse({ status: 'ready', path: outPath });
  }

  // 2. Lock via ocr_jobs
  const { error: insertErr } = await admin
    .from('ocr_jobs')
    .insert({ path, status: 'processing' });
  if (insertErr) {
    // Already exists — read current state
    const { data: job } = await admin.from('ocr_jobs').select('status').eq('path', path).maybeSingle();
    if (job?.status === 'ready') return jsonResponse({ status: 'ready', path: outPath });
    if (job?.status === 'processing') return jsonResponse({ status: 'processing' }, 202);
    if (job?.status === 'failed' || job?.status === 'skipped_too_large') {
      // Allow retry by updating to processing
      await admin.from('ocr_jobs').update({ status: 'processing', error: null, updated_at: new Date().toISOString() }).eq('path', path);
    }
  }

  try {
    // 3. Download original
    const dl = await fetch(signed.signedUrl);
    if (!dl.ok) throw new Error(`download failed ${dl.status}`);
    const buf = new Uint8Array(await dl.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      await admin.from('ocr_jobs').update({ status: 'skipped_too_large', updated_at: new Date().toISOString() }).eq('path', path);
      return jsonResponse({ status: 'skipped_too_large' }, 200);
    }

    // 4. Call OCR.space
    const form = new FormData();
    form.append('file', new Blob([buf], { type: 'application/pdf' }), name.replace('.ocr.pdf', '.pdf'));
    form.append('isCreateSearchablePdf', 'true');
    form.append('isSearchablePdfHideTextLayer', 'true');
    form.append('OCREngine', '2');
    form.append('language', 'por');
    form.append('scale', 'true');
    form.append('detectOrientation', 'true');

    const ocrRes = await fetch(OCR_URL, {
      method: 'POST',
      headers: { apikey: ocrApiKey },
      body: form,
    });
    if (!ocrRes.ok) throw new Error(`ocr.space ${ocrRes.status}`);
    const ocrJson = await ocrRes.json() as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string | string[];
      SearchablePDFURL?: string;
    };
    if (ocrJson.IsErroredOnProcessing) {
      const msg = Array.isArray(ocrJson.ErrorMessage) ? ocrJson.ErrorMessage.join('; ') : (ocrJson.ErrorMessage ?? 'unknown');
      throw new Error(`ocr: ${msg}`);
    }
    const searchableUrl = ocrJson.SearchablePDFURL;
    if (!searchableUrl) throw new Error('ocr: no SearchablePDFURL');

    // 5. Download searchable PDF and upload to sidecar
    const sd = await fetch(searchableUrl);
    if (!sd.ok) throw new Error(`download searchable failed ${sd.status}`);
    const sBuf = new Uint8Array(await sd.arrayBuffer());

    const { error: upErr } = await admin.storage
      .from(BUCKET)
      .upload(outPath, sBuf, { contentType: 'application/pdf', upsert: true });
    if (upErr) throw new Error(`upload sidecar: ${upErr.message}`);

    await admin.from('ocr_jobs').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('path', path);
    return jsonResponse({ status: 'ready', path: outPath });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await admin.from('ocr_jobs').update({ status: 'failed', error: msg, updated_at: new Date().toISOString() }).eq('path', path);
    return jsonResponse({ status: 'failed', error: msg }, 200);
  }
});
