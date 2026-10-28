"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { PublicListing } from "@/lib/types/database.types";
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  type StoryBackgroundId,
  type StoryLayout,
  type StoryPaletteId,
} from "@/features/story/options";
import { drawStory, type StoryContent } from "@/features/story/render";
import { drawSampleRoom } from "@/features/story/sample-room";
import { downscaleToWebP } from "@/features/listings/photos";
import {
  StoryDialog,
  type StoryDemoDraft,
} from "@/features/story/components/story-dialog";
import { blobToDataUrl, draftDescription, savePublishDraft } from "@/lib/publish-draft";
import { useStoryFonts } from "@/features/story/components/use-story-fonts";

const SAMPLE_PHOTO = "sample-room";

/** The three stories fanned out on the landing, back left to back right. */
const SHOWCASE: {
  layout: StoryLayout;
  palette: StoryPaletteId;
  background: StoryBackgroundId;
  className: string;
}[] = [
  {
    layout: "card",
    palette: "horchata",
    background: "paper",
    className: "left-0 top-10 -rotate-6 sm:left-2",
  },
  {
    layout: "cover",
    palette: "mediterranean",
    background: "waves",
    className: "right-0 top-10 rotate-6 sm:right-2",
  },
  {
    layout: "card",
    palette: "valencia",
    background: "dots",
    className: "left-1/2 top-0 z-10 -translate-x-1/2",
  },
];

/**
 * Landing teaser for the story generator: sample stories and a button that
 * opens the real editor in demo mode, with a made-up listing.
 */
export function StoryDemo({ locale }: { locale: string }) {
  const { t, plural } = useI18n();
  const router = useRouter();
  const fontsReady = useStoryFonts();
  const [open, setOpen] = useState(false);
  const [sample, setSample] = useState<HTMLCanvasElement | null>(null);
  const [photos, setPhotos] = useState<string[]>([SAMPLE_PHOTO]);
  const sources = useRef(new Map<string, string>());
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);

  // Canvas only exists in the browser, so the illustration is made after mount
  useEffect(() => {
    const room = drawSampleRoom();
    sources.current.set(SAMPLE_PHOTO, room.toDataURL("image/jpeg", 0.9));
    setSample(room);
    const local = sources.current;
    return () => {
      for (const [path, src] of local) if (path !== SAMPLE_PHOTO) URL.revokeObjectURL(src);
    };
  }, []);

  const listing = useMemo(
    () =>
      ({
        id: "demo",
        status: "approved",
        type: "room",
        room_type: "single",
        price: 380,
        neighborhood: t("landing.storyDemoHood"),
        municipality: "València",
        description: t("landing.storyDemoDescription"),
        available_from: null,
        bills_included: true,
        deposit: null,
        flatmates: 2,
        bedrooms: null,
        bathrooms: 1,
        pets: false,
        smokers: false,
        preferred_gender: "any",
        tenant_pref: "any",
        photos,
        contact_whatsapp: "+34 600 000 000",
        contact_email: null,
        contact_external: null,
      }) as unknown as PublicListing,
    [t, photos],
  );

  const resolvePhoto = useCallback((path: string) => sources.current.get(path) ?? "", []);

  const addPhoto = useCallback((file: File) => {
    const src = URL.createObjectURL(file);
    sources.current.set(src, src);
    setPhotos((prev) => [src, ...prev]);
    return src;
  }, []);

  // Only after an explicit click: the form opens pre-filled, and nothing is
  // uploaded or published until the visitor does it there
  const startListing = useCallback(
    async (draft: StoryDemoDraft) => {
      const photos: string[] = [];
      for (const path of draft.photos) {
        if (path === SAMPLE_PHOTO) continue;
        const blob = await (await fetch(path)).blob();
        const webp = await downscaleToWebP(new File([blob], "photo", { type: blob.type }));
        photos.push(await blobToDataUrl(webp));
      }
      savePublishDraft({
        price: draft.price,
        description: draftDescription(draft.headline, draft.note),
        photos,
      });
      router.push(`/${locale}/publish`);
    },
    [router, locale],
  );

  useEffect(() => {
    if (!fontsReady || !sample) return;
    const content: StoryContent = {
      eyebrow: `${t("listing.typeRoom")} · ${t("listing.roomSingle")}`,
      headline: t("story.defaultHeadlineRoom", { place: t("landing.storyDemoHood") }),
      note: t("landing.storyDemoNote"),
      price: "380",
      perMonth: t("listing.perMonth"),
      place: `${t("landing.storyDemoHood")}, València`,
      facts: [
        t("listing.availableNow"),
        t("listing.billsIncluded"),
        plural("listing.flatmates", 2),
      ],
      description: null,
      contacts: [],
      reviewedOn: t("story.demoFooter"),
      host: window.location.host,
    };
    SHOWCASE.forEach((variant, i) => {
      const ctx = canvases.current[i]?.getContext("2d");
      if (ctx) drawStory(ctx, content, variant.layout, variant.palette, variant.background, [sample]);
    });
  }, [fontsReady, sample, t, plural]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[330px] w-full max-w-[440px] sm:h-[430px]">
        {SHOWCASE.map((variant, i) => (
          <button
            key={variant.palette}
            type="button"
            tabIndex={-1}
            aria-hidden
            onClick={() => setOpen(true)}
            className={cn(
              "absolute cursor-pointer transition-transform duration-300 hover:-translate-y-2",
              variant.className,
            )}
          >
            <canvas
              ref={(node) => {
                canvases.current[i] = node;
              }}
              width={STORY_WIDTH}
              height={STORY_HEIGHT}
              className={cn(
                "bg-card h-[290px] w-auto rounded-sm border transition-opacity sm:h-[380px]",
                fontsReady && sample ? "opacity-100" : "opacity-0",
              )}
            />
          </button>
        ))}
      </div>

      <Button size="lg" className="mt-6" onClick={() => setOpen(true)}>
        <Sparkles />
        {t("landing.storyCta")}
      </Button>

      {sample ? (
        <StoryDialog
          listing={listing}
          open={open}
          onOpenChange={setOpen}
          resolvePhoto={resolvePhoto}
          initialOptions={{ palette: "valencia", background: "dots", note: t("landing.storyDemoNote") }}
          demo={{ onAddPhoto: addPhoto, onStartListing: startListing }}
        />
      ) : null}
    </div>
  );
}
