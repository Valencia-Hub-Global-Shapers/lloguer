/**
 * Hand-off from the landing story demo to the publish form. It lives in
 * sessionStorage (this tab only, gone when it closes) and is read once by the
 * form. Nothing is uploaded or submitted until the visitor does it there.
 */
const KEY = "lloguer.publishDraft";

export type PublishDraft = {
  price: number | null;
  description: string;
  /** Visitor's own photos as data URLs (never the sample illustration). */
  photos: string[];
};

/** Saves the draft; drops the photos when they do not fit in storage. */
export function savePublishDraft(draft: PublishDraft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ ...draft, photos: [] }));
    } catch {
      // Storage unavailable (private mode, blocked): the form just starts empty
    }
  }
}

/** Returns the draft once and removes it, or null. */
export function takePublishDraft(): PublishDraft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return raw ? parseDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Accepts only the expected shape, since storage can hold anything. */
export function parseDraft(value: unknown): PublishDraft | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const price = typeof v.price === "number" && Number.isFinite(v.price) ? v.price : null;
  const description = typeof v.description === "string" ? v.description.slice(0, 2000) : "";
  const photos = Array.isArray(v.photos)
    ? v.photos.filter((p): p is string => typeof p === "string" && p.startsWith("data:image/"))
    : [];
  if (price == null && !description.trim() && photos.length === 0) return null;
  return { price, description, photos };
}

/** Description for the form from the story headline and message. */
export function draftDescription(headline: string, note: string): string {
  return [headline.trim(), note.trim()].filter(Boolean).join("\n\n");
}

export async function dataUrlToFile(dataUrl: string, name: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: blob.type });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
