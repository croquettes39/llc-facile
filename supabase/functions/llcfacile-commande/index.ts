// Reçoit le formulaire de commande LLC Facile, enregistre la pièce d'identité
// dans le bucket privé `llcfacile-documents` et la commande dans `llcfacile.commandes`.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";

const ORIGINS = ["https://llcfacile.com", "https://www.llcfacile.com", "https://llc-facile.vercel.app"];
const PRIX = { basic: [299, 3290], ultimate: [499, 5390], ultimate_launch: [699, 7590] } as const;
const ITIN = [249, 2690];
// Liens de paiement Stripe (Payment Links). Un secret STRIPE_LINK_<FORMULE>[_ITIN] peut les remplacer.
// Sans lien pour la combinaison exacte (formule + option ITIN), le client reçoit le lien sur WhatsApp.
const LINKS: Record<string, string> = {
  STRIPE_LINK_BASIC: "https://buy.stripe.com/7sY6oJ2od9mQ8Yc4b85J60p",
};
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "application/pdf": "pdf" };

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.includes(origin) || /^https:\/\/llc-facile-[a-z0-9-]+\.vercel\.app$/.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}
const txt = (v: FormDataEntryValue | null, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

Deno.serve(async (req) => {
  const h = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: h });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...h, "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  let f: FormData;
  try { f = await req.formData(); } catch { return json({ error: "format" }, 400); }
  if (txt(f.get("site_url"))) return json({ ok: true, reference: "OK" }); // pot de miel anti-robots

  const formule = txt(f.get("formule")) as keyof typeof PRIX;
  if (!(formule in PRIX)) return json({ error: "formule" }, 400);
  const devise = txt(f.get("devise")) === "MAD" ? "MAD" : "EUR";
  const itin = txt(f.get("option_itin")) === "1";
  const i = devise === "EUR" ? 0 : 1;
  const montant = PRIX[formule][i] + (itin ? ITIN[i] : 0);

  const requis = ["prenom", "nom", "email", "telephone", "pays_residence", "adresse", "ville", "nom_societe_1", "activite"];
  const manquants = requis.filter((k) => !txt(f.get(k)));
  if (manquants.length) return json({ error: "champs", champs: manquants }, 400);
  const email = txt(f.get("email"), 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email" }, 400);
  if (txt(f.get("accepte_cgv")) !== "1") return json({ error: "cgv" }, 400);

  let associes: unknown[] = [];
  try {
    const a = JSON.parse(txt(f.get("associes"), 4000) || "[]");
    if (Array.isArray(a)) associes = a.slice(0, 10).map((x) => ({
      nom: String(x?.nom ?? "").slice(0, 120), part: Number(x?.part) || 0,
    }));
  } catch { /* ignoré */ }

  const ref = "LLC-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" +
    crypto.randomUUID().slice(0, 6).toUpperCase();

  let piecePath: string | null = null;
  const piece = f.get("piece_identite");
  if (piece instanceof File && piece.size > 0) {
    if (!TYPES.includes(piece.type)) return json({ error: "fichier_type" }, 400);
    if (piece.size > 10 * 1024 * 1024) return json({ error: "fichier_taille" }, 400);
    piecePath = `${ref}/piece-identite.${EXT[piece.type]}`;
    const up = await fetch(`${Deno.env.get("SUPABASE_URL")}/storage/v1/object/llcfacile-documents/${piecePath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        "Content-Type": piece.type,
        "x-upsert": "false",
      },
      body: piece.stream(),
      // @ts-ignore: duplex requis pour envoyer un flux
      duplex: "half",
    });
    if (!up.ok) return json({ error: "upload" }, 500);
  } else {
    return json({ error: "champs", champs: ["piece_identite"] }, 400);
  }

  const dn = txt(f.get("date_naissance"), 10);
  try {
    await sql`insert into llcfacile.commandes ${sql({
      reference: ref, langue: txt(f.get("langue"), 2) || "fr", formule, option_itin: itin, devise, montant_total: montant,
      civilite: txt(f.get("civilite"), 20) || null, prenom: txt(f.get("prenom"), 100), nom: txt(f.get("nom"), 100),
      date_naissance: /^\d{4}-\d{2}-\d{2}$/.test(dn) ? dn : null, nationalite: txt(f.get("nationalite"), 80) || null,
      pays_residence: txt(f.get("pays_residence"), 80), email, telephone: txt(f.get("telephone"), 40),
      adresse: txt(f.get("adresse"), 250), code_postal: txt(f.get("code_postal"), 20) || null, ville: txt(f.get("ville"), 100),
      nom_societe_1: txt(f.get("nom_societe_1"), 120), nom_societe_2: txt(f.get("nom_societe_2"), 120) || null,
      nom_societe_3: txt(f.get("nom_societe_3"), 120) || null, suffixe: txt(f.get("suffixe"), 10) || "LLC",
      activite: txt(f.get("activite"), 120), description_activite: txt(f.get("description_activite"), 1500) || null,
      site_web: txt(f.get("site_web"), 200) || null, associes: sql.json(associes),
      piece_identite_path: piecePath, accepte_cgv: true, demarrage_immediat: txt(f.get("demarrage_immediat")) === "1",
      message: txt(f.get("message"), 2000) || null,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0] ?? null, user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    })}`;
  } catch (e) {
    console.error(e);
    return json({ error: "base" }, 500);
  }

  // Lien de paiement Stripe (Payment Link) par formule, réglé dans les secrets de la fonction.
  const cle = `STRIPE_LINK_${formule.toUpperCase()}${itin ? "_ITIN" : ""}`;
  const lien = Deno.env.get(cle) ?? LINKS[cle] ?? null;
  // Les liens Stripe encaissent en euros (le prix en dirhams est indicatif, cf. CGV).
  const paiement = lien ? `${lien}${lien.includes("?") ? "&" : "?"}client_reference_id=${ref}&prefilled_email=${encodeURIComponent(email)}` : null;

  return json({ ok: true, reference: ref, montant, devise, paiement });
});
