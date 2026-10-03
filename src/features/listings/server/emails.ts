import type { Locale } from "@/i18n/config";

const COPY: Record<Locale, { subject: string; body: (url: string) => string }> = {
  es: {
    subject: "Tu anuncio en Lloguer: enlace para gestionarlo",
    body: (url) =>
      `Hemos recibido tu anuncio y lo revisaremos pronto.\n\nDesde este enlace puedes editarlo, desactivarlo o borrarlo. Es privado: no lo compartas.\n\n${url}\n\nLos anuncios se desactivan solos a los 10 días de su aprobación.`,
  },
  ca: {
    subject: "El teu anunci a Lloguer: enllaç per gestionar-lo",
    body: (url) =>
      `Hem rebut el teu anunci i el revisarem aviat.\n\nDes d'aquest enllaç pots editar-lo, desactivar-lo o esborrar-lo. És privat: no el comparteixes.\n\n${url}\n\nEls anuncis es desactiven sols als 10 dies de l'aprovació.`,
  },
  en: {
    subject: "Your Lloguer listing: link to manage it",
    body: (url) =>
      `We received your listing and will review it soon.\n\nUse this link to edit, deactivate or delete it. It is private, so do not share it.\n\n${url}\n\nListings switch off by themselves 10 days after approval.`,
  },
};

export function editLinkEmail(locale: Locale, url: string) {
  const copy = COPY[locale];
  return { subject: copy.subject, text: copy.body(url) };
}
