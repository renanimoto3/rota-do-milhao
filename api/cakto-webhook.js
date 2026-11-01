// Webhook da Cakto: compra aprovada / reembolso / assinatura. Repassa para a planilha (Apps Script) que marca Comprou e libera o acesso.
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  if (process.env.CAKTO_WEBHOOK_SECRET && b.secret !== process.env.CAKTO_WEBHOOK_SECRET && req.headers['x-cakto-secret'] !== process.env.CAKTO_WEBHOOK_SECRET) return res.status(401).end();
  const d = b.data || b;
  const email = String((d.customer && d.customer.email) || d.email || '').trim().toLowerCase();
  const event = b.event || d.status || '';
  const offer = (d.offer && (d.offer.name || d.offer.id)) || (d.product && d.product.name) || '';
  const amount = d.amount || d.price || '';
  if (process.env.SHEETS_WEBHOOK_URL && email) {
    await fetch(process.env.SHEETS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'purchase', email, event, offer, amount, raw: JSON.stringify(b).slice(0, 2000) }) }).catch(() => {});
  }
  res.status(200).json({ ok: true });
};
