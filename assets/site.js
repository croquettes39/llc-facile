/* LLC Facile — menu mobile, choix de devise, formulaire de commande */
{
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const lang = document.documentElement.lang;

  // Menu mobile
  const burger = $('.burger'), menu = $('#menu');
  if (burger && menu) burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Devise (EUR / MAD), mémorisée pour le visiteur
  let cur = lang === 'ar' ? 'MAD' : 'EUR';
  try { cur = localStorage.getItem('llcf-cur') || cur; } catch (e) { /* stockage indisponible */ }
  const setCur = (c) => {
    cur = c;
    try { localStorage.setItem('llcf-cur', c); } catch (e) { /* rien */ }
    $$('.cur button').forEach(b => b.setAttribute('aria-pressed', b.dataset.cur === c ? 'true' : 'false'));
    $$('.price[data-eur]').forEach(p => { p.textContent = c === 'MAD' ? p.dataset.mad : p.dataset.eur; });
    const dv = $('#order [name=devise]'); if (dv) dv.value = c;
    updateTotal();
  };
  $$('.cur button').forEach(b => b.addEventListener('click', () => setCur(b.dataset.cur)));

  // Formulaire de commande
  const form = $('#order');
  const i18n = (() => { try { return JSON.parse($('#i18n').textContent); } catch (e) { return {}; } })();
  function updateTotal() {
    if (!form) return;
    const f = $('[name=formule]:checked', form);
    if (!f) return;
    const itin = $('[name=option_itin]', form).checked;
    const base = Number(cur === 'MAD' ? f.dataset.mad : f.dataset.eur);
    const add = itin ? (cur === 'MAD' ? 2690 : 249) : 0;
    const n = (base + add).toLocaleString('fr-FR').replace(/ | /g, ' ');
    $('#total').textContent = cur === 'MAD' ? n + ' MAD' : n + ' €';
  }

  if (form) {
    const qp = new URLSearchParams(location.search).get('formule');
    const pre = qp && $(`[name=formule][value="${CSS.escape(qp)}"]`, form);
    if (pre) pre.checked = true;
    $$('[name=formule], [name=option_itin]', form).forEach(el => el.addEventListener('change', updateTotal));

    // Associés
    const box = $('#partners'), rows = $('#partner-rows'), tpl = $('#partner-tpl');
    const addRow = () => {
      const r = tpl.content.firstElementChild.cloneNode(true);
      $('button', r).addEventListener('click', () => { r.remove(); if (!rows.children.length) addRow(); });
      rows.appendChild(r);
    };
    $$('[name=type_associes]', form).forEach(el => el.addEventListener('change', () => {
      const many = $('[name=type_associes]:checked', form).value === 'plusieurs';
      box.hidden = !many;
      if (many && !rows.children.length) { addRow(); addRow(); }
    }));
    $('#add-partner').addEventListener('click', addRow);

    const err = $('#form-err');
    const fail = (msg, el) => {
      err.textContent = msg; err.hidden = false;
      (el || err).focus({ preventScroll: false });
      if (el) el.scrollIntoView({ block: 'center' });
    };

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      err.hidden = true;
      $$('[aria-invalid]', form).forEach(el => el.removeAttribute('aria-invalid'));

      const bad = $$('[required]', form).filter(el => el.type !== 'checkbox' && el.type !== 'radio' && el.type !== 'file' && !el.value.trim());
      bad.forEach(el => el.setAttribute('aria-invalid', 'true'));
      if (bad.length) return fail(i18n.err_req, bad[0]);
      const em = $('[name=email]', form);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { em.setAttribute('aria-invalid', 'true'); return fail(i18n.err_email, em); }
      const file = $('[name=piece_identite]', form);
      const fl = file.files[0];
      if (!fl || fl.size > 10 * 1024 * 1024 || !/^(image\/(jpeg|png|webp|heic)|application\/pdf)$/.test(fl.type)) {
        file.setAttribute('aria-invalid', 'true'); return fail(i18n.err_file, file);
      }
      let associes = [];
      if ($('[name=type_associes]:checked', form).value === 'plusieurs') {
        associes = $$('.partner', rows).map(r => ({ nom: $('[data-k=nom]', r).value.trim(), part: Number($('[data-k=part]', r).value) }))
          .filter(a => a.nom);
        const sum = associes.reduce((s, a) => s + (a.part || 0), 0);
        if (associes.length < 2 || sum !== 100) return fail(i18n.err_share, $('[data-k=nom]', rows));
      }
      $('[name=associes]', form).value = JSON.stringify(associes);
      const cgv = $('[name=accepte_cgv]', form);
      if (!cgv.checked) return fail(i18n.err_cgv, cgv);

      const btn = $('#submit'), label = btn.innerHTML;
      btn.disabled = true; btn.textContent = i18n.sending;
      try {
        const res = await fetch(form.dataset.endpoint, { method: 'POST', body: new FormData(form) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          if (data.error === 'champs' && data.champs) {
            const el = $(`[name="${data.champs[0]}"]`, form);
            if (el) el.setAttribute('aria-invalid', 'true');
            return fail(i18n.err_req, el);
          }
          return fail(i18n.err_net);
        }
        const done = $('#done');
        $('#done-ref').textContent = data.reference;
        const wa = lang === 'ar' || $('[name=telephone]', form).value.trim().startsWith('+212') ? '212663285119' : '33780803130';
        $('#done-wa').href = `https://wa.me/${wa}?text=${encodeURIComponent(i18n.wa_ref + ' ' + data.reference)}`;
        if (data.paiement) { const p = $('#done-pay'); p.href = data.paiement; p.hidden = false; }
        if (data.paiement_itin) { const p2 = $('#done-pay-itin'); p2.href = data.paiement_itin; p2.hidden = false; $('#done-itin-text').hidden = false; }
        else { $('#done-pay-text').hidden = true; $('#done-nopay').hidden = false; }
        form.hidden = true; done.hidden = false; done.focus();
        done.scrollIntoView({ block: 'start' });
      } catch (e) {
        fail(i18n.err_net);
      } finally {
        btn.disabled = false; btn.innerHTML = label;
      }
    });
  }

  setCur(cur);
}

/* WhatsApp flottant, formulaire de contact, assistante Léa (texte + voix) */
{
  const $ = (s, r = document) => r.querySelector(s);
  const cfg = (() => { try { return JSON.parse($('#chat-i18n').textContent); } catch (e) { return null; } })();
  if (cfg) {
    const waBtn = $('.fab-wa'), waMenu = $('#wa-menu');
    waBtn.addEventListener('click', () => {
      const open = waMenu.hidden; waMenu.hidden = !open; waBtn.setAttribute('aria-expanded', String(open));
    });

    // Formulaire « Nous contacter »
    const cf = $('#contact-form');
    if (cf) cf.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const err = $('#contact-err'); err.hidden = true;
      const data = Object.fromEntries(new FormData(cf));
      if (!data.nom.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || !data.message.trim()) { err.hidden = false; err.focus(); return; }
      const btn = $('button[type=submit]', cf); btn.disabled = true;
      try {
        const r = await fetch(cf.dataset.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ type: 'message', lang: cf.dataset.lang, ...data }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.ok) throw new Error();
        cf.hidden = true; const ok = $('#contact-ok'); ok.hidden = false; ok.focus();
      } catch (e) { err.hidden = false; } finally { btn.disabled = false; }
    });

    // Assistante
    const chat = $('#chat'), log = $('#chat-log'), form = $('#chat-form'), input = $('#chat-input');
    const botBtn = $('.fab-bot'), voiceBtn = $('#chat-voice'), mic = $('#chat-mic'), chips = $('#chat-chips');
    const history = [];
    let session = '';
    try { session = sessionStorage.getItem('llcf-chat') || ''; } catch (e) { /* rien */ }
    if (!session) { session = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); try { sessionStorage.setItem('llcf-chat', session); } catch (e) { /* rien */ } }
    let voiceOn = true;
    try { voiceOn = localStorage.getItem('llcf-voice') !== 'off'; } catch (e) { /* rien */ }

    const linkify = (t) => {
      const div = document.createElement('div'); div.textContent = t;
      div.innerHTML = div.innerHTML
        .replace(/(https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
        .replace(/(?<![\/.])\b(llcfacile\.com(\/[a-z\-\/]*)?)/gi, (m) => `<a href="https://${m}">${m}</a>`)
        .replace(/(\+212 ?6 ?63 ?28 ?51 ?19)/g, `<a href="https://wa.me/${cfg.wa_ma}" target="_blank" rel="noopener">$1</a>`)
        .replace(/(\+33 ?7 ?80 ?80 ?31 ?30)/g, `<a href="https://wa.me/${cfg.wa_fr}" target="_blank" rel="noopener">$1</a>`);
      return div.innerHTML;
    };
    const add = (who, text, cls = '') => {
      const m = document.createElement('div'); m.className = `msg ${who} ${cls}`.trim();
      if (who === 'bot') m.innerHTML = linkify(text); else m.textContent = text;
      log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
    };

    // Voix féminine
    const synth = window.speechSynthesis;
    const FEM = /(am[eé]lie|audrey|aur[eé]lie|marie|julie|denise|hortense|virginie|c[eé]line|l[eé]a|charlotte|google fran[cç]ais|female|femme|samantha|karen|serena|sonia|libby|zira|aria|jenny|hoda|salma|laila|mariam|zariyah|fatima|amira)/i;
    const MALE = /(thomas|paul|henri|nicolas|daniel|claude|mathieu|male|homme|guy|ryan|george|naayf|hamed|tarik|jamal)/i;
    let voice = null;
    const pickVoice = () => {
      if (!synth) return;
      const want = cfg.speech.toLowerCase(), base = want.slice(0, 2);
      const vs = synth.getVoices().filter(v => v.lang && v.lang.toLowerCase().startsWith(base));
      voice = vs.find(v => v.lang.toLowerCase() === want && FEM.test(v.name))
        || vs.find(v => FEM.test(v.name)) || vs.find(v => !MALE.test(v.name)) || vs[0] || null;
    };
    if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
    const speak = (text) => {
      if (!synth || !voiceOn) return;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/https?:\/\/\S+/g, ''));
      u.lang = voice ? voice.lang : cfg.speech; if (voice) u.voice = voice;
      u.rate = 1; u.pitch = 1.1;
      synth.speak(u);
    };
    const setVoice = (on) => {
      voiceOn = on; voiceBtn.setAttribute('aria-pressed', String(on));
      voiceBtn.setAttribute('aria-label', on ? cfg.voice_off : cfg.voice_on);
      try { localStorage.setItem('llcf-voice', on ? 'on' : 'off'); } catch (e) { /* rien */ }
      if (!on && synth) synth.cancel();
    };
    if (!synth) voiceBtn.hidden = true; else setVoice(voiceOn);
    voiceBtn.addEventListener('click', () => setVoice(!voiceOn));

    const openChat = () => {
      chat.hidden = false; botBtn.setAttribute('aria-expanded', 'true');
      if (!log.children.length) { add('bot', cfg.hello); history.push({ role: 'assistant', content: cfg.hello }); }
      input.focus();
    };
    const closeChat = () => { chat.hidden = true; botBtn.setAttribute('aria-expanded', 'false'); if (synth) synth.cancel(); botBtn.focus(); };
    botBtn.addEventListener('click', () => (chat.hidden ? openChat() : closeChat()));
    $('#chat-close').addEventListener('click', closeChat);
    document.querySelectorAll('.open-chat').forEach(b => b.addEventListener('click', openChat));
    chat.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeChat(); });

    let busy = false;
    const ask = async (q) => {
      q = q.trim(); if (!q || busy) return;
      busy = true; chips.hidden = true; input.value = '';
      add('me', q); history.push({ role: 'user', content: q });
      const wait = add('bot', cfg.thinking, 'wait');
      let reply = cfg.fallback;
      try {
        const r = await fetch(cfg.endpoint, { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ type: 'chat', lang: cfg.lang, session, messages: history.slice(-12) }) });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.ok && d.reply) reply = d.reply;
      } catch (e) { /* message de repli */ }
      wait.remove();
      add('bot', reply); history.push({ role: 'assistant', content: reply });
      speak(reply);
      busy = false; input.focus();
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
    chips.querySelectorAll('.chip-q').forEach(b => b.addEventListener('click', () => ask(b.textContent)));

    // Micro (dictée vocale) si le navigateur le permet
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      mic.hidden = false;
      let rec = null;
      mic.addEventListener('click', () => {
        if (rec) { rec.stop(); return; }
        if (synth) synth.cancel();
        rec = new SR(); rec.lang = cfg.speech; rec.interimResults = true; rec.maxAlternatives = 1;
        mic.classList.add('on'); input.placeholder = cfg.listening;
        let final = '';
        rec.onresult = (ev) => {
          let txt = '';
          for (const r of ev.results) { txt += r[0].transcript; if (r.isFinal) final = txt; }
          input.value = txt;
        };
        rec.onend = () => { mic.classList.remove('on'); input.placeholder = cfg.placeholder; rec = null; if (final) ask(final); };
        rec.onerror = () => { mic.classList.remove('on'); input.placeholder = cfg.placeholder; rec = null; };
        rec.start();
      });
    }
  }
}
