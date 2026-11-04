const crypto = require('crypto');
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).end();
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false });
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const pad = n => String(n).padStart(2, '0');
  const row = {
    data: pad(now.getDate()) + '/' + pad(now.getMonth() + 1) + '/' + String(now.getFullYear()).slice(2),
    hora: pad(now.getHours()) + ':' + pad(now.getMinutes()),
    email: email, origem: b.src || 'direto', conteudo: b.utm_content || b.utm_campaign || '',
    potencial: b.potencial || '', fase: b.fase || 1, status: 'Lead', data_compra: '',
    dispositivo: b.dispositivo || '', ramo: b.ramo || '', lid: b.lid || '', produto: 'Rota do Milhao',
    idioma: b.idioma || 'PT', anuncio: b.utm_content || '', conjunto: b.utm_term || b.utm_medium || '', campanha: b.utm_campaign || '', etapa: b.etapa || '', pagina: b.page || ''
  };
  const jobs = [];
  const post = (url, headers, body) => fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) }).catch(() => null);
  // Planilha "Leads Funis" (aba "Rota do Milhão"): mesmo Apps Script de todos os funis.
  jobs.push(post('https://script.google.com/macros/s/AKfycbwRFK_-JHRYLzef6o1aWHGUoe_MHXUYcrV4sL56eGZvUrYNebQi1Q4lvZ-JjO4ZKdVU/exec', { 'Content-Type': 'text/plain;charset=utf-8' }, { produto: 'Rota do Milhão', idioma: 'PT', email: email, utm_source: b.utm_source || b.src || '', utm_medium: b.utm_medium || b.utm_term || '', utm_campaign: b.utm_campaign || '', utm_content: b.utm_content || '', etapa: b.etapa || 'link direto', pagina: b.page || '/app-gratis' }));
  if (process.env.SHEETS_WEBHOOK_URL) jobs.push(post(process.env.SHEETS_WEBHOOK_URL, { 'Content-Type': 'application/json' }, Object.assign({ type: 'lead' }, row)));
  if (process.env.BREVO_API_KEY) {
    const payload = { email: email, updateEnabled: true, attributes: { ORIGEM: row.origem, POTENCIAL: row.potencial, PRODUTO: 'Rota do Milhao' } };
    if (process.env.BREVO_LIST_ID) payload.listIds = [Number(process.env.BREVO_LIST_ID)];
    jobs.push(post('https://api.brevo.com/v3/contacts', { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }, payload));
  }
  if (process.env.META_CAPI_TOKEN) {
    const h = s => crypto.createHash('sha256').update(s).digest('hex');
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0];
    const ev = { data: [{ event_name: 'Lead', event_time: Math.floor(Date.now() / 1000), event_id: 'lead_' + row.lid, action_source: 'website', event_source_url: b.page || 'https://rotadomilhao.vercel.app/app-gratis', user_data: { em: [h(email)], client_ip_address: ip, client_user_agent: req.headers['user-agent'] } }] };
    jobs.push(post('https://graph.facebook.com/v19.0/845624231314387/events?access_token=' + process.env.META_CAPI_TOKEN, { 'Content-Type': 'application/json' }, ev));
  }
  await Promise.allSettled(jobs);
  res.status(200).json({ ok: true });
};
