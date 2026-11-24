# LLC Facile – llcfacile.com

Site statique (HTML pur) qui vend l'accompagnement à la création de LLC au Wyoming pour les francophones (Maroc, France, Europe).
Déployé par Vercel à chaque push sur `main`. Pour toute modification, suivre le skill `modifications-llcfacile`.

## Pages générées (3 langues)
- Les pages Accueil, Avantages, Comment ça marche, Tarifs, FAQ et Commander existent en français (racine), darija (`/ar/`, RTL) et anglais (`/en/`).
- **Ne pas les modifier à la main** : changer le texte dans `tools/content_fr.py`, `tools/content_ar.py`, `tools/content_en.py` (toujours les trois), la structure dans `tools/build.py`, puis lancer `python3 tools/build.py` (régénère aussi `sitemap.xml`).
- Prix (EUR, MAD, CHF — MAD et CHF = conversions arrondies, indicatives ; Stripe encaisse en euros) : constantes `PRICES`, `ITIN`, `RENEW` dans `tools/build.py` ET dans `supabase/functions/llcfacile-commande/index.ts` (le serveur recalcule le montant).
- Styles et scripts partagés : `assets/site.css`, `assets/site.js`. Après un changement, monter `?v=N` dans `tools/build.py`.

## Pages écrites à la main (français uniquement)
- `cgv.html`, `mentions-legales.html`, `confidentialite.html`. Les zones `<span class="ph">[…]</span>` attendent des infos d'Angélica : ne jamais les inventer.

## Formulaire de commande
- Envoie vers la fonction Supabase `llcfacile-commande` (projet `gbdjiczesmhhsrqhvrgj`, schéma `llcfacile`, table `commandes`, bucket privé `llcfacile-documents`). Ne jamais toucher au schéma `public` ni à `sovereignlife`.
- Paiement : la fonction renvoie un lien Stripe Payment Link lu dans ses secrets `STRIPE_LINK_BASIC`, `STRIPE_LINK_ULTIMATE`, `STRIPE_LINK_ULTIMATE_LAUNCH` ; l'option ITIN a son propre lien `STRIPE_LINK_ITIN` (second bouton de paiement). Les liens sont aussi écrits dans la constante `LINKS` de la fonction. Sans lien, le client est invité à attendre le lien sur WhatsApp.
- Maintenance annuelle (290 €, paiement ponctuel, pas d'abonnement) : https://buy.stripe.com/4gMeVf3sh2Ys4HWePM5J60t — envoyé chaque année par Angélica, hors formulaire ; aussi cité par Léa.

## Confirmation de paiement
- Fonction Supabase `llcfacile-stripe` = webhook Stripe (`checkout.session.completed`) : ne traite que les paiements dont `client_reference_id` commence par `LLC-` (le compte Stripe est partagé avec d'autres activités). Marque la commande `payee` (ou `itin_paye_le`), journalise dans `llcfacile.paiements`, envoie au client l'e-mail de confirmation (fr/ar/en) avec le guide PDF `documents/guide-client-llc-facile.pdf`, et prévient `NOTIFY_EMAIL` (défaut contact@llcfacile.com).
- Secrets : `STRIPE_WEBHOOK_SECRET`, `SMTP_PASS` (boîte contact@llcfacile.com chez LWS ; `SMTP_HOST` défaut mail.llcfacile.com, port 465).
- Le guide client se régénère depuis `tools/guide/` (guide.html + make_pdf.py, Playwright ; adapter les chemins) : en cas de changement de formule ou de délai, le mettre à jour aussi.

## Panel admin (llcfacile.com/admin)
- `admin/index.html`, `admin/admin.js`, `admin/admin.css` (page non indexée). Connexion Supabase Auth (projet partagé avec Sundarly) ; accès réservé aux e-mails de `llcfacile.admins` (contact@llcfacile.com).
- Fonction `llcfacile-admin` (verify_jwt) : liste, dossier, étapes cochées (`llcfacile.etapes`), suivi (statut, nom retenu, EIN, date de création, notes), liens signés vers les fichiers, dépôt de livrables (`<ref>/livrables/`), messages, questions à Léa.
- Les démarches par formule (`STEPS`) et les messages WhatsApp pré-écrits (`WA`, fr + darija) sont dans `admin/admin.js`.

## Statistiques (llcfacile.com/admin#stats)
- Mesure d'audience maison, anonyme : `assets/site.js` (fin du fichier) envoie page vue / présence toutes les 25 s / départ (sendBeacon) vers la fonction `llcfacile-stats` -> tables `llcfacile.visites` et `llcfacile.presence`. Pays déduit du fuseau horaire, pas d'IP stockée. Actif seulement sur llcfacile.com et *.vercel.app.
- Action `stats` de `llcfacile-admin` (période 1/7/30/90 j, heure du Maroc) ; vue « Statistiques » dans `admin/admin.js` (en ligne maintenant rafraîchi toutes les 15 s).
- Politique de confidentialité mise à jour en conséquence (conservation 13 mois max).

## Contact et assistante
- Page Contact (3 langues) + boutons flottants WhatsApp et « Léa » sur toutes les pages (`chat_widget` dans `tools/build.py`, logique dans `assets/site.js`).
- Léa répond **sans IA externe** (choix d'Angélica) : base de réponses fr / darija / en dans `assets/lea.js` (sujets + mots-clés). **À mettre à jour avec les prix, délais ou formules.** Question hors base -> renvoi vers WhatsApp Maroc.
- Fonction Supabase `llcfacile-contact` : `type: "message"` -> table `llcfacile.messages` ; `type: "chat_log"` -> journal des questions/réponses de Léa dans `llcfacile.chat` (visible dans l'admin). L'ancien `type: "chat"` (Claude, secret `ANTHROPIC_API_KEY`) existe encore mais n'est plus appelé par le site.
- Voix : synthèse vocale du navigateur, voix féminine choisie automatiquement ; dictée par micro si le navigateur le permet.

## Règles
- Ne jamais promettre : 0 impôt / optimisation fiscale, Shopify Payments inclus, ouverture de compte ou ITIN garantis.
