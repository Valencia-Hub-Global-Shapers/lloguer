"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/client";
import {
  downscaleToWebP,
  LISTING_PHOTOS_BUCKET,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  photoPath,
  photoUrl,
} from "../photos";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type Item = { path: string; uploading: boolean; preview: string };

export function PhotoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (paths: string[]) => void;
}) {
  const { t } = useI18n();
  // One random folder per form session keeps a poster's uploads together
  const [folder] = useState(() => crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>(() =>
    value.map((p) => ({ path: p, uploading: false, preview: photoUrl(p) })),
  );
  const itemsRef = useRef(items);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    itemsRef.current = items;
    onChangeRef.current = onChange;
  });

  const commit = (next: Item[]) => {
    itemsRef.current = next;
    setItems(next);
    onChangeRef.current(next.filter((i) => !i.uploading).map((i) => i.path));
  };

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const supabase = createClient();

    for (const file of Array.from(files)) {
      if (itemsRef.current.length >= MAX_PHOTOS) {
        toast.error(t("errors.tooManyPhotos"));
        break;
      }
      if (!ACCEPTED.includes(file.type)) {
        toast.error(t("errors.photoInvalidType"));
        continue;
      }
      if (file.size > MAX_PHOTO_BYTES * 2) {
        toast.error(t("errors.photoTooLarge"));
        continue;
      }

      const path = photoPath(folder, `${crypto.randomUUID()}.webp`);
      commit([
        ...itemsRef.current,
        { path, uploading: true, preview: URL.createObjectURL(file) },
      ]);

      try {
        const blob = await downscaleToWebP(file);
        if (blob.size > MAX_PHOTO_BYTES) {
          toast.error(t("errors.photoTooLarge"));
          commit(itemsRef.current.filter((i) => i.path !== path));
          continue;
        }
        const { error } = await supabase.storage
          .from(LISTING_PHOTOS_BUCKET)
          .upload(path, blob, { contentType: "image/webp", cacheControl: "31536000" });
        if (error) throw error;

        commit(
          itemsRef.current.map((i) =>
            i.path === path ? { ...i, uploading: false, preview: photoUrl(path) } : i,
          ),
        );
      } catch (e) {
        console.error("photo upload failed:", e);
        toast.error(t("errors.generic"));
        commit(itemsRef.current.filter((i) => i.path !== path));
      }
    }
  };

  // Anonymous posters cannot delete from storage; the file is just unreferenced.
  const remove = (path: string) => {
    commit(itemsRef.current.filter((i) => i.path !== path));
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={item.path}
            className="bg-muted relative aspect-square overflow-hidden rounded-lg border"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="" className="size-full object-cover" />
            {item.uploading ? (
              <div className="bg-background/60 absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-5 animate-spin" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => remove(item.path)}
                className="bg-background/80 hover:bg-background absolute top-1 right-1 cursor-pointer rounded-full p-1 shadow-xs"
                aria-label={t("common.delete")}
              >
                <X className="size-3.5" />
              </button>
            )}
            {idx === 0 && !item.uploading ? (
              <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                1
              </span>
            ) : null}
          </div>
        ))}
        {items.length < MAX_PHOTOS ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-muted-foreground hover:bg-accent flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-xs"
          >
            <ImagePlus className="size-5" />
            {items.length}/{MAX_PHOTOS}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="text-muted-foreground mt-1.5 text-xs">{t("publish.photosHint")}</p>
    </div>
  );
}
