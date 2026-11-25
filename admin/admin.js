/* Panel admin LLC Facile */
{
  const SB_URL = 'https://gbdjiczesmhhsrqhvrgj.supabase.co';
  const SB_KEY = 'sb_publishable_ffvkq3kWc-XkUcBIbAfRsQ_2b0P68hn';
  const API = SB_URL + '/functions/v1/llcfacile-admin';
  const sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, storageKey: 'llcf-admin' } });
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fdate = (d, time) => d ? new Date(d).toLocaleString('fr-FR', time ? { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const NOMS = { basic: 'Basic', ultimate: 'Ultimate', ultimate_launch: 'Ultimate Launch' };
  const ACTIV = { ecommerce: 'E-commerce / dropshipping', digital: 'Produits numériques / formations', services: 'Services / freelance / coaching', saas: 'Logiciel / SaaS / applications', agence: 'Marketing / agence', 'import-export': 'Import-export / négoce', autre: 'Autre' };
  const STATUTS = { nouvelle: 'Non payé', payee: 'Payé – à démarrer', en_cours: 'En cours', terminee: 'Terminé', annulee: 'Annulé' };

  // ---------------- Les démarches, par formule ----------------
  // f : formules concernées (b = basic, u = ultimate, l = ultimate_launch) · itin : seulement si l'option est prise
  const L = {
    wyobiz: ['Registre du Wyoming', 'https://wyobiz.wyo.gov/Business/FilingSearch.aspx'],
    northwest: ['Northwest', 'https://www.northwestregisteredagent.com'],
    ss4pdf: ['Formulaire SS-4 (IRS)', 'https://www.irs.gov/forms-pubs/about-form-ss-4'],
    mercury: ['Mercury', 'https://mercury.com'],
    wise: ['Wise Business', 'https://wise.com/business/'],
    stripe: ['Stripe', 'https://dashboard.stripe.com/register'],
    paypal: ['PayPal Business', 'https://www.paypal.com/business'],
    shopify: ['Shopify', 'https://www.shopify.com'],
    w7: ['Formulaire W-7 (IRS)', 'https://www.irs.gov/forms-pubs/about-form-w-7'],
  };
  const STEPS = [
    { phase: 'Démarrage', cle: 'verif', f: 'bul', t: 'Vérifier paiement, passeport et activité', d: 'Paiement visible dans Stripe, passeport lisible et valide, même nom que le formulaire, activité licite.', wa: 'recu' },
    { phase: 'Démarrage', cle: 'nom', f: 'bul', t: 'Valider le nom de la société', d: 'Chercher les 3 noms sur le registre du Wyoming, garder le premier libre, le noter dans « Nom retenu ».', links: ['wyobiz'], wa: 'nom' },
    { phase: 'Création', cle: 'depot', f: 'bul', t: 'Déposer la LLC (Northwest)', d: 'Commander la création au Wyoming avec agent enregistré. Indiquer le nom retenu, l’adresse du client, 1 membre ou les associés.', links: ['northwest'] },
    { phase: 'Création', cle: 'statuts', f: 'bul', t: 'Articles of Organization reçus', d: 'Déposer le PDF des statuts dans « Documents » et noter la date de création.', wa: 'creee' },
    { phase: 'Création', cle: 'oa', f: 'bul', t: 'Operating agreement signé', d: 'Préparer l’operating agreement (modèle Northwest), le faire signer, le déposer dans « Documents ».' },
    { phase: 'Création', cle: 'ein_envoi', f: 'bul', t: 'SS-4 envoyé à l’IRS par fax', d: 'Remplir le SS-4 avec l’aide « SS-4 pré-rempli », le faire signer, l’envoyer au fax international de l’IRS : +1 304-707-9471. Une seule méthode par client.', links: ['ss4pdf'], ss4: true, wa: 'ein_envoye' },
    { phase: 'Création', cle: 'ein_recu', f: 'bul', t: 'EIN reçu', d: 'Noter l’EIN, déposer la lettre de l’IRS dans « Documents ».', wa: 'ein' },
    { phase: 'Création', cle: 'tel', f: 'bul', t: 'Numéro américain activé', d: 'Activer le numéro US du client et lui envoyer ses accès.' },
    { phase: 'Encaisser (Ultimate)', cle: 'banque', f: 'ul', t: 'Compte pro US ouvert', d: 'Préparer la demande (statuts, OA, EIN, passeport, description d’activité). Le client valide son identité dans l’app.', links: ['mercury', 'wise'], wa: 'banque' },
    { phase: 'Encaisser (Ultimate)', cle: 'stripe', f: 'ul', t: 'Stripe activé', d: 'Compte Stripe US au nom de la LLC, relié au compte bancaire US, site ou réseau du client renseigné.', links: ['stripe'] },
    { phase: 'Encaisser (Ultimate)', cle: 'paypal', f: 'ul', t: 'PayPal Business ouvert', d: 'Compte PayPal professionnel au nom de la LLC.', links: ['paypal'] },
    { phase: 'Boutique (Launch)', cle: 'shopify', f: 'l', t: 'Boutique Shopify créée', d: 'Thème, pages, mentions, produits de départ à partir des éléments du client.', links: ['shopify'] },
    { phase: 'Boutique (Launch)', cle: 'shop_pay', f: 'l', t: 'Paiements branchés + commande test', d: 'Stripe et PayPal connectés à Shopify, paiement test validé puis remboursé.' },
    { phase: 'Boutique (Launch)', cle: 'lancement', f: 'l', t: 'Boutique lancée', d: 'Dernières vérifications, mise en ligne, conseils au client.', wa: 'boutique' },
    { phase: 'Option ITIN', cle: 'itin_dossier', f: 'bul', itin: true, t: 'Dossier W-7 préparé', d: 'W-7 + pièces justificatives. Vérifier si une copie certifiée du passeport est nécessaire.', links: ['w7'] },
    { phase: 'Option ITIN', cle: 'itin_envoi', f: 'bul', itin: true, t: 'Dossier ITIN envoyé à l’IRS', d: 'Noter la date d’envoi : délai IRS d’environ 7 à 11 semaines.' },
    { phase: 'Option ITIN', cle: 'itin_recu', f: 'bul', itin: true, t: 'ITIN reçu', d: 'Déposer la lettre ITIN dans « Documents ».' },
    { phase: 'Fin', cle: 'livraison', f: 'bul', t: 'Dossier complet remis au client', d: 'Envoyer tous les documents, passer le statut à « Terminé ».', wa: 'livre' },
    { phase: 'Fin', cle: 'maintenance', f: 'bul', t: 'Rappel de maintenance programmé', d: 'Noter dans ton agenda un rappel 11 mois après la date de création (lien de maintenance 290 €).', wa: 'maintenance' },
  ];
  const stepsFor = (c) => STEPS.filter(s => s.f.includes({ basic: 'b', ultimate: 'u', ultimate_launch: 'l' }[c.formule]) && (!s.itin || c.option_itin));

  // ---------------- Messages WhatsApp pré-écrits ----------------
  const WA = {
    recu: { fr: (c) => `Bonjour ${c.prenom}, ici LLC Facile 👋 Nous avons bien reçu votre commande ${c.reference} (formule ${NOMS[c.formule]}) et votre paiement. Nous commençons la vérification de votre dossier et revenons vers vous sous 24 à 48 h.`, ar: (c) => `السلام ${c.prenom}، معاك LLC Facile 👋 توصلنا بالطلب ديالك ${c.reference} (عرض ${NOMS[c.formule]}) وبالخلاص. بدينا نراجعو الملف ديالك وغادي نرجعو ليك ف24 حتى 48 ساعة.` },
    nom: { fr: (c) => `Bonne nouvelle ${c.prenom} : le nom « ${c.nom_retenu || c.nom_societe_1} ${c.suffixe} » est disponible au Wyoming ✅ Nous lançons le dépôt de votre société.`, ar: (c) => `خبار زوينة ${c.prenom}: السمية « ${c.nom_retenu || c.nom_societe_1} ${c.suffixe} » متوفرة فوايومينغ ✅ غادي نبداو التسجيل ديال الشركة ديالك.` },
    creee: { fr: (c) => `Félicitations ${c.prenom} 🎉 Votre société ${c.nom_retenu || c.nom_societe_1} ${c.suffixe} est officiellement enregistrée au Wyoming. Prochaine étape : votre operating agreement à signer, puis la demande d'EIN.`, ar: (c) => `مبروك ${c.prenom} 🎉 الشركة ديالك ${c.nom_retenu || c.nom_societe_1} ${c.suffixe} تسجلات رسميا فوايومينغ. المرحلة الجاية: operating agreement باش توقعو، ومن بعد طلب EIN.` },
    ein_envoye: { fr: (c) => `${c.prenom}, votre demande d'EIN a été envoyée à l'IRS aujourd'hui 📨 Le délai habituel est d'environ 4 jours ouvrés à quelques semaines. Nous vous prévenons dès réception.`, ar: (c) => `${c.prenom}، طلب EIN ديالك تصيفط ل IRS اليوم 📨 المدة العادية تقريبا من 4 أيام ديال الخدمة حتى شي سيمانات. غادي نعلموك ملي يوصل.` },
    ein: { fr: (c) => `${c.prenom}, votre numéro EIN est arrivé ✅ ${c.ein ? 'EIN : ' + c.ein + '. ' : ''}${c.formule === 'basic' ? 'Nous préparons maintenant votre dossier complet.' : 'Nous passons maintenant à l’ouverture de votre compte bancaire US.'}`, ar: (c) => `${c.prenom}، رقم EIN ديالك وصل ✅ ${c.ein ? 'EIN: ' + c.ein + '. ' : ''}${c.formule === 'basic' ? 'دابا كنوجدو الملف الكامل ديالك.' : 'دابا غادي ندوزو لفتح الحساب البنكي الأمريكي.'}` },
    banque: { fr: (c) => `${c.prenom}, votre demande de compte bancaire US est envoyée 🏦 Vous allez recevoir un e-mail de la banque pour vérifier votre identité (selfie + pièce d'identité) : faites-le dès que possible, c'est ce qui accélère la validation.`, ar: (c) => `${c.prenom}، طلب الحساب البنكي الأمريكي تصيفط 🏦 غادي يجيك إيميل من البنك باش تأكد الهوية ديالك (سيلفي + الوثيقة): ديرها دغيا، هادشي اللي كيسرّع القبول.` },
    boutique: { fr: (c) => `${c.prenom}, votre boutique est en ligne 🚀 Les paiements par carte (Stripe et PayPal) sont actifs. Bonnes premières ventes !`, ar: (c) => `${c.prenom}، الستور ديالك ولا أونلاين 🚀 الخلاص بالكارط (Stripe و PayPal) خدام. الله يجعل فيه البركة!` },
    livre: { fr: (c) => `${c.prenom}, votre dossier LLC est complet ✅ Vous recevez par e-mail tous vos documents (statuts, operating agreement, lettre EIN…). Gardez-les précieusement. Merci pour votre confiance !`, ar: (c) => `${c.prenom}، الملف ديال LLC ديالك كمل ✅ غادي توصلك فالإيميل كاع الوثائق (الستاتو، operating agreement، رسالة EIN…). حافظ عليهم مزيان. شكرا على الثقة!` },
    maintenance: { fr: (c) => `Bonjour ${c.prenom}, la maintenance annuelle de votre LLC arrive à échéance. Pour garder votre société en règle 12 mois de plus (agent enregistré, rapport annuel, Form 5472), voici le lien : https://buy.stripe.com/4gMeVf3sh2Ys4HWePM5J60t`, ar: (c) => `السلام ${c.prenom}، الصيانة السنوية ديال LLC ديالك قربات تسالي. باش تبقى الشركة ديالك قانونية 12 شهر أخرى (الوكيل المسجل، التقرير السنوي، Form 5472)، هاهو الرابط: https://buy.stripe.com/4gMeVf3sh2Ys4HWePM5J60t` },
  };
  const waLink = (c, key) => {
    const tel = String(c.telephone || '').replace(/[^\d]/g, '');
    const t = (WA[key][c.langue === 'ar' ? 'ar' : 'fr'])(c);
    return `https://wa.me/${tel}?text=${encodeURIComponent(t)}`;
  };

  // ---------------- API ----------------
  async function api(action, data = {}) {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) throw Object.assign(new Error('non_connecte'), { code: 401 });
    const r = await fetch(API, { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token, apikey: SB_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ action, ...data }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(d.error || 'erreur'), { code: r.status });
    return d;
  }
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600); };
  const show = (id) => { $$('main > section').forEach(s => { s.hidden = s.id !== id; }); };
  const setNav = (v) => $$('#admin-nav a[data-view]').forEach(a => { if (a.dataset.view === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });

  // ---------------- Connexion ----------------
  const loginErr = $('#login-err'), loginOk = $('#login-ok');
  const say = (el, m) => { loginErr.hidden = loginOk.hidden = true; if (el) { el.textContent = m; el.hidden = false; } };
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#l-email').value.trim(), password = $('#l-pass').value;
    if (!email || !password) return say(loginErr, 'Saisissez votre e-mail et votre mot de passe.');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return say(loginErr, 'E-mail ou mot de passe incorrect. Première connexion ? Utilisez « créer mon mot de passe ».');
    start();
  });
  $('#first-time').addEventListener('click', async () => {
    const email = $('#l-email').value.trim(), password = $('#l-pass').value;
    if (!email || password.length < 10) return say(loginErr, 'Saisissez votre e-mail et choisissez un mot de passe d’au moins 10 caractères, puis cliquez ici.');
    const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + '/admin/' } });
    if (error) return say(loginErr, 'Création impossible : ' + error.message);
    say(loginOk, 'Compte créé. Si un e-mail de confirmation arrive, cliquez sur le lien, puis revenez vous connecter ici.');
  });
  $('#forgot').addEventListener('click', async () => {
    const email = $('#l-email').value.trim();
    if (!email) return say(loginErr, 'Saisissez d’abord votre e-mail.');
    await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin/#nouveau-mot-de-passe' });
    say(loginOk, 'Si ce compte existe, un e-mail de réinitialisation vient d’être envoyé.');
  });
  sb.auth.onAuthStateChange(async (ev) => {
    if (ev === 'PASSWORD_RECOVERY') {
      const p = prompt('Choisissez votre nouveau mot de passe (10 caractères minimum) :');
      if (p && p.length >= 10) { await sb.auth.updateUser({ password: p }); toast('Mot de passe mis à jour'); start(); }
    }
  });
  const logout = async () => { await sb.auth.signOut(); location.hash = ''; boot(); };
  $('#logout').addEventListener('click', logout);
  $('#denied-logout').addEventListener('click', logout);

  // ---------------- Liste ----------------
  let all = [], filter = 'a_traiter';
  async function loadList() {
    $('#loading').hidden = false;
    const d = await api('liste');
    $('#loading').hidden = true;
    all = d.commandes;
    const mc = $('#msg-count'); mc.textContent = d.messages_non_traites; mc.hidden = !d.messages_non_traites;
    renderList();
  }
  function renderList() {
    const q = $('#search').value.trim().toLowerCase();
    const rows = all.filter(c => {
      if (filter === 'a_traiter' && c.statut !== 'payee') return false;
      if (['en_cours', 'nouvelle', 'terminee'].includes(filter) && c.statut !== filter) return false;
      if (q && ![c.reference, c.prenom, c.nom, c.email, c.telephone, c.nom_societe_1, c.nom_retenu].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
    const nb = (s) => all.filter(c => c.statut === s).length;
    $('#dossiers-sum').textContent = `${nb('payee')} à démarrer · ${nb('en_cours')} en cours · ${nb('nouvelle')} non payés · ${nb('terminee')} terminés`;
    $('#dossiers-table tbody').innerHTML = rows.map(c => {
      const total = stepsFor(c).length, done = Math.min(Number(c.etapes_faites) || 0, total);
      return `<tr data-ref="${esc(c.reference)}">
        <td><a href="#d/${esc(c.reference)}">${esc(c.prenom)} ${esc(c.nom)}</a><span class="sub">${esc(c.reference)} · ${esc(c.pays_residence)}</span></td>
        <td>${esc(NOMS[c.formule])}${c.option_itin ? '<span class="sub">+ option ITIN</span>' : ''}</td>
        <td>${c.paye_le ? `<span class="pay-ok">Payé</span><span class="sub">${fdate(c.paye_le)}</span>` : '<span class="pay-no">En attente</span>'}${c.option_itin ? `<span class="sub">ITIN : ${c.itin_paye_le ? 'payé' : 'en attente'}</span>` : ''}</td>
        <td><span class="bar-out"><span class="bar-in" style="width:${total ? Math.round(done / total * 100) : 0}%"></span></span>${done}/${total}</td>
        <td><span class="tag t-${esc(c.statut)}">${esc(STATUTS[c.statut] || c.statut)}</span></td>
        <td>${fdate(c.created_at)}</td></tr>`;
    }).join('');
    $('#dossiers-empty').hidden = rows.length > 0;
    $$('#dossiers-table tbody tr').forEach(tr => tr.addEventListener('click', (e) => { if (e.target.tagName !== 'A') location.hash = 'd/' + tr.dataset.ref; }));
  }
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f; $$('.filters button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); renderList();
  }));
  $('#search').addEventListener('input', renderList);

  // ---------------- Fiche ----------------
  async function loadDossier(ref) {
    $('#dossier').innerHTML = '<p class="loading">Chargement…</p>';
    const d = await api('dossier', { reference: ref });
    renderDossier(d);
  }
  function renderDossier(d) {
    const c = d.commande, et = Object.fromEntries(d.etapes.map(e => [e.cle, e]));
    const steps = stepsFor(c);
    const done = steps.filter(s => et[s.cle]?.fait).length;
    let phase = '';
    const stepHtml = steps.map(s => {
      const e = et[s.cle] || {};
      const head = s.phase !== phase ? `<p class="phase">${esc(phase = s.phase)}</p>` : '';
      const links = (s.links || []).map(k => `<a href="${L[k][1]}" target="_blank" rel="noopener">${esc(L[k][0])} ↗</a>`).join('');
      const wa = s.wa ? `<a class="wa" href="${waLink(c, s.wa)}" target="_blank" rel="noopener">WhatsApp : message prêt</a>` : '';
      const ss4 = s.ss4 ? `<button type="button" data-ss4>SS-4 pré-rempli</button>` : '';
      return `${head}<div class="step-row${e.fait ? ' done' : ''}">
        <input type="checkbox" id="s-${s.cle}" data-step="${s.cle}" ${e.fait ? 'checked' : ''} aria-describedby="sd-${s.cle}">
        <div><label for="s-${s.cle}" class="t">${esc(s.t)}</label>
        <p class="d" id="sd-${s.cle}">${esc(s.d)}</p>
        ${e.fait ? `<p class="when">Fait le ${fdate(e.fait_le, true)}${e.maj_par ? ' par ' + esc(e.maj_par) : ''}</p>` : ''}
        ${links || wa || ss4 ? `<div class="acts">${links}${ss4}${wa}</div>` : ''}
        <input class="note-in" data-note="${s.cle}" placeholder="Note (ex. envoyé par fax le…)" value="${esc(e.note || '')}" aria-label="Note pour : ${esc(s.t)}">
        </div></div>`;
    }).join('');
    const files = d.fichiers.map(f => `<li><span><span class="k">${f.type === 'client' ? 'Envoyé par le client' : 'Livrable'}</span><br>${esc(f.nom)}</span><button type="button" class="btn-link" data-file="${esc(f.path)}">Ouvrir</button></li>`).join('') || '<li>Aucun fichier.</li>';
    const pays = d.paiements.map(p => `<li>${fdate(p.created_at, true)} · ${p.type === 'itin' ? 'Option ITIN' : 'Formule'} · ${(p.montant_centimes / 100).toLocaleString('fr-FR')} ${esc(String(p.devise || '').toUpperCase())}</li>`).join('') || '<li>Aucun paiement Stripe reçu pour ce dossier.</li>';
    const ass = (c.associes || []).length ? c.associes.map(a => `${esc(a.nom)} (${a.part} %)`).join(', ') : 'Associé unique';
    const telLink = String(c.telephone || '').replace(/[^\d]/g, '');
    $('#dossier').innerHTML = `
      <div class="d-head"><div><h1>${esc(c.prenom)} ${esc(c.nom)}</h1>
        <p class="meta">${esc(c.reference)} · ${esc(NOMS[c.formule])}${c.option_itin ? ' + ITIN' : ''} · reçu le ${fdate(c.created_at, true)} · ${done}/${steps.length} étapes</p></div>
        <span class="tag t-${esc(c.statut)}">${esc(STATUTS[c.statut] || c.statut)}</span></div>
      <div class="d-grid">
        <div><div class="panel"><h2>Démarches</h2>${stepHtml}</div></div>
        <div>
          <div class="panel"><h2>Suivi</h2><div class="d-fields">
            <div class="f"><label for="x-statut">Statut</label><select id="x-statut">${Object.entries(STATUTS).map(([k, v]) => `<option value="${k}" ${c.statut === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
            <div class="f"><label for="x-nom">Nom retenu</label><input id="x-nom" value="${esc(c.nom_retenu || '')}" placeholder="${esc(c.nom_societe_1)}" dir="ltr"></div>
            <div class="f"><label for="x-date">Date de création de la LLC</label><input id="x-date" type="date" value="${esc(c.date_creation_llc ? String(c.date_creation_llc).slice(0, 10) : '')}"></div>
            <div class="f"><label for="x-ein">EIN</label><input id="x-ein" value="${esc(c.ein || '')}" placeholder="12-3456789" dir="ltr"></div>
            <div class="f"><label for="x-notes">Notes internes</label><textarea id="x-notes">${esc(c.notes_internes || '')}</textarea></div>
            <button type="button" class="btn btn-gold" id="x-save">Enregistrer</button>
          </div></div>
          <div class="panel"><h2>Client</h2><dl class="kv">
            <dt>E-mail</dt><dd><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd>
            <dt>WhatsApp</dt><dd><a href="https://wa.me/${telLink}" target="_blank" rel="noopener" dir="ltr">${esc(c.telephone)}</a></dd>
            <dt>Né(e) le</dt><dd>${esc(c.date_naissance ? String(c.date_naissance).slice(0, 10) : '—')}</dd>
            <dt>Nationalité</dt><dd>${esc(c.nationalite || '—')}</dd>
            <dt>Adresse</dt><dd>${esc(c.adresse)}, ${esc(c.code_postal || '')} ${esc(c.ville)}, ${esc(c.pays_residence)}</dd>
            <dt>Langue</dt><dd>${{ fr: 'Français', ar: 'Darija', en: 'Anglais' }[c.langue] || c.langue}</dd>
            <dt>Démarrage immédiat</dt><dd>${c.demarrage_immediat ? 'Oui, demandé' : 'Non (délai de 14 jours)'}</dd>
          </dl></div>
          <div class="panel"><h2>Société</h2><dl class="kv">
            <dt>Noms souhaités</dt><dd dir="ltr">1. ${esc(c.nom_societe_1)}<br>${c.nom_societe_2 ? '2. ' + esc(c.nom_societe_2) + '<br>' : ''}${c.nom_societe_3 ? '3. ' + esc(c.nom_societe_3) : ''}</dd>
            <dt>Terminaison</dt><dd>${esc(c.suffixe)}</dd>
            <dt>Activité</dt><dd>${esc(ACTIV[c.activite] || c.activite)}</dd>
            <dt>Description</dt><dd>${esc(c.description_activite || '—')}</dd>
            <dt>Site web</dt><dd>${c.site_web ? `<a href="${esc(c.site_web)}" target="_blank" rel="noopener noreferrer">${esc(c.site_web)}</a>` : '—'}</dd>
            <dt>Associés</dt><dd>${ass}</dd>
            <dt>Message</dt><dd>${esc(c.message || '—')}</dd>
          </dl></div>
          <div class="panel"><h2>Documents</h2><ul class="files">${files}</ul>
            <div class="f" style="margin-top:12px"><label for="x-up">Ajouter un livrable (PDF, image, Word)</label><input id="x-up" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"></div></div>
          <div class="panel"><h2>Paiements</h2><ul style="margin:0;padding-inline-start:18px;font-size:14px">${pays}</ul></div>
        </div>
      </div>
      <dialog id="ss4-dlg"></dialog>`;

    // Cases à cocher
    $$('[data-step]').forEach(cb => cb.addEventListener('change', async () => {
      try { await api('etape', { reference: c.reference, cle: cb.dataset.step, fait: cb.checked }); toast(cb.checked ? 'Étape cochée ✓' : 'Étape décochée'); loadDossier(c.reference); }
      catch (e) { cb.checked = !cb.checked; toast('Erreur : ' + e.message); }
    }));
    $$('[data-note]').forEach(inp => inp.addEventListener('change', async () => {
      const cb = $(`[data-step="${inp.dataset.note}"]`);
      try { await api('etape', { reference: c.reference, cle: inp.dataset.note, fait: cb.checked, note: inp.value }); toast('Note enregistrée'); }
      catch (e) { toast('Erreur : ' + e.message); }
    }));
    $('#x-save').addEventListener('click', async () => {
      try {
        await api('maj', { reference: c.reference, statut: $('#x-statut').value, nom_retenu: $('#x-nom').value, ein: $('#x-ein').value, date_creation_llc: $('#x-date').value, notes_internes: $('#x-notes').value });
        toast('Dossier enregistré'); loadDossier(c.reference);
      } catch (e) { toast('Erreur : ' + e.message); }
    });
    $$('[data-file]').forEach(b => b.addEventListener('click', async () => {
      const w = window.open('', '_blank');
      try { const d2 = await api('lien_fichier', { path: b.dataset.file }); if (w) w.location = d2.url; else location.href = d2.url; }
      catch (e) { if (w) w.close(); toast('Erreur : ' + e.message); }
    }));
    $('#x-up').addEventListener('change', async (ev) => {
      const f = ev.target.files[0]; if (!f) return;
      if (f.size > 10 * 1024 * 1024) return toast('Fichier trop lourd (10 Mo max)');
      try {
        const d2 = await api('depot_fichier', { reference: c.reference, nom: f.name });
        const r = await fetch(d2.url, { method: 'PUT', headers: { 'content-type': f.type || 'application/octet-stream', 'x-upsert': 'true' }, body: f });
        if (!r.ok) throw new Error('envoi');
        toast('Document ajouté'); loadDossier(c.reference);
      } catch (e) { toast('Erreur : ' + e.message); }
    });
    const ss4Btn = $('[data-ss4]'); if (ss4Btn) ss4Btn.addEventListener('click', () => openSS4(c));
  }

  // ---------------- Aide SS-4 ----------------
  function openSS4(c) {
    const single = !(c.associes || []).length;
    const name = `${c.nom_retenu || c.nom_societe_1} ${c.suffixe}`;
    const start = c.date_creation_llc ? String(c.date_creation_llc).slice(0, 10) : '(date de création)';
    const rows = [
      ['Ligne 1', name],
      ['Ligne 3', '(laisser vide)'],
      ['Ligne 4a-4b', 'Adresse postale de la LLC (adresse fournie par l’agent enregistré / Northwest)'],
      ['Ligne 5a-5b', 'Adresse de l’agent enregistré au Wyoming, si différente'],
      ['Ligne 6', 'Comté et État : Wyoming (comté de l’adresse de l’agent)'],
      ['Ligne 7a', `${c.prenom} ${c.nom}`],
      ['Ligne 7b', 'Foreign'],
      ['Ligne 8a', 'Yes (LLC)'],
      ['Ligne 8b', String(single ? 1 : c.associes.length)],
      ['Ligne 8c', 'Yes (organisée aux États-Unis)'],
      ['Ligne 9a', single ? 'Other : « Foreign-owned U.S. disregarded entity – Form 5472 filer »' : 'Partnership (plusieurs associés)'],
      ['Ligne 9b', 'Wyoming'],
      ['Ligne 10', `Started new business – ${ACTIV[c.activite] || c.activite}`],
      ['Ligne 11', start],
      ['Ligne 12', 'December'],
      ['Ligne 13', '0 (aucun salarié)'],
      ['Ligne 16', 'Other : ' + (c.activite || '')],
      ['Ligne 17', (c.description_activite || '').slice(0, 120)],
      ['Ligne 18', 'No'],
      ['Signature', `${c.prenom} ${c.nom}, Owner / Member – téléphone et fax de retour à indiquer`],
    ];
    const dlg = $('#ss4-dlg');
    dlg.innerHTML = `<div class="dlg"><h2>SS-4 pré-rempli · ${esc(c.reference)}</h2>
      <p class="hint">Aide à la saisie : à vérifier avec les instructions officielles du formulaire SS-4 avant l’envoi au fax international de l’IRS (+1 304-707-9471).</p>
      <table class="ss4">${rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}<button type="button" class="copy" data-copy="${esc(v)}">Copier</button></td></tr>`).join('')}</table>
      <div class="dlg-foot"><a class="btn btn-line" href="https://www.irs.gov/forms-pubs/about-form-ss-4" target="_blank" rel="noopener">Ouvrir le SS-4 ↗</a><button type="button" class="btn btn-navy" id="ss4-close">Fermer</button></div></div>`;
    dlg.showModal();
    $('#ss4-close').addEventListener('click', () => dlg.close());
    $$('[data-copy]', dlg).forEach(b => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copié ✓'; } catch (e) { b.textContent = 'Sélectionnez le texte'; }
    }));
  }

  // ---------------- Messages et chat ----------------
  async function loadMessages() {
    const d = await api('messages');
    $('#messages-list').innerHTML = d.messages.map(m => `<div class="item${m.traite ? ' done' : ''}">
      <div class="top-line"><span><b>${esc(m.nom)}</b> · <a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.telephone ? ' · ' + esc(m.telephone) : ''} · ${esc(m.sujet || '')}</span><span>${fdate(m.created_at, true)}</span></div>
      <p class="msg-body">${esc(m.message)}</p>
      <label class="check" style="margin-top:8px"><input type="checkbox" data-msg="${esc(m.id)}" ${m.traite ? 'checked' : ''}> Traité</label></div>`).join('') || '<p class="empty">Aucun message.</p>';
    $$('[data-msg]').forEach(cb => cb.addEventListener('change', async () => { await api('message_traite', { id: cb.dataset.msg, traite: cb.checked }); loadMessages(); loadList().catch(() => {}); }));
  }
  async function loadChat() {
    const d = await api('chat');
    $('#chat-list').innerHTML = d.chat.map(m => `<div class="item"><div class="top-line"><span>${{ fr: 'Français', ar: 'Darija', en: 'Anglais' }[m.langue] || ''}</span><span>${fdate(m.created_at, true)}</span></div>
      <p class="msg-body"><b>Q :</b> ${esc(m.question)}</p><p class="msg-body" style="color:#3B4656"><b>Léa :</b> ${esc(m.reponse || '—')}</p></div>`).join('') || '<p class="empty">Aucune question pour le moment.</p>';
  }

  // ---------------- Statistiques ----------------
  let stJours = 7, stTimer = null;
  const nf = (n) => Number(n || 0).toLocaleString('fr-FR');
  const LANGS = { fr: 'Français', ar: 'Darija', en: 'Anglais' };
  const PAGES = { '/': 'Accueil', '/avantages': 'Avantages', '/comment-ca-marche': 'Comment ça marche', '/tarifs': 'Tarifs', '/faq': 'FAQ', '/commander': 'Commander', '/contact': 'Contact',
    '/benefits': 'Avantages', '/how-it-works': 'Comment ça marche', '/pricing': 'Tarifs', '/order': 'Commander' };
  const pageNom = (p) => {
    const m = String(p || '/').replace(/\/$/, '') || '/';
    const l = m.startsWith('/ar') ? 'ar' : m.startsWith('/en') ? 'en' : 'fr';
    const rest = l === 'fr' ? m : (m.slice(3) || '/');
    return (PAGES[rest] || rest) + (l === 'fr' ? '' : ' · ' + LANGS[l]);
  };
  const CODES = {"Maroc": "MA", "France": "FR", "Belgique": "BE", "Suisse": "CH", "Luxembourg": "LU", "Monaco": "MC", "Canada": "CA", "Algérie": "DZ", "Tunisie": "TN", "Sénégal": "SN", "Côte d'Ivoire": "CI", "Cameroun": "CM", "Royaume-Uni": "GB", "Espagne": "ES", "Allemagne": "DE", "Italie": "IT", "Pays-Bas": "NL", "Portugal": "PT", "Émirats arabes unis": "AE", "Arabie saoudite": "SA", "Qatar": "QA", "Turquie": "TR", "États-Unis": "US", "Irlande": "IE", "Autriche": "AT", "Suède": "SE", "Norvège": "NO", "Danemark": "DK", "Finlande": "FI", "Pologne": "PL", "Roumanie": "RO", "Grèce": "GR", "Égypte": "EG", "Mauritanie": "MR", "Mali": "ML", "Gabon": "GA", "RD Congo": "CD", "Congo": "CG", "Bénin": "BJ", "Burkina Faso": "BF", "Togo": "TG", "Madagascar": "MG", "Maurice": "MU", "Guinée": "GN", "Niger": "NE", "Tchad": "TD", "La Réunion": "RE", "Guadeloupe": "GP", "Martinique": "MQ", "Brésil": "BR", "Mexique": "MX", "Inde": "IN", "Chine": "CN", "Japon": "JP", "Singapour": "SG", "Hong Kong": "HK", "Koweït": "KW", "Bahreïn": "BH", "Oman": "OM", "Jordanie": "JO", "Liban": "LB", "Israël": "IL", "Russie": "RU", "Ukraine": "UA", "Australie": "AU", "Hongrie": "HU", "Tchéquie": "CZ"};
  // Drapeaux en image (Windows n'affiche pas les drapeaux emoji)
  const codePays = (nom) => CODES[nom] || (/^[A-Z]{2}$/.test(nom || '') ? nom : '');
  let NOMS_INTL = null;
  try { NOMS_INTL = new Intl.DisplayNames(['fr'], { type: 'region' }); } catch (e) { /* ancien navigateur */ }
  const paysTexte = (n) => {
    if (!n || /^(UTC|Etc|GMT)/i.test(n)) return 'Inconnu';
    if (/^[A-Z]{2}$/.test(n) && NOMS_INTL) { try { return NOMS_INTL.of(n) || n; } catch (e) { return n; } }
    return n;
  };
  const drapeauHTML = (n) => {
    const c = codePays(n);
    return c ? `<img class="flag" src="/admin/flags/${c.toLowerCase()}.svg" alt="" width="22" height="16" loading="lazy">`
      : '<span class="flag flag-x" aria-hidden="true">🌐</span>';
  };
  const paysHTML = (n) => drapeauHTML(n) + esc(paysTexte(n));
  const depuis = (d) => { const s = Math.max(0, Math.round((Date.now() - new Date(d)) / 1000)); return s < 60 ? s + ' s' : Math.round(s / 60) + ' min'; };
  const evol = (a, b) => {
    if (!b) return a ? '<span class="ev up">nouveau</span>' : '';
    const p = Math.round((a - b) / b * 100);
    return `<span class="ev ${p >= 0 ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${Math.abs(p)} %</span>`;
  };
  const tile = (label, val, extra = '') => `<div class="tile"><span class="tl">${esc(label)}</span><b>${val}</b>${extra ? `<span class="tx">${extra}</span>` : ''}</div>`;

  function renderLive(rows) {
    $('#st-live-n').textContent = rows.length;
    $('#st-live-maj').textContent = 'mis à jour à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('#st-live').innerHTML = rows.length ? `<div class="table-wrap"><table class="admin-table live-t"><thead><tr><th>Page en cours</th><th>Pays</th><th>Langue</th><th>Appareil</th><th>Venu de</th><th>Sur le site depuis</th></tr></thead><tbody>${
      rows.map(r => `<tr><td><b>${esc(pageNom(r.page))}</b></td><td>${paysHTML(r.pays)}</td><td>${esc(LANGS[r.langue] || r.langue || '')}</td><td>${esc(r.appareil || '')}</td><td>${esc(r.source || '')}</td><td>${depuis(r.debut)}</td></tr>`).join('')
    }</tbody></table></div>` : '<p class="empty" style="padding:12px 0">Personne en ce moment.</p>';
  }

  function renderChart(serie) {
    const max = Math.max(1, ...serie.map(d => d.visiteurs));
    const W = 760, H = 200, pad = { l: 34, r: 8, t: 12, b: 28 };
    const n = Math.max(serie.length, 1), bw = (W - pad.l - pad.r) / n, barW = Math.max(3, Math.min(28, bw - 2));
    const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    const step = max <= 5 ? 1 : Math.ceil(max / 4);
    let grid = '';
    for (let v = 0; v <= max; v += step) grid += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${pad.l - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v}</text>`;
    const every = Math.ceil(n / 10);
    const lab = (x) => stJours === 1 ? x : new Date(x + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    const bars = serie.map((d, i) => {
      const cx = pad.l + bw * i + bw / 2, h = Math.max(0, H - pad.b - y(d.visiteurs));
      const r = Math.min(4, barW / 2, h);
      const x0 = cx - barW / 2, yb = H - pad.b;
      const path = h > 0 ? `M${x0},${yb}V${yb - h + r}Q${x0},${yb - h} ${x0 + r},${yb - h}H${x0 + barW - r}Q${x0 + barW},${yb - h} ${x0 + barW},${yb - h + r}V${yb}Z` : '';
      return `<g class="bar" tabindex="0" data-tip="${esc(lab(d.x))} : ${d.visiteurs} visiteur${d.visiteurs > 1 ? 's' : ''}, ${d.pages_vues} page${d.pages_vues > 1 ? 's' : ''} vue${d.pages_vues > 1 ? 's' : ''}">
        <rect x="${pad.l + bw * i}" y="${pad.t}" width="${bw}" height="${H - pad.t - pad.b}" fill="transparent"/>${path ? `<path d="${path}"/>` : ''}
        ${i % every === 0 ? `<text x="${cx}" y="${H - 8}" class="ax" text-anchor="middle">${esc(lab(d.x))}</text>` : ''}</g>`;
    }).join('');
    $('#st-chart').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Visiteurs par ${stJours === 1 ? 'heure' : 'jour'}">${grid}<line x1="${pad.l}" x2="${W - pad.r}" y1="${H - pad.b}" y2="${H - pad.b}" class="base"/>${bars}</svg><div class="tip" hidden></div>`;
    $('#st-chart').scrollLeft = 1e5;
    const tip = $('#st-chart .tip');
    $$('#st-chart .bar').forEach(g => {
      const on = () => { tip.textContent = g.dataset.tip; tip.hidden = false; const r = g.getBoundingClientRect(), c = $('#st-chart').getBoundingClientRect(); tip.style.left = Math.min(Math.max(0, r.left - c.left + r.width / 2 - 90), c.width - 180) + 'px'; };
      g.addEventListener('mouseenter', on); g.addEventListener('focus', on);
      g.addEventListener('mouseleave', () => { tip.hidden = true; }); g.addEventListener('blur', () => { tip.hidden = true; });
    });
  }

  function topList(titre, rows, fmt = (k) => k, html = null) {
    const max = Math.max(1, ...rows.map(r => r.visiteurs));
    return `<div class="panel"><h2>${esc(titre)}</h2>${rows.length ? `<ul class="toplist">${rows.map(r => `<li><span class="tk">${html ? html(r.k) : esc(fmt(r.k) || '—')}</span><span class="tv">${nf(r.visiteurs)}</span><span class="tb"><i style="width:${Math.round(r.visiteurs / max * 100)}%"></i></span></li>`).join('')}</ul>` : '<p class="hint">Pas encore de données.</p>'}</div>`;
  }

  async function loadStats() {
    const d = await api('stats', { jours: stJours });
    renderLive(d.en_ligne);
    const t = d.total, p = d.precedent, c = d.conversions;
    const vs = stJours === 1 ? 'vs hier' : `vs ${stJours} j précédents`;
    $('#st-tiles').innerHTML =
      tile('Visiteurs uniques', nf(t.visiteurs), evol(t.visiteurs, p.visiteurs) + ' ' + vs) +
      tile('Visites', nf(t.visites), evol(t.visites, p.visites)) +
      tile('Pages vues', nf(t.pages_vues), evol(t.pages_vues, p.pages_vues)) +
      tile('Pages par visite', t.visites ? (t.pages_vues / t.visites).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : '0') +
      tile('Taux de rebond', d.rebond + ' %', 'visites d’une seule page');
    $('#st-chart-t').textContent = stJours === 1 ? 'Visiteurs par heure (aujourd’hui)' : 'Visiteurs par jour';
    renderChart(d.serie);
    const taux = t.visiteurs ? (c.commandes / t.visiteurs * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %' : '—';
    $('#st-conv').innerHTML =
      tile('Ont ouvert « Commander »', nf(c.visiteurs_commande)) +
      tile('Commandes reçues', nf(c.commandes), 'conversion ' + taux) +
      tile('Commandes payées', nf(c.payees)) +
      tile('Encaissé (Stripe)', (c.encaisse_centimes / 100).toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €', nf(c.paiements) + ' paiement(s)') +
      tile('Messages / questions à Léa', nf(c.messages) + ' / ' + nf(c.questions_lea));
    $('#st-tops').innerHTML =
      topList('Pages les plus vues', d.pages, pageNom) + topList('D’où viennent-ils ?', d.sources) +
      topList('Pays', d.pays, null, paysHTML) + topList('Langue du site', d.langues, k => LANGS[k] || k) +
      topList('Appareils', d.appareils) + topList('Navigateurs', d.navigateurs);
  }
  $$('#st-periode button').forEach(b => b.addEventListener('click', () => {
    stJours = Number(b.dataset.j);
    $$('#st-periode button').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
    loadStats().catch(e => toast('Erreur : ' + e.message));
  }));
  async function refreshLive() {
    if (location.hash !== '#stats' || document.hidden) return;
    try { const d = await api('stats', { jours: stJours }); renderLive(d.en_ligne); } catch (e) { /* prochain essai */ }
  }

  // ---------------- Navigation ----------------
  async function route() {
    const h = location.hash.slice(1) || 'dossiers';
    try {
      if (h.startsWith('d/')) { show('v-dossier'); setNav(''); await loadDossier(h.slice(2)); }
      else if (h === 'messages') { show('v-messages'); setNav('messages'); await loadMessages(); }
      else if (h === 'chat') { show('v-chat'); setNav('chat'); await loadChat(); }
      else if (h === 'stats') { show('v-stats'); setNav('stats'); await loadStats(); clearInterval(stTimer); stTimer = setInterval(refreshLive, 15000); }
      else { show('v-dossiers'); setNav('dossiers'); await loadList(); }
      window.scrollTo(0, 0);
    } catch (e) {
      if (e.code === 401) boot(); else if (e.code === 403) { show('v-denied'); } else toast('Erreur : ' + e.message);
    }
  }
  async function start() {
    try { await api('moi'); } catch (e) { if (e.code === 403) { $('#admin-nav').hidden = true; return show('v-denied'); } return show('v-login'); }
    $('#admin-nav').hidden = false;
    route();
  }
  async function boot() {
    const { data: { session } } = await sb.auth.getSession();
    $('#admin-nav').hidden = true;
    if (!session) return show('v-login');
    start();
  }
  window.addEventListener('hashchange', () => { if (!$('#admin-nav').hidden) route(); });
  boot();
}
