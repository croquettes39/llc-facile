// LLC Facile : formulaire « Nous contacter » et assistante IA (Léa).
// POST JSON { type: "message", ... }  -> enregistre dans llcfacile.messages
// POST JSON { type: "chat", session, lang, messages: [{role, content}] } -> réponse de Léa (Claude)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const ORIGINS = ["https://llcfacile.com", "https://www.llcfacile.com", "https://llc-facile.vercel.app"];
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
const MODEL = Deno.env.get("LLCFACILE_MODEL") ?? "claude-haiku-5-5";

const SYSTEM = `Tu es Léa, l'assistante en ligne de LLC Facile (llcfacile.com), un service qui accompagne les francophones (Maroc, France, Belgique, Suisse, Afrique) dans la création d'une LLC américaine au Wyoming, 100 % en ligne. LLC Facile est une marque de Sovereignlife immo, SARL marocaine (Casablanca).

Langue : réponds dans la langue du visiteur. Français par défaut ; darija marocaine en lettres arabes si le visiteur écrit en darija ou en arabe ; anglais s'il écrit en anglais.
Style : chaleureux, simple, tutoiement interdit (vouvoiement en français). Réponses courtes : 2 à 4 phrases, 80 mots maximum. Texte simple, sans markdown, sans listes à puces, sans émojis (tes réponses sont lues à voix haute).

Ce que tu sais :
- Formules (prix TTC, paiement unique, frais d'État du Wyoming inclus) :
  Basic 299 € (3 290 MAD) : création de la LLC au Wyoming, agent enregistré la 1re année, numéro de téléphone américain, numéro EIN, accompagnement de base.
  Ultimate 499 € (5 390 MAD), la plus choisie : tout Basic + aide pour Stripe et PayPal + aide pour ouvrir un compte professionnel US (Mercury, Wise…) + accompagnement complet.
  Ultimate Launch 699 € (7 590 MAD) : tout Ultimate + création et configuration d'une boutique Shopify + paiements par carte via Stripe et PayPal + lancement accompagné.
  Option ITIN : + 249 € (2 690 MAD), aide à la demande de numéro fiscal personnel auprès de l'IRS, sans garantie d'acceptation.
  Maintenance annuelle à partir de la 2e année : 290 € / an (3 150 MAD) : agent enregistré, rapport annuel du Wyoming, déclaration Form 5472 / 1120 pro forma, rappels.
- Étapes : formulaire en ligne (10 minutes) sur llcfacile.com/commander, dépôt au Wyoming, EIN auprès de l'IRS, puis banque et Stripe.
- Documents : passeport valide (ou carte d'identité), adresse complète, description de l'activité, associés et leurs parts.
- Délais : la société est en général enregistrée en quelques jours ouvrés ; l'EIN peut prendre de quelques jours à plusieurs semaines pour les non-résidents.
- Pas besoin de visa ni de voyage, pas besoin d'habiter aux États-Unis, pas de capital minimum.
- Stripe n'accepte pas les sociétés marocaines ; une LLC avec EIN et compte US permet de demander un compte Stripe américain (validation finale par Stripe).
- Shopify Payments exige un SSN ou un ITIN : on configure Shopify avec Stripe et PayPal.
- Contact humain : WhatsApp Maroc +212 6 63 28 51 19, WhatsApp France/Europe +33 7 80 80 31 30, e-mail contact@llcfacile.com.

Règles strictes :
- Tu ne donnes jamais de conseil fiscal, juridique ou en matière de change. Tu ne promets jamais de payer moins d'impôts : le client peut rester imposable dans son pays de résidence et doit respecter la réglementation des changes (Office des Changes au Maroc). Pour ces questions, conseille un fiscaliste ou un expert-comptable.
- Tu ne garantis jamais l'ouverture d'un compte bancaire, Stripe, PayPal ou l'obtention d'un ITIN.
- Tu n'inventes rien : si tu ne sais pas, propose WhatsApp ou l'e-mail.
- Pour commander, oriente vers llcfacile.com/commander. Pour une question personnelle ou urgente, propose WhatsApp.
- Ne demande jamais de numéro de passeport, de carte bancaire ni de mot de passe dans le chat.
- Reste sur le sujet de LLC Facile et de la création de LLC ; pour le reste, réponds poliment que tu ne peux aider que sur ce sujet.`;

const hits = new Map<string, number[]>();
function limited(ip: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > max;
}

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.includes(origin) || /^https:\/\/llc-facile-[a-z0-9-]+\.vercel\.app$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}
const s = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "format" }, 400); }
  const lang = ["fr", "ar", "en"].includes(s(b.lang, 2)) ? s(b.lang, 2) : "fr";

  if (b.type === "message") {
    if (s(b.site_url)) return json({ ok: true });
    if (limited("m:" + ip, 5, 3600_000)) return json({ error: "limite" }, 429);
    const nom = s(b.nom, 120), email = s(b.email, 200), message = s(b.message, 4000);
    if (!nom || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "champs" }, 400);
    try {
      await sql`insert into llcfacile.messages ${sql({
        langue: lang, nom, email, telephone: s(b.telephone, 40) || null, sujet: s(b.sujet, 120) || null, message, ip,
      })}`;
    } catch (e) { console.error(e); return json({ error: "base" }, 500); }
    return json({ ok: true });
  }

  if (b.type === "chat") {
    if (limited("c:" + ip, 30, 600_000)) return json({ error: "limite" }, 429);
    const session = s(b.session, 64) || "anonyme";
    const raw = Array.isArray(b.messages) ? b.messages.slice(-12) : [];
    const messages = raw
      .map((m: any) => ({ role: m?.role === "assistant" ? "assistant" : "user", content: s(m?.content, 1200) }))
      .filter((m) => m.content);
    while (messages.length && messages[0].role !== "user") messages.shift();
    if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "messages" }, 400);

    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ ok: false, fallback: true });

    let reply = "";
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 400, system: SYSTEM, messages }),
      });
      const d = await r.json();
      if (!r.ok) { console.error(JSON.stringify(d)); return json({ ok: false, fallback: true }); }
      reply = (d.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim();
    } catch (e) { console.error(e); return json({ ok: false, fallback: true }); }

    try {
      await sql`insert into llcfacile.chat ${sql({ session, langue: lang, question: messages[messages.length - 1].content, reponse: reply, ip })}`;
    } catch (e) { console.error(e); }
    return json({ ok: true, reply });
  }

  return json({ error: "type" }, 400);
});
