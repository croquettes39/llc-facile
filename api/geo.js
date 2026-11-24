// Renvoie seulement le code pays du visiteur (fourni par Vercel), pour la mesure d'audience anonyme.
export function GET(request) {
  const c = (request.headers.get('x-vercel-ip-country') || '').slice(0, 2).toUpperCase();
  return new Response(JSON.stringify({ c }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}
