"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useI18n } from "@/i18n/client";
import {
  MAX_HEADLINE_LENGTH,
  STORY_BACKGROUNDS,
  STORY_HEIGHT,
  STORY_LAYOUTS,
  STORY_PALETTES,
  STORY_WIDTH,
  type StoryBackgroundId,
  type StoryLayout,
  type StoryPaletteId,
} from "@/features/story/options";
import { drawStory, type StoryContent, type StoryImage } from "@/features/story/render";
import { drawSampleRoom } from "@/features/story/sample-room";
import { BackgroundSwatch, PaletteSwatch } from "@/features/story/components/swatches";
import { useStoryFonts } from "@/features/story/components/use-story-fonts";

const LAYOUT_KEYS: Record<StoryLayout, string> = {
  card: "story.layoutCard",
  cover: "story.layoutCover",
  text: "story.layoutText",
};

/**
 * Landing demo of the story generator: visitors type their own ad and see
 * the story change live. Nothing is uploaded or saved, and there is no
 * download: the real one comes with a published (reviewed) listing.
 */
export function StoryPlayground() {
  const { t, plural } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fontsReady = useStoryFonts();

  const [headline, setHeadline] = useState(() => t("landing.storyDemoHeadline"));
  const [price, setPrice] = useState("380");
  const [place, setPlace] = useState(() => t("landing.storyDemoPlace"));
  const [note, setNote] = useState(() => t("landing.storyDemoNote"));
  const [layout, setLayout] = useState<StoryLayout>("card");
  const [palette, setPalette] = useState<StoryPaletteId>("valencia");
  const [background, setBackground] = useState<StoryBackgroundId>("dots");
  const [sample, setSample] = useState<StoryImage>(null);
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);

  // Canvas only exists in the browser, so the illustration is made after mount
  useEffect(() => setSample(drawSampleRoom()), []);

  const content = useMemo<StoryContent>(
    () => ({
      eyebrow: `${t("listing.typeRoom")} · ${t("listing.roomSingle")}`,
      headline,
      note,
      price: price.trim() ? price.trim() : null,
      perMonth: t("listing.perMonth"),
      place: place.trim() || null,
      facts: [
        t("listing.availableNow"),
        t("listing.billsIncluded"),
        plural("listing.flatmates", 2),
      ],
      description: null,
      contacts: [],
      reviewedOn: t("landing.storyDemoFooter"),
      host: typeof window === "undefined" ? "" : window.location.host,
    }),
    [t, plural, headline, note, price, place],
  );

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !fontsReady) return;
    const image = photo ?? sample;
    drawStory(ctx, content, layout, palette, background, image ? [image] : []);
  }, [fontsReady, content, layout, palette, background, photo, sample]);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      photo?.close();
      setPhoto(bitmap);
      if (layout === "text") setLayout("card");
    } catch {
      // Not an image the browser can decode: keep the illustration
    }
  };

  const clearPhoto = () => {
    photo?.close();
    setPhoto(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="bg-card grid gap-6 rounded-md border p-4 sm:grid-cols-[auto_1fr] sm:p-6">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={STORY_WIDTH}
          height={STORY_HEIGHT}
          role="img"
          aria-label={t("story.previewLabel")}
          className="bg-background h-[440px] w-auto rounded-sm border transition-opacity sm:h-[520px]"
          style={{ opacity: fontsReady ? 1 : 0 }}
        />
      </div>

      <div className="grid content-start gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="demo-headline">{t("story.headline")}</Label>
          <Input
            id="demo-headline"
            value={headline}
            maxLength={MAX_HEADLINE_LENGTH}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-[6.5rem_1fr] gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="demo-price">{t("landing.storyDemoPriceLabel")}</Label>
            <Input
              id="demo-price"
              inputMode="numeric"
              value={price}
              maxLength={5}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="demo-place">{t("story.showLocation")}</Label>
            <Input
              id="demo-place"
              value={place}
              maxLength={60}
              onChange={(e) => setPlace(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="demo-note">{t("story.note")}</Label>
          <Input
            id="demo-note"
            value={note}
            maxLength={90}
            placeholder={t("story.notePlaceholder")}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium">{t("story.layout")}</p>
          <ToggleGroup
            type="single"
            value={layout}
            onValueChange={(value) => value && setLayout(value as StoryLayout)}
            className="flex-wrap"
          >
            {STORY_LAYOUTS.map((option) => (
              <ToggleGroupItem key={option} value={option}>
                {t(LAYOUT_KEYS[option])}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium">{t("story.color")}</p>
          <div className="flex flex-wrap gap-1">
            {STORY_PALETTES.map((option) => (
              <PaletteSwatch
                key={option.id}
                palette={option}
                label={t(`story.palette.${option.id}`)}
                selected={palette === option.id}
                onSelect={() => setPalette(option.id)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium">{t("story.background")}</p>
          <div className="flex flex-wrap gap-1">
            {STORY_BACKGROUNDS.map((option) => (
              <BackgroundSwatch
                key={option}
                background={option}
                palette={palette}
                label={t(`story.backgrounds.${option}`)}
                selected={background === option}
                onSelect={() => setBackground(option)}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            id="demo-photo"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
          <Button variant="outline" size="sm" asChild>
            <label htmlFor="demo-photo">
              <ImagePlus />
              {t("landing.storyDemoUsePhoto")}
            </label>
          </Button>
          {photo ? (
            <Button variant="ghost" size="sm" onClick={clearPhoto}>
              <X />
              {t("landing.storyDemoClearPhoto")}
            </Button>
          ) : null}
          <p className="text-muted-foreground w-full text-xs">
            {t("landing.storyDemoPrivacy")}
          </p>
        </div>
      </div>
    </div>
  );
}
