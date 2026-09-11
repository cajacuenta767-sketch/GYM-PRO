/** Plantillas de correo en español. Devuelven asunto y HTML sencillo y legible en cualquier cliente. */
const layout = (gym: string, title: string, body: string, cta?: { label: string; url: string }) => `
<!doctype html><html lang="es"><body style="margin:0;background:#F6F5F1;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:#1B1A17">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #E6E4DD">
<tr><td style="background:#14161C;border-radius:16px 16px 0 0;padding:20px 28px;color:#fff;font-weight:700;font-size:18px">${gym}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:22px">${title}</h1>
<div style="font-size:15px;line-height:1.6;color:#3d3b36">${body}</div>
${cta ? `<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:#C3F13D;color:#14161C;font-weight:700;padding:12px 20px;border-radius:12px;text-decoration:none">${cta.label}</a></p>` : ''}
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #E6E4DD;font-size:12px;color:#8a877e">Este mensaje fue enviado por ${gym}. Si no esperabas este correo, puedes ignorarlo.</td></tr>
</table></td></tr></table></body></html>`;

export const templates = {
  welcome: (gym: string, name: string, code: string, portalUrl: string) => ({
    subject: `¡Bienvenido/a a ${gym}, ${name}!`,
    html: layout(gym, `¡Hola, ${name}!`, `<p>Ya eres parte de <b>${gym}</b>. Tu código de miembro es <b>${code}</b>.</p><p>Desde el portal puedes ver tu código QR de acceso, reservar clases y consultar tu plan.</p>`, { label: 'Entrar al portal', url: portalUrl }),
  }),
  expiring: (gym: string, name: string, planName: string, date: string, days: number, portalUrl: string) => ({
    subject: days <= 0 ? `Tu membresía en ${gym} venció` : `Tu membresía vence en ${days} día${days === 1 ? '' : 's'}`,
    html: layout(gym, days <= 0 ? 'Tu membresía ha vencido' : `Tu membresía vence pronto`, `<p>Hola ${name}, tu plan <b>${planName}</b> ${days <= 0 ? 'venció' : 'vence'} el <b>${date}</b>.</p><p>Renueva para seguir entrenando sin interrupciones.</p>`, { label: 'Renovar ahora', url: portalUrl }),
  }),
  birthday: (gym: string, name: string) => ({
    subject: `¡Feliz cumpleaños, ${name}! 🎉`,
    html: layout(gym, `¡Feliz cumpleaños, ${name}!`, `<p>Todo el equipo de <b>${gym}</b> te desea un gran día. Pasa por recepción: tenemos una sorpresa para ti.</p>`),
  }),
  bookingConfirmed: (gym: string, name: string, className: string, when: string, location: string) => ({
    subject: `Reserva confirmada: ${className}`,
    html: layout(gym, 'Reserva confirmada', `<p>Hola ${name}, tu cupo en <b>${className}</b> quedó confirmado para el <b>${when}</b> en ${location}.</p><p>Si no puedes asistir, cancela desde el portal para liberar el cupo.</p>`),
  }),
  waitlistPromoted: (gym: string, name: string, className: string, when: string) => ({
    subject: `¡Se liberó un cupo en ${className}!`,
    html: layout(gym, 'Tu reserva pasó a confirmada', `<p>Hola ${name}, un cupo quedó libre en <b>${className}</b> (${when}) y tu reserva en lista de espera ya está confirmada.</p>`),
  }),
  paymentReceived: (gym: string, name: string, concept: string, amount: string, invoice: string) => ({
    subject: `Pago recibido · ${invoice}`,
    html: layout(gym, 'Gracias por tu pago', `<p>Hola ${name}, registramos tu pago de <b>${amount}</b> por <b>${concept}</b>.</p><p>Número de factura: <b>${invoice}</b>.</p>`),
  }),
  test: (gym: string) => ({
    subject: `Correo de prueba · ${gym}`,
    html: layout(gym, 'La configuración de correo funciona', `<p>Este es un mensaje de prueba enviado desde la configuración de notificaciones de <b>${gym}</b>.</p>`),
  }),
};
