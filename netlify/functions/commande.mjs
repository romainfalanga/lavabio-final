// Fonction serverless Netlify : reçoit une commande du site et envoie
// un email au pressing via Resend. Déclenchée par un POST du formulaire.

const escapeHtml = (str) =>
  String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get('diag') === '1') {
    return json({
      hasResendKey: !!process.env.RESEND_API_KEY,
      orderEmail: process.env.ORDER_EMAIL || null,
      hasOrderFrom: !!process.env.ORDER_FROM,
    }, 200);
  }

  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Honeypot anti-spam : un bot remplit ce champ caché.
  if (data.website) {
    return json({ ok: true }, 200);
  }

  const nom = (data.nom || '').trim();
  const telephone = (data.telephone || '').trim();
  const emailClient = (data.email || '').trim();
  const adresse = (data.adresse || '').trim();
  const creneau = (data.creneau || '').trim();
  const notes = (data.notes || '').trim();
  const articles = Array.isArray(data.articles) ? data.articles : [];
  const subtotal = (data.subtotal || '').trim();
  const delivery = (data.delivery || '').trim();
  const total = (data.total || '').trim();

  if (!nom || !telephone || !adresse || articles.length === 0) {
    return json({ error: 'missing_fields' }, 400);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return json({ error: 'server_not_configured' }, 500);
  }

  const to = process.env.ORDER_EMAIL || 'romainfalanga83@gmail.com';
  const from = process.env.ORDER_FROM || 'Commandes Lavabio <onboarding@resend.dev>';

  // Corps texte
  const articlesTextLines = articles.map(
    (a) => `- ${a.name} x${a.qty} : ${a.lineTotal}`
  );
  const text = [
    'Nouvelle commande de livraison via le site Lavabio.',
    '',
    'ARTICLES :',
    ...articlesTextLines,
    '',
    `Sous-total : ${subtotal}`,
    `Livraison : ${delivery}`,
    `TOTAL À PAYER : ${total}`,
    '(Paiement à la livraison, en carte ou en espèces)',
    '',
    `Créneau choisi : ${creneau}`,
    '',
    'CLIENT :',
    `- Nom : ${nom}`,
    `- Téléphone : ${telephone}`,
    emailClient ? `- Email : ${emailClient}` : '- Email : (non renseigné)',
    `- Adresse de collecte et livraison : ${adresse}`,
    notes ? `\nInformations complémentaires :\n${notes}` : '',
  ].join('\n');

  // Corps HTML
  const rows = articles
    .map(
      (a) =>
        `<tr><td style="padding:4px 8px;border-bottom:1px solid #eee;">${escapeHtml(a.name)}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center;">×${escapeHtml(a.qty)}</td>` +
        `<td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right;">${escapeHtml(a.lineTotal)}</td></tr>`
    )
    .join('');
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:auto;color:#1E4620;">
    <h2 style="color:#1E7038;">Nouvelle commande de livraison</h2>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <thead><tr>
        <th style="text-align:left;padding:4px 8px;border-bottom:2px solid #2D9B4F;">Article</th>
        <th style="text-align:center;padding:4px 8px;border-bottom:2px solid #2D9B4F;">Qté</th>
        <th style="text-align:right;padding:4px 8px;border-bottom:2px solid #2D9B4F;">Montant</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:2px 0;">Sous-total : <strong>${escapeHtml(subtotal)}</strong></p>
    <p style="margin:2px 0;">Livraison : <strong>${escapeHtml(delivery)}</strong></p>
    <p style="margin:8px 0;font-size:18px;">Total à payer : <strong style="color:#2D9B4F;">${escapeHtml(total)}</strong><br>
      <span style="font-size:13px;color:#4A7C4E;">(Paiement à la livraison, en carte ou en espèces)</span></p>
    <p style="margin:12px 0;padding:10px;background:#F1F8F4;border-radius:8px;">
      <strong>Créneau choisi :</strong> ${escapeHtml(creneau)}</p>
    <h3 style="color:#1E7038;margin-bottom:4px;">Client</h3>
    <p style="margin:2px 0;">Nom : <strong>${escapeHtml(nom)}</strong></p>
    <p style="margin:2px 0;">Téléphone : <strong>${escapeHtml(telephone)}</strong></p>
    <p style="margin:2px 0;">Email : ${escapeHtml(emailClient || '(non renseigné)')}</p>
    <p style="margin:2px 0;">Adresse : ${escapeHtml(adresse)}</p>
    ${notes ? `<p style="margin:10px 0;"><strong>Informations complémentaires :</strong><br>${escapeHtml(notes)}</p>` : ''}
  </div>`;

  const payload = {
    from,
    to: [to],
    subject: `Commande livraison — ${nom} (${total})`,
    text,
    html,
  };
  if (emailClient) payload.reply_to = emailClient;

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return json({ error: 'send_failed', detail }, 502);
    }
    return json({ ok: true }, 200);
  } catch (err) {
    return json({ error: 'send_exception', detail: String(err) }, 502);
  }
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
