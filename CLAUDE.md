# LLC Facile – llcfacile.com

Site statique (HTML pur) qui vend l'accompagnement à la création de LLC au Wyoming pour les francophones (Maroc, France, Europe).
Déployé par Vercel à chaque push sur `main`. Pour toute modification, suivre le skill `modifications-llcfacile`.

## Pages générées (3 langues)
- Les pages Accueil, Avantages, Comment ça marche, Tarifs, FAQ et Commander existent en français (racine), darija (`/ar/`, RTL) et anglais (`/en/`).
- **Ne pas les modifier à la main** : changer le texte dans `tools/content_fr.py`, `tools/content_ar.py`, `tools/content_en.py` (toujours les trois), la structure dans `tools/build.py`, puis lancer `python3 tools/build.py` (régénère aussi `sitemap.xml`).
- Prix : constantes `PRICES`, `ITIN`, `RENEW` dans `tools/build.py` ET dans `supabase/functions/llcfacile-commande/index.ts` (le serveur recalcule le montant).
- Styles et scripts partagés : `assets/site.css`, `assets/site.js`. Après un changement, monter `?v=N` dans `tools/build.py`.

## Pages écrites à la main (français uniquement)
- `cgv.html`, `mentions-legales.html`, `confidentialite.html`. Les zones `<span class="ph">[…]</span>` attendent des infos d'Angélica : ne jamais les inventer.

## Formulaire de commande
- Envoie vers la fonction Supabase `llcfacile-commande` (projet `gbdjiczesmhhsrqhvrgj`, schéma `llcfacile`, table `commandes`, bucket privé `llcfacile-documents`). Ne jamais toucher au schéma `public` ni à `sovereignlife`.
- Paiement : la fonction renvoie un lien Stripe Payment Link lu dans ses secrets `STRIPE_LINK_BASIC`, `STRIPE_LINK_ULTIMATE`, `STRIPE_LINK_ULTIMATE_LAUNCH` (et variantes `_ITIN`). Sans secret, le client est invité à attendre le lien sur WhatsApp.

## Règles
- Ne jamais promettre : 0 impôt / optimisation fiscale, Shopify Payments inclus, ouverture de compte ou ITIN garantis.
