// Mesure d'audience anonyme de llcfacile.com (sans cookie publicitaire, sans adresse IP enregistrée).
// POST (texte JSON, envoyé par navigator.sendBeacon) :
//   { t: "pv" | "hb" | "bye", v: visiteur, s: session, p: page, l: langue, r: référent, u: utm_source, tz: fuseau, w: largeur écran }
// pv = page vue, hb = « toujours là » (toutes les 25 s), bye = l'onglet se ferme.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const ORIGINS = ["https://llcfacile.com", "https://www.llcfacile.com", "https://llc-facile.vercel.app"];
const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });

const NOMS: Record<string, string> = {
  MA: "Maroc", FR: "France", BE: "Belgique", CH: "Suisse", LU: "Luxembourg", MC: "Monaco", CA: "Canada", DZ: "Algérie", TN: "Tunisie",
  SN: "Sénégal", CI: "Côte d'Ivoire", CM: "Cameroun", GB: "Royaume-Uni", ES: "Espagne", DE: "Allemagne", IT: "Italie", NL: "Pays-Bas",
  PT: "Portugal", AE: "Émirats arabes unis", SA: "Arabie saoudite", QA: "Qatar", TR: "Turquie", US: "États-Unis", IE: "Irlande",
  AT: "Autriche", SE: "Suède", NO: "Norvège", DK: "Danemark", FI: "Finlande", PL: "Pologne", RO: "Roumanie", GR: "Grèce",
  EG: "Égypte", MR: "Mauritanie", ML: "Mali", GA: "Gabon", CD: "RD Congo", CG: "Congo", BJ: "Bénin", BF: "Burkina Faso", TG: "Togo",
  MG: "Madagascar", MU: "Maurice", GN: "Guinée", NE: "Niger", TD: "Tchad", RE: "La Réunion", GP: "Guadeloupe", MQ: "Martinique",
  BR: "Brésil", MX: "Mexique", IN: "Inde", CN: "Chine", JP: "Japon", SG: "Singapour", HK: "Hong Kong", KW: "Koweït", BH: "Bahreïn",
  OM: "Oman", JO: "Jordanie", LB: "Liban", IL: "Israël", RU: "Russie", UA: "Ukraine", AU: "Australie", HU: "Hongrie", CZ: "Tchéquie",
};
// Repli : pays déduit du fuseau horaire du navigateur.
const PAYS: Record<string, string> = {
  "Africa/Casablanca": "Maroc", "Africa/El_Aaiun": "Maroc", "Europe/Paris": "France", "Europe/Brussels": "Belgique",
  "Europe/Zurich": "Suisse", "Europe/Luxembourg": "Luxembourg", "Europe/Monaco": "Monaco", "America/Montreal": "Canada",
  "America/Toronto": "Canada", "Africa/Algiers": "Algérie", "Africa/Tunis": "Tunisie", "Africa/Dakar": "Sénégal",
  "Africa/Abidjan": "Côte d'Ivoire", "Africa/Douala": "Cameroun", "Europe/London": "Royaume-Uni", "Europe/Madrid": "Espagne",
  "Europe/Berlin": "Allemagne", "Europe/Rome": "Italie", "Europe/Amsterdam": "Pays-Bas", "Europe/Lisbon": "Portugal",
  "Asia/Dubai": "Émirats arabes unis", "Asia/Riyadh": "Arabie saoudite", "Asia/Qatar": "Qatar", "Europe/Istanbul": "Turquie",
  "America/New_York": "États-Unis", "America/Chicago": "États-Unis", "America/Denver": "États-Unis", "America/Los_Angeles": "États-Unis",
};
const pays = (tz: string) => PAYS[tz] ?? (!tz || /^(UTC|Etc|GMT)/i.test(tz) ? "Inconnu" : tz.split("/")[0].replace("America", "Amériques").replace("Africa", "Afrique").replace("Asia", "Asie").replace("Europe", "Europe") + " (autre)");

function appareil(ua: string, w: number) {
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "Tablette";
  if (/Mobi|iPhone|Android/i.test(ua) || (w && w < 760)) return "Mobile";
  return "Ordinateur";
}
function navigateur(ua: string) {
  if (/Edg\//.test(ua)) return "Edge";
  if (/SamsungBrowser/.test(ua)) return "Samsung";
  if (/OPR\//.test(ua)) return "Opera";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua)) return "Safari";
  return "Autre";
}
function source(ref: string, utm: string) {
  if (utm) return utm.toLowerCase().slice(0, 60);
  if (!ref) return "Direct";
  let host = "";
  try { host = new URL(ref).hostname.replace(/^www\./, ""); } catch { return "Direct"; }
  if (!host || host.endsWith("llcfacile.com") || host.endsWith("vercel.app")) return "Direct";
  if (/google\./.test(host)) return "Google";
  if (/bing\./.test(host)) return "Bing";
  if (/instagram\./.test(host)) return "Instagram";
  if (/facebook\.|fb\./.test(host)) return "Facebook";
  if (/tiktok\./.test(host)) return "TikTok";
  if (/whatsapp\.|wa\.me/.test(host)) return "WhatsApp";
  if (/youtube\.|youtu\.be/.test(host)) return "YouTube";
  if (/t\.co$|twitter\.|x\.com/.test(host)) return "X (Twitter)";
  if (/linkedin\./.test(host)) return "LinkedIn";
  return host.slice(0, 60);
}

const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > max;
}
const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|curl|python|wget/i;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const ok = origin && (ORIGINS.includes(origin) || /^https:\/\/llc-facile-[a-z0-9-]+\.vercel\.app$/.test(origin));
  const h = { "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin" };
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  const done = new Response(null, { status: 204, headers: h });
  if (req.method !== "POST" || !ok) return done;

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT.test(ua)) return done;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "?";
  if (limited(ip, 120, 600_000)) return done;

  let b: Record<string, unknown>;
  try { b = JSON.parse(await req.text()); } catch { return done; }
  const t = s(b.t, 4), v = s(b.v, 40), sess = s(b.s, 40);
  if (!/^[a-z0-9]{8,40}$/i.test(v) || !/^[a-z0-9]{8,40}$/i.test(sess)) return done;
  const page = s(b.p, 160).split("?")[0] || "/";
  const langue = ["fr", "ar", "en"].includes(s(b.l, 2)) ? s(b.l, 2) : "fr";
  const w = Number(b.w) || 0;
  const app = appareil(ua, w);
  // Pays : en-tête géographique du réseau (code pays seulement, pas d'IP stockée), sinon fuseau horaire.
  const cc = (s(b.c, 2) || req.headers.get("cf-ipcountry") || "").toUpperCase(); // code pays envoyé par llcfacile.com/api/geo
  const p = /^[A-Z]{2}$/.test(cc) && cc !== "XX" && cc !== "T1" ? (NOMS[cc] ?? cc) : pays(s(b.tz, 60));

  try {
    if (t === "bye") {
      await sql`delete from llcfacile.presence where session = ${sess}`;
    } else if (t === "pv") {
      const src = source(s(b.r, 300), s(b.u, 60));
      await sql`insert into llcfacile.visites ${sql({ visiteur: v, session: sess, page, langue, source: src, appareil: app, navigateur: navigateur(ua), pays: p })}`;
      await sql`insert into llcfacile.presence (session, visiteur, page, langue, pays, appareil, source)
        values (${sess}, ${v}, ${page}, ${langue}, ${p}, ${app}, ${src})
        on conflict (session) do update set page = excluded.page, langue = excluded.langue, vu_le = now()`;
    } else if (t === "hb") {
      await sql`insert into llcfacile.presence (session, visiteur, page, langue, pays, appareil)
        values (${sess}, ${v}, ${page}, ${langue}, ${p}, ${app})
        on conflict (session) do update set page = excluded.page, vu_le = now()`;
    }
    // Petit ménage : les présences de plus d'une heure ne servent plus.
    if (Math.random() < 0.02) await sql`delete from llcfacile.presence where vu_le < now() - interval '1 hour'`;
  } catch (e) { console.error(e); }
  return done;
});
