// API du panel admin LLC Facile (llcfacile.com/admin).
// Accès : utilisateur Supabase Auth connecté ET dont l'e-mail figure dans llcfacile.admins.
// POST JSON { action, ... }
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SRV = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const BUCKET = "llcfacile-documents";
const ORIGINS = ["https://llcfacile.com", "https://www.llcfacile.com", "https://llc-facile.vercel.app"];
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.includes(origin) || /^https:\/\/llc-facile-[a-z0-9-]+\.vercel\.app$/.test(origin) || origin.startsWith("http://localhost"));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Vary": "Origin",
  };
}
const s = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const refOk = (r: string) => /^LLC-\d{6}-[A-Z0-9]{6}$/.test(r);
const store = (path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/storage/v1/${path}`, { ...init, headers: { Authorization: `Bearer ${SRV}`, apikey: SRV, "content-type": "application/json", ...(init.headers ?? {}) } });

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });

  // Qui est connecté ?
  const auth = req.headers.get("authorization") ?? "";
  const u = await fetch(`${URL_}/auth/v1/user`, { headers: { Authorization: auth, apikey: ANON } });
  if (!u.ok) return json({ error: "non_connecte" }, 401);
  const user = await u.json();
  const email = String(user.email ?? "").toLowerCase();
  const [adm] = await sql`select email from llcfacile.admins where lower(email) = ${email}`;
  if (!adm) return json({ error: "acces_refuse" }, 403);

  let b: Record<string, any>;
  try { b = await req.json(); } catch { return json({ error: "format" }, 400); }
  const ref = s(b.reference, 40);

  switch (b.action) {
    case "moi":
      return json({ ok: true, email });

    case "liste": {
      const rows = await sql`
        select c.reference, c.created_at, c.statut, c.formule, c.option_itin, c.prenom, c.nom, c.pays_residence, c.email, c.telephone,
               c.nom_societe_1, c.nom_retenu, c.paye_le, c.itin_paye_le, c.montant_total, c.devise, c.langue, c.demarrage_immediat,
               (select count(*) from llcfacile.etapes e where e.reference = c.reference and e.fait) as etapes_faites,
               (select max(e.maj_le) from llcfacile.etapes e where e.reference = c.reference) as derniere_action
        from llcfacile.commandes c order by c.created_at desc limit 500`;
      const [m] = await sql`select count(*)::int as n from llcfacile.messages where not traite`;
      return json({ ok: true, commandes: rows, messages_non_traites: m.n });
    }

    case "dossier": {
      if (!refOk(ref)) return json({ error: "reference" }, 400);
      const [c] = await sql`select * from llcfacile.commandes where reference = ${ref}`;
      if (!c) return json({ error: "introuvable" }, 404);
      const etapes = await sql`select cle, fait, fait_le, note, maj_par, maj_le from llcfacile.etapes where reference = ${ref}`;
      const paiements = await sql`select created_at, montant_centimes, devise, type, email from llcfacile.paiements where reference = ${ref} order by created_at`;
      const l = await store(`object/list/${BUCKET}`, { method: "POST", body: JSON.stringify({ prefix: `${ref}/`, limit: 100 }) });
      const top = l.ok ? await l.json() : [];
      const l2 = await store(`object/list/${BUCKET}`, { method: "POST", body: JSON.stringify({ prefix: `${ref}/livrables/`, limit: 100 }) });
      const liv = l2.ok ? await l2.json() : [];
      const fichiers = [
        ...top.filter((f: any) => f.id).map((f: any) => ({ path: `${ref}/${f.name}`, nom: f.name, taille: f.metadata?.size ?? null, type: "client" })),
        ...liv.filter((f: any) => f.id).map((f: any) => ({ path: `${ref}/livrables/${f.name}`, nom: f.name, taille: f.metadata?.size ?? null, type: "livrable" })),
      ];
      return json({ ok: true, commande: c, etapes, paiements, fichiers });
    }

    case "etape": {
      if (!refOk(ref)) return json({ error: "reference" }, 400);
      const cle = s(b.cle, 60);
      if (!/^[a-z0-9_]+$/.test(cle)) return json({ error: "cle" }, 400);
      const fait = !!b.fait;
      const note = b.note === undefined ? null : s(b.note, 2000);
      await sql`
        insert into llcfacile.etapes (reference, cle, fait, fait_le, note, maj_par, maj_le)
        values (${ref}, ${cle}, ${fait}, ${fait ? sql`now()` : null}, ${note}, ${email}, now())
        on conflict (reference, cle) do update set
          fait = excluded.fait,
          fait_le = case when excluded.fait and not llcfacile.etapes.fait then now() when not excluded.fait then null else llcfacile.etapes.fait_le end,
          note = coalesce(${note}, llcfacile.etapes.note),
          maj_par = excluded.maj_par, maj_le = now()`;
      return json({ ok: true });
    }

    case "maj": {
      if (!refOk(ref)) return json({ error: "reference" }, 400);
      const champs: Record<string, unknown> = {};
      if (b.statut !== undefined) {
        if (!["nouvelle", "payee", "en_cours", "terminee", "annulee"].includes(b.statut)) return json({ error: "statut" }, 400);
        champs.statut = b.statut;
      }
      if (b.notes_internes !== undefined) champs.notes_internes = s(b.notes_internes, 8000) || null;
      if (b.nom_retenu !== undefined) champs.nom_retenu = s(b.nom_retenu, 160) || null;
      if (b.ein !== undefined) champs.ein = s(b.ein, 20) || null;
      if (b.date_creation_llc !== undefined) champs.date_creation_llc = /^\d{4}-\d{2}-\d{2}$/.test(s(b.date_creation_llc, 10)) ? s(b.date_creation_llc, 10) : null;
      if (!Object.keys(champs).length) return json({ error: "rien" }, 400);
      await sql`update llcfacile.commandes set ${sql(champs)} where reference = ${ref}`;
      return json({ ok: true });
    }

    case "lien_fichier": {
      const path = s(b.path, 300);
      if (!refOk(path.split("/")[0]) || path.includes("..")) return json({ error: "chemin" }, 400);
      const r = await store(`object/sign/${BUCKET}/${path}`, { method: "POST", body: JSON.stringify({ expiresIn: 300 }) });
      const d = await r.json();
      if (!r.ok) return json({ error: "lien" }, 500);
      return json({ ok: true, url: `${URL_}/storage/v1${d.signedURL}` });
    }

    case "depot_fichier": {
      if (!refOk(ref)) return json({ error: "reference" }, 400);
      const nom = s(b.nom, 120).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-");
      if (!nom || !/\.(pdf|jpg|jpeg|png|webp|docx?)$/i.test(nom)) return json({ error: "nom" }, 400);
      const path = `${ref}/livrables/${nom}`;
      const r = await store(`object/upload/sign/${BUCKET}/${path}`, { method: "POST", headers: { "x-upsert": "true" }, body: "{}" });
      const d = await r.json();
      if (!r.ok) return json({ error: "depot" }, 500);
      return json({ ok: true, url: `${URL_}/storage/v1${d.url}`, path });
    }

    case "messages": {
      const rows = await sql`select id, created_at, langue, nom, email, telephone, sujet, message, traite from llcfacile.messages order by created_at desc limit 200`;
      return json({ ok: true, messages: rows });
    }

    case "message_traite": {
      const id = s(b.id, 40);
      await sql`update llcfacile.messages set traite = ${!!b.traite} where id = ${id}`;
      return json({ ok: true });
    }

    case "chat": {
      const rows = await sql`select created_at, session, langue, question, reponse from llcfacile.chat order by created_at desc limit 200`;
      return json({ ok: true, chat: rows });
    }
  }
  return json({ error: "action" }, 400);
});
