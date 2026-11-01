// Verifica se o e-mail comprou (lista mantida pelo webhook da Cakto no Apps Script / planilha)
module.exports = async (req, res) => {
  const email = String((req.query && req.query.email) || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ member: false });
  try {
    if (process.env.SHEETS_WEBHOOK_URL) {
      const r = await fetch(`${process.env.SHEETS_WEBHOOK_URL}?type=me&email=${encodeURIComponent(email)}`);
      const j = await r.json();
      return res.status(200).json({ member: !!j.member, products: j.products || [] });
    }
  } catch (e) {}
  res.status(200).json({ member: false, products: [] });
};
