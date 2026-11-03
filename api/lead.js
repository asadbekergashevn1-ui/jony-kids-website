// Jony Kids — lead -> Telegram bot notification.
// Secrets (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) live only in Vercel env vars, never in the client.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method' });
    return;
  }
  try {
    let b = req.body;
    if (!b || typeof b === 'string') { try { b = JSON.parse(b || '{}'); } catch (_) { b = {}; } }

    const name = (b.name || '').toString().slice(0, 200);
    const phone = (b.phone || '').toString().slice(0, 60);
    const course = (b.course || '').toString().slice(0, 120);
    const source = (b.source || '').toString().slice(0, 120);

    // minimal guard: need at least a phone or a name
    if (!phone && !name) { res.status(400).json({ ok: false, error: 'empty' }); return; }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    // TELEGRAM_CHAT_ID may hold several comma-separated chat ids → every one gets the lead
    const chats = (process.env.TELEGRAM_CHAT_ID || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!token || !chats.length) { res.status(200).json({ ok: false, error: 'noconfig' }); return; }

    const esc = (s) => String(s == null || s === '' ? '—' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const now = new Date().toLocaleString('uz-UZ', {
      timeZone: 'Asia/Tashkent', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit'
    });

    const text =
      '🆕 <b>Yangi lid — Jony Kids</b>\n\n' +
      '👤 <b>Ism:</b> ' + esc(name) + '\n' +
      '📞 <b>Telefon:</b> ' + esc(phone) + '\n' +
      '📚 <b>Guruh / kurs:</b> ' + esc(course) + '\n' +
      '🔗 <b>Manba:</b> ' + esc(source) + '\n' +
      '🕒 ' + now;

    const results = await Promise.all(chats.map(function (cid) {
      return fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cid, parse_mode: 'HTML', disable_web_page_preview: true, text })
      }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; });
    }));
    res.status(200).json({ ok: results.some(function (r) { return r && r.ok; }) });
  } catch (e) {
    res.status(200).json({ ok: false, error: 'exception' });
  }
}
