"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Download, Link2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/i18n/client";
import { cn, formatDate } from "@/lib/utils";
import type { PublicListing } from "@/lib/types/database.types";
import { photoUrl } from "@/features/listings/photos";
import {
  MAX_HEADLINE_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_STORY_PHOTOS,
  STORY_HEIGHT,
  STORY_LAYOUTS,
  STORY_THEMES,
  STORY_WIDTH,
  buildFacts,
  defaultStoryOptions,
  photosForLayout,
  placeLabel,
  togglePhoto,
  typeLabel,
  type StoryLayout,
  type StoryOptions,
  type StoryTheme,
} from "../options";
import { STORY_FONTS, drawStory, type StoryContent, type StoryImage } from "../render";

const LAYOUT_KEYS: Record<StoryLayout, string> = {
  card: "story.layoutCard",
  cover: "story.layoutCover",
  text: "story.layoutText",
};

/** Loads a public listing photo for canvas use; null when it cannot be read. */
function loadPhoto(path: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    // Without CORS the canvas would be tainted and could not be exported
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = photoUrl(path);
  });
}

/**
 * Story generator: a vertical image of a public listing to share in Instagram
 * stories or WhatsApp status. Everything is drawn in the browser on a canvas;
 * the preview is the exported image itself.
 */
export function StoryDialog({
  listing,
  open,
  onOpenChange,
}: {
  listing: PublicListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { locale, t, plural } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<File | null>(null);
  const requestedRef = useRef(new Set<string>());
  const [options, setOptions] = useState<StoryOptions>(() => defaultStoryOptions(listing, t));
  const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({});
  const [fontsReady, setFontsReady] = useState(false);
  const [fileReady, setFileReady] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [origin, setOrigin] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const facts = useMemo(
    () => buildFacts(listing, t, plural, (date) => formatDate(date, locale), today),
    [listing, t, plural, locale, today],
  );
  const listingUrl = `${origin}/${locale}/listing/${listing.id}`;

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const probe = new File([""], "probe.png", { type: "image/png" });
      setCanShareFiles(Boolean(navigator.canShare?.({ files: [probe] })));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  useEffect(() => {
    if (!open || fontsReady) return;
    Promise.all(STORY_FONTS.map((font) => document.fonts.load(font)))
      .catch(() => undefined)
      .finally(() => setFontsReady(true));
  }, [open, fontsReady]);

  useEffect(() => {
    if (!open) return;
    for (const path of listing.photos) {
      if (requestedRef.current.has(path)) continue;
      requestedRef.current.add(path);
      void loadPhoto(path).then((image) => setImages((prev) => ({ ...prev, [path]: image })));
    }
  }, [open, listing.photos]);

  const content = useMemo<StoryContent>(() => {
    const contacts: StoryContent["contacts"] = [];
    if (options.showWhatsapp && listing.contact_whatsapp) {
      contacts.push({ label: "WhatsApp", value: listing.contact_whatsapp });
    }
    if (options.showEmail && listing.contact_email) {
      contacts.push({ label: t("story.emailLabel"), value: listing.contact_email });
    }
    return {
      eyebrow: options.showType ? typeLabel(listing, t) : null,
      headline: options.headline,
      note: options.note,
      price: options.showPrice ? String(listing.price) : null,
      perMonth: t("listing.perMonth"),
      place: options.showLocation ? placeLabel(listing) : null,
      facts: facts.filter((fact) => options.facts.includes(fact.id)).map((fact) => fact.label),
      description: options.showDescription ? listing.description : null,
      contacts,
      reviewedOn: t("story.reviewedOn"),
      host: origin ? new URL(origin).host : "",
    };
  }, [options, listing, facts, t, origin]);

  const drawnPhotos = photosForLayout(options);
  const photosLoaded = drawnPhotos.every((path) => path in images);

  // Redraw on every change; the canvas is both the preview and the export
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!open || !canvas || !ctx || !fontsReady || !photosLoaded) return;
    const drawn: StoryImage[] = drawnPhotos.map((path) => images[path] ?? null);
    drawStory(ctx, content, options.layout, options.theme, drawn);

    // Encode ahead of time: share() must run straight from the click to keep
    // the user gesture, so there is no time to encode then
    setFileReady(false);
    fileRef.current = null;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      try {
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          fileRef.current = new File([blob], `lloguer-${listing.id.slice(0, 8)}.png`, {
            type: "image/png",
          });
          setFileReady(true);
        }, "image/png");
      } catch (error) {
        console.error("story export failed:", error);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // drawnPhotos is derived from options, which is already a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fontsReady, photosLoaded, images, content, options, listing.id]);

  const update = (patch: Partial<StoryOptions>) => setOptions((prev) => ({ ...prev, ...patch }));

  const download = () => {
    const file = fileRef.current;
    if (!file) return;
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = () => {
    const file = fileRef.current;
    if (!file) return;
    navigator.share({ files: [file] }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      download();
    });
  };

  const copyLink = () => {
    navigator.clipboard
      .writeText(listingUrl)
      .then(() => toast.success(t("story.linkCopied")))
      .catch(() => toast.error(t("story.copyFailed")));
  };

  const hasPhotos = listing.photos.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[94dvh] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="font-display text-2xl font-normal">
            {t("story.title")}
          </DialogTitle>
          <DialogDescription>{t("story.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* Preview */}
          <div className="bg-muted flex shrink-0 items-center justify-center border-b p-3 md:border-r md:border-b-0 md:p-5">
            <canvas
              ref={canvasRef}
              width={STORY_WIDTH}
              height={STORY_HEIGHT}
              role="img"
              aria-label={t("story.previewLabel")}
              className={cn(
                "bg-background h-[34dvh] w-auto rounded-sm border md:h-[66dvh]",
                !fontsReady && "opacity-0",
              )}
            />
          </div>

          {/* Controls */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
            <Section title={t("story.layout")}>
              <ToggleGroup
                type="single"
                value={options.layout}
                onValueChange={(value) => value && update({ layout: value as StoryLayout })}
                className="flex-wrap"
              >
                {STORY_LAYOUTS.map((layout) => (
                  <ToggleGroupItem
                    key={layout}
                    value={layout}
                    disabled={layout !== "text" && !hasPhotos}
                  >
                    {t(LAYOUT_KEYS[layout])}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Section>

            <Section title={t("story.background")}>
              <div className="flex flex-wrap gap-2">
                {STORY_THEMES.map((theme) => (
                  <ThemeSwatch
                    key={theme.id}
                    theme={theme}
                    label={t(`story.theme.${theme.id}`)}
                    selected={options.theme === theme.id}
                    onSelect={() => update({ theme: theme.id })}
                  />
                ))}
              </div>
            </Section>

            {hasPhotos && options.layout !== "text" ? (
              <Section
                title={t("story.photos")}
                hint={t("story.photosHint", { max: MAX_STORY_PHOTOS })}
              >
                <div className="flex flex-wrap gap-2">
                  {listing.photos.map((path, i) => {
                    const order = options.photos.indexOf(path);
                    return (
                      <button
                        key={path}
                        type="button"
                        aria-pressed={order >= 0}
                        aria-label={t("story.photoLabel", { n: i + 1 })}
                        onClick={() => update({ photos: togglePhoto(options.photos, path) })}
                        className={cn(
                          "relative size-16 cursor-pointer overflow-hidden rounded-md border-2 transition-colors",
                          order >= 0 ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl(path)} alt="" className="size-full object-cover" />
                        {order >= 0 ? (
                          <span className="bg-primary text-primary-foreground absolute top-1 right-1 flex size-5 items-center justify-center rounded-full text-[11px] font-bold">
                            {order + 1}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </Section>
            ) : null}

            <Section title={t("story.text")}>
              <div className="grid gap-1.5">
                <Label htmlFor="story-headline">{t("story.headline")}</Label>
                <Input
                  id="story-headline"
                  value={options.headline}
                  maxLength={MAX_HEADLINE_LENGTH}
                  onChange={(e) => update({ headline: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="story-note">{t("story.note")}</Label>
                <Textarea
                  id="story-note"
                  value={options.note}
                  maxLength={MAX_NOTE_LENGTH}
                  rows={2}
                  className="min-h-0"
                  placeholder={t("story.notePlaceholder")}
                  onChange={(e) => update({ note: e.target.value })}
                />
                <p className="text-muted-foreground text-right text-xs">
                  {options.note.length}/{MAX_NOTE_LENGTH}
                </p>
              </div>
            </Section>

            <Section title={t("story.show")}>
              <Toggle
                id="story-type"
                label={t("story.showType")}
                checked={options.showType}
                onChange={(showType) => update({ showType })}
              />
              <Toggle
                id="story-price"
                label={t("story.showPrice")}
                checked={options.showPrice}
                onChange={(showPrice) => update({ showPrice })}
              />
              <Toggle
                id="story-location"
                label={t("story.showLocation")}
                checked={options.showLocation}
                onChange={(showLocation) => update({ showLocation })}
              />
              <Toggle
                id="story-description"
                label={t("story.showDescription")}
                checked={options.showDescription}
                onChange={(showDescription) => update({ showDescription })}
              />
              <div className="grid gap-2 pt-1">
                <p className="text-sm font-medium">{t("story.details")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {facts.map((fact) => {
                    const on = options.facts.includes(fact.id);
                    return (
                      <button
                        key={fact.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() =>
                          update({
                            facts: on
                              ? options.facts.filter((id) => id !== fact.id)
                              : [...options.facts, fact.id],
                          })
                        }
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          on
                            ? "border-primary bg-primary text-primary-foreground"
                            : "hover:border-brand hover:text-brand",
                        )}
                      >
                        {on ? <Check className="size-3" /> : null}
                        {fact.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Section>

            {listing.contact_whatsapp || listing.contact_email ? (
              <Section title={t("story.contact")} hint={t("story.contactHint")}>
                {listing.contact_whatsapp ? (
                  <Toggle
                    id="story-whatsapp"
                    label={`WhatsApp · ${listing.contact_whatsapp}`}
                    checked={options.showWhatsapp}
                    onChange={(showWhatsapp) => update({ showWhatsapp })}
                  />
                ) : null}
                {listing.contact_email ? (
                  <Toggle
                    id="story-email"
                    label={`${t("story.emailLabel")} · ${listing.contact_email}`}
                    checked={options.showEmail}
                    onChange={(showEmail) => update({ showEmail })}
                  />
                ) : null}
              </Section>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
          <Button variant="ghost" size="sm" onClick={copyLink} className="mr-auto">
            <Link2 />
            {t("story.copyLink")}
          </Button>
          <Button
            variant={canShareFiles ? "outline" : "default"}
            disabled={!fileReady}
            onClick={download}
          >
            <Download />
            {t("story.download")}
          </Button>
          {canShareFiles ? (
            <Button disabled={!fileReady} onClick={share}>
              <Share2 />
              {t("story.share")}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-lg leading-tight">{title}</h3>
        {hint ? <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="min-w-0 truncate font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ThemeSwatch({
  theme,
  label,
  selected,
  onSelect,
}: {
  theme: StoryTheme;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const background =
    typeof theme.background === "string"
      ? theme.background
      : `linear-gradient(135deg, ${theme.background[0]}, ${theme.background[1]})`;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="group flex cursor-pointer flex-col items-center gap-1"
    >
      <span
        className={cn(
          "flex h-14 w-10 items-end justify-start rounded-sm border p-1.5 ring-offset-2 transition-shadow",
          selected ? "ring-primary ring-2" : "group-hover:ring-input group-hover:ring-2",
        )}
        style={{ background }}
      >
        <span className="h-1.5 w-4 rounded-full" style={{ background: theme.accent }} />
      </span>
      <span className={cn("text-xs", selected ? "font-semibold" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
