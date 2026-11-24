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
