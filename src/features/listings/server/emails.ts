import type { Locale } from "@/i18n/config";

const COPY: Record<Locale, { subject: string; body: (url: string) => string }> = {
  es: {
    subject: "Tu anuncio en Lloguer: enlace para gestionarlo",
    body: (url) =>
      `Hemos recibido tu anuncio y lo revisaremos pronto.\n\nDesde este enlace puedes editarlo, desactivarlo o borrarlo. Es privado: no lo compartas.\n\n${url}\n\nLos anuncios se desactivan solos a los 10 días de su aprobación.`,
  },
  va: {
    subject: "El teu anunci a Lloguer: enllaç per gestionar-lo",
    body: (url) =>
      `Hem rebut el teu anunci i el revisarem aviat.\n\nDes d'aquest enllaç pots editar-lo, desactivar-lo o esborrar-lo. És privat: no el comparteixes.\n\n${url}\n\nEls anuncis es desactiven sols als 10 dies de l'aprovació.`,
  },
  en: {
    subject: "Your Lloguer listing: link to manage it",
    body: (url) =>
      `We received your listing and will review it soon.\n\nUse this link to edit, deactivate or delete it. It is private, so do not share it.\n\n${url}\n\nListings switch off by themselves 10 days after approval.`,
  },
  pt: {
    subject: "O teu anúncio no Lloguer: ligação para o gerir",
    body: (url) =>
      `Recebemos o teu anúncio e vamos revê-lo em breve.\n\nCom esta ligação podes editá-lo, desativá-lo ou eliminá-lo. É privada: não a partilhes.\n\n${url}\n\nOs anúncios desativam-se sozinhos 10 dias depois de serem aprovados.`,
  },
};

export function editLinkEmail(locale: Locale, url: string) {
  const copy = COPY[locale];
  return { subject: copy.subject, text: copy.body(url) };
}

const ADMIN_COPY: Record<
  Locale,
  { subject: string; body: (d: { type: string; price: number; place: string; url: string }) => string }
> = {
  es: {
    subject: "Nuevo anuncio pendiente en Lloguer",
    body: (d) => `${d.type} · ${d.price} €/mes · ${d.place}\n\nRevisa la cola de moderación: ${d.url}`,
  },
  va: {
    subject: "Nou anunci pendent a Lloguer",
    body: (d) => `${d.type} · ${d.price} €/mes · ${d.place}\n\nRevisa la cua de moderació: ${d.url}`,
  },
  en: {
    subject: "New pending listing on Lloguer",
    body: (d) => `${d.type} · ${d.price} €/month · ${d.place}\n\nReview the moderation queue: ${d.url}`,
  },
  pt: {
    subject: "Novo anúncio pendente no Lloguer",
    body: (d) => `${d.type} · ${d.price} €/mês · ${d.place}\n\nRevê a fila de moderação: ${d.url}`,
  },
};

/** Notification for moderators when a new listing enters the queue. */
export function adminNotificationEmail(
  locale: Locale,
  d: { price: number; place: string; isRoom: boolean; moderationUrl: string },
) {
  const type = d.isRoom
    ? ({ es: "Habitación", va: "Habitació", en: "Room", pt: "Quarto" } as const)[locale]
    : ({ es: "Piso completo", va: "Pis complet", en: "Full flat", pt: "Casa inteira" } as const)[
        locale
      ];
  const copy = ADMIN_COPY[locale];
  return {
    subject: copy.subject,
    text: copy.body({ type, price: d.price, place: d.place, url: d.moderationUrl }),
  };
}
