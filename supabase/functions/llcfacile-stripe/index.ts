// Webhook Stripe pour LLC Facile.
// checkout.session.completed d'un paiement dont client_reference_id commence par « LLC- » :
//  -> marque la commande payée, envoie au client un e-mail de confirmation (+ guide PDF),
//     et prévient LLC Facile. Les paiements des autres activités du même compte Stripe sont ignorés.
// Secrets : STRIPE_WEBHOOK_SECRET, SMTP_PASS (+ facultatifs SMTP_HOST, SMTP_PORT, SMTP_USER, NOTIFY_EMAIL).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.5";
import nodemailer from "npm:nodemailer@6.9.16";

const sql = postgres(Deno.env.get("SUPABASE_DB_URL")!, { max: 1, prepare: false });
const PRIX: Record<string, number> = { basic: 29900, ultimate: 49900, ultimate_launch: 69900 };
const ITIN = 24900;
const NOMS: Record<string, string> = { basic: "Basic", ultimate: "Ultimate", ultimate_launch: "Ultimate Launch" };
const GUIDE_URL = "https://llcfacile.com/documents/guide-client-llc-facile.pdf";
const FROM = Deno.env.get("SMTP_USER") ?? "contact@llcfacile.com";
const NOTIFY = Deno.env.get("NOTIFY_EMAIL") ?? "contact@llcfacile.com";

async function verify(raw: string, header: string | null, secret: string) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts["t"];
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - Number(t)) > 600) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => s.length === hex.length && [...s].every((c, i) => c === hex[i]));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

type T = { subject: string; hello: string; intro: string; rows: [string, string][]; next: string[]; nextTitle: string; guide: string; sign: string; dir: string };

function texts(lang: string, kind: "formule" | "itin", prenom: string, ref: string, formule: string, montant: string): T {
  const p = esc(prenom);
  if (lang === "en") return {
    dir: "ltr",
    subject: kind === "formule" ? `Payment confirmed – your LLC (${ref})` : `ITIN option payment confirmed (${ref})`,
    hello: `Hello ${p},`,
    intro: kind === "formule" ? "Thank you, we have received your payment. Your file is now open and we are starting work on your US LLC." : "Thank you, we have received the payment for your ITIN option. We will prepare your W-7 application and get back to you.",
    rows: [["File number", ref], ["Package", kind === "formule" ? formule : "ITIN option"], ["Amount paid", montant]],
    nextTitle: "What happens next",
    next: kind === "formule" ? ["Within 24 to 48 business hours: we check your file and your company name.", "Then: filing in Wyoming, operating agreement and EIN application.", "You will be kept updated on WhatsApp at each step."] : ["We prepare your W-7 form and the supporting documents.", "IRS processing usually takes about 7 to 11 weeks (not guaranteed)."],
    guide: "Attached: your client guide (in French), with every step and the expected timelines.",
    sign: "The LLC Facile team",
  };
  if (lang === "ar") return {
    dir: "rtl",
    subject: kind === "formule" ? `تأكيد الخلاص – LLC ديالك (${ref})` : `تأكيد خلاص اختيار ITIN (${ref})`,
    hello: `السلام ${p}،`,
    intro: kind === "formule" ? "شكرا، توصلنا بالخلاص ديالك. الملف ديالك تحل وبدينا الخدمة على LLC ديالك فأمريكا." : "شكرا، توصلنا بخلاص اختيار ITIN. غادي نوجدو الطلب W-7 ونرجعو ليك.",
    rows: [["رقم الملف", ref], ["العرض", kind === "formule" ? formule : "اختيار ITIN"], ["المبلغ المخلص", montant]],
    nextTitle: "شنو اللي جاي",
    next: kind === "formule" ? ["ف24 حتى 48 ساعة ديال الخدمة: كنراجعو الملف وسمية الشركة.", "من بعد: التسجيل فوايومينغ، operating agreement وطلب EIN.", "غادي نعلموك فالواتساب فكل مرحلة."] : ["كنوجدو الطلب W-7 والوثائق.", "IRS غالبا كياخد تقريبا من 7 حتى 11 سيمانة (ماشي مضمون)."],
    guide: "مرفوق: دليل الزبون (بالفرنسية) فيه كاع المراحل والمدة التقريبية.",
    sign: "فريق LLC Facile",
  };
  return {
    dir: "ltr",
    subject: kind === "formule" ? `Paiement confirmé – votre LLC (${ref})` : `Paiement de l'option ITIN confirmé (${ref})`,
    hello: `Bonjour ${p},`,
    intro: kind === "formule" ? "Merci, nous avons bien reçu votre paiement. Votre dossier est ouvert et nous commençons la création de votre LLC aux États-Unis." : "Merci, nous avons bien reçu le paiement de votre option ITIN. Nous préparons votre demande W-7 et revenons vers vous.",
    rows: [["Numéro de dossier", ref], ["Formule", kind === "formule" ? formule : "Option ITIN"], ["Montant payé", montant]],
    nextTitle: "La suite",
    next: kind === "formule" ? ["Sous 24 à 48 h ouvrées : vérification de votre dossier et du nom de votre société.", "Ensuite : dépôt au Wyoming, operating agreement et demande d'EIN.", "Nous vous tenons informé sur WhatsApp à chaque étape."] : ["Nous préparons votre formulaire W-7 et les pièces justificatives.", "Le traitement par l'IRS prend en général environ 7 à 11 semaines (sans garantie)."],
    guide: "Vous trouverez en pièce jointe votre guide client, avec toutes les étapes et les délais indicatifs.",
    sign: "L'équipe LLC Facile",
  };
}

function html(t: T, withGuide: boolean) {
  const rows = t.rows.map(([k, v]) => `<tr><td style="padding:10px 14px;color:#3B4656;font-size:14px;border-bottom:1px solid #E2DED6">${esc(k)}</td><td style="padding:10px 14px;font-weight:700;font-size:14px;border-bottom:1px solid #E2DED6;direction:ltr;unicode-bidi:isolate">${esc(v)}</td></tr>`).join("");
  const next = t.next.map((n) => `<li style="margin:0 0 8px">${esc(n)}</li>`).join("");
  return `<!doctype html><html dir="${t.dir}"><body style="margin:0;background:#F4F2EE;font-family:Arial,Helvetica,sans-serif;color:#0E1B2C">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F2EE;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0B1A33;padding:22px 28px;border-bottom:4px solid #D4A63A"><span style="font-size:24px;font-weight:800;font-style:italic;color:#D4A63A">LLC</span><span style="font-size:24px;font-weight:800;font-style:italic;color:#ffffff">Facile</span><span style="font-size:16px;font-style:italic;color:#B8C2D1">.com</span></td></tr>
<tr><td style="padding:28px">
<p style="font-size:16px;margin:0 0 14px">${t.hello}</p>
<p style="font-size:15px;line-height:1.6;margin:0 0 20px">${esc(t.intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2DED6;border-radius:10px;border-collapse:separate;margin:0 0 22px">${rows}</table>
<p style="font-size:16px;font-weight:700;margin:0 0 10px">${esc(t.nextTitle)}</p>
<ul style="font-size:14px;line-height:1.6;padding-inline-start:20px;margin:0 0 20px">${next}</ul>
${withGuide ? `<p style="font-size:14px;line-height:1.6;background:#FFF8EA;border-inline-start:4px solid #D4A63A;padding:12px 14px;margin:0 0 22px">${esc(t.guide)}</p>` : ""}
<p style="font-size:14px;margin:0 0 4px">${esc(t.sign)}</p>
<p style="font-size:13px;color:#3B4656;margin:0;direction:ltr">WhatsApp +212 6 63 28 51 19 · +33 7 80 80 31 30 · contact@llcfacile.com</p>
</td></tr>
<tr><td style="background:#F4F2EE;padding:16px 28px;font-size:11px;color:#4A5565;line-height:1.5">LLC Facile, marque de Sovereignlife immo SARL (RC 722751, Casablanca). Service d'accompagnement administratif, sans conseil juridique ni fiscal. llcfacile.com</td></tr>
</table></td></tr></table></body></html>`;
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;
function mailer() {
  const pass = Deno.env.get("SMTP_PASS");
  if (!pass) return null;
  transport ??= nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") ?? "mail.llcfacile.com",
    port: Number(Deno.env.get("SMTP_PORT") ?? 465),
    secure: true,
    auth: { user: FROM, pass },
  });
  return transport;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  const raw = await req.text();
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret || !(await verify(raw, req.headers.get("stripe-signature"), secret))) return new Response("signature", { status: 400 });

  const ev = JSON.parse(raw);
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(ev.type)) return new Response("ignoré");
  const s = ev.data?.object ?? {};
  const ref: string = s.client_reference_id ?? "";
  if (!ref.startsWith("LLC-")) return new Response("autre activité");
  if (s.payment_status !== "paid") return new Response("pas encore payé");

  const amount = Number(s.amount_total ?? 0);
  const email = s.customer_details?.email ?? s.customer_email ?? null;
  try {
    await sql`insert into llcfacile.paiements ${sql({ stripe_event: ev.id, stripe_session: s.id, reference: ref, email, montant_centimes: amount, devise: s.currency, type: amount === ITIN ? "itin" : "formule" })}`;
  } catch {
    return new Response("déjà traité");
  }

  const [c] = await sql`select * from llcfacile.commandes where reference = ${ref}`;
  if (!c) { console.error("commande introuvable", ref); return new Response("commande introuvable"); }

  const kind: "formule" | "itin" = amount === ITIN && c.option_itin && amount !== PRIX[c.formule] ? "itin" : "formule";
  if (kind === "formule") {
    await sql`update llcfacile.commandes set statut = case when statut = 'nouvelle' then 'payee' else statut end, paye_le = now(), stripe_session = ${s.id}, montant_paye_centimes = ${amount} where reference = ${ref}`;
  } else {
    await sql`update llcfacile.commandes set itin_paye_le = now() where reference = ${ref}`;
  }

  const montant = `${(amount / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${String(s.currency ?? "eur").toUpperCase()}`;
  const t = texts(c.langue, kind, c.prenom, ref, NOMS[c.formule] ?? c.formule, montant);
  const m = mailer();
  if (!m) { console.error("SMTP_PASS manquant : e-mails non envoyés"); return new Response("ok sans e-mail"); }

  try {
    const attachments = [];
    if (kind === "formule") {
      const pdf = await fetch(GUIDE_URL);
      if (pdf.ok) attachments.push({ filename: "Guide-client-LLC-Facile.pdf", content: new Uint8Array(await pdf.arrayBuffer()), contentType: "application/pdf" });
    }
    await m.sendMail({
      from: `"LLC Facile" <${FROM}>`, to: email ?? c.email, replyTo: FROM,
      subject: t.subject, html: html(t, kind === "formule"), attachments,
    });
    if (kind === "formule") await sql`update llcfacile.commandes set email_confirmation_le = now() where reference = ${ref}`;
  } catch (e) { console.error("e-mail client", e); }

  try {
    await m.sendMail({
      from: `"LLC Facile – site" <${FROM}>`, to: NOTIFY,
      subject: `💰 Paiement reçu ${ref} – ${kind === "formule" ? NOMS[c.formule] : "Option ITIN"} – ${montant}`,
      text: `Paiement reçu sur llcfacile.com\n\nDossier : ${ref}\nType : ${kind === "formule" ? "Formule " + NOMS[c.formule] : "Option ITIN"}\nMontant : ${montant}\nClient : ${c.prenom} ${c.nom}\nE-mail : ${email ?? c.email}\nWhatsApp : ${c.telephone}\nPays : ${c.pays_residence}\nSociété souhaitée : ${c.nom_societe_1} ${c.suffixe}\nOption ITIN commandée : ${c.option_itin ? "oui" : "non"}\nDémarrage immédiat demandé : ${c.demarrage_immediat ? "oui" : "non"}\n\nDossier complet : Supabase > llcfacile.commandes`,
    });
  } catch (e) { console.error("e-mail interne", e); }

  return new Response("ok");
});
