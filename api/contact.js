module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  var b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  if (b.web) return res.status(200).json({ ok: true });
  var nombre = String(b.nombre || '').trim().slice(0, 80);
  var email = String(b.email || '').trim().slice(0, 120);
  var mensaje = String(b.mensaje || '').trim().slice(0, 1000);
  if (!nombre || !mensaje || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }
  console.log('CONTACT_MESSAGE', JSON.stringify({ nombre: nombre, email: email, mensaje: mensaje, fecha: new Date().toISOString() }));
  if (process.env.RESEND_API_KEY && process.env.CONTACT_TO) {
    try {
      var r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM || 'onboarding@resend.dev',
          to: [process.env.CONTACT_TO],
          reply_to: email,
          subject: 'Nuevo mensaje web de ' + nombre,
          text: 'De: ' + nombre + ' <' + email + '>\n\n' + mensaje
        })
      });
      if (!r.ok) return res.status(502).json({ ok: false, error: 'mail' });
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'mail' });
    }
  }
  return res.status(200).json({ ok: true });
};
