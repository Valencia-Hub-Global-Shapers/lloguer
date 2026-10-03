"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/client";
import { photoUrl } from "@/features/listings/photos";

/** Admin photo gallery: a large preview, thumbnails and a keyboard-driven lightbox. */
export function PhotoGallery({ photos }: { photos: string[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const total = photos.length;

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + total) % total),
    [total],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (total === 0) {
    return (
      <div className="bg-muted text-muted-foreground flex h-64 items-center justify-center rounded-xl border">
        <ImageIcon className="size-8" />
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("admin.photos")}
        className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl(photos[index])}
          alt=""
          className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02] sm:h-96"
        />
        {total > 1 ? (
          <span className="absolute right-3 bottom-3 rounded-full bg-black/65 px-2.5 py-0.5 text-xs font-medium text-white">
            {index + 1} / {total}
          </span>
        ) : null}
      </button>

      {total > 1 ? (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {photos.map((p, i) => (
            <button
              key={p}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={String(i + 1)}
              className={`overflow-hidden rounded-lg border transition ${
                i === index ? "ring-primary ring-2" : "opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl(p)} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-2 sm:p-3">
          <DialogTitle className="sr-only">{t("admin.photos")}</DialogTitle>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photos[index])}
              alt=""
              className="max-h-[80dvh] w-full rounded-lg object-contain"
            />
            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={t("admin.prevPhoto")}
                  className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/75"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={t("admin.nextPhoto")}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/55 p-2 text-white transition hover:bg-black/75"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
