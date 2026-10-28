"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { StoryBackgroundId, StoryPalette, StoryPaletteId } from "../options";
import { drawBackgroundSample } from "../render";

/** Background swatches render at 2x their 40x56 CSS size. */
const SWATCH_WIDTH = 80;
const SWATCH_HEIGHT = 112;

function SwatchButton({
  label,
  selected,
  onSelect,
  children,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="group flex w-16 cursor-pointer flex-col items-center gap-1"
    >
      <span
        className={cn(
          "block h-14 w-10 overflow-hidden rounded-sm border ring-offset-2 transition-shadow",
          selected ? "ring-primary ring-2" : "group-hover:ring-input group-hover:ring-2",
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "text-center text-xs leading-tight",
          selected ? "font-semibold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

export function PaletteSwatch({
  palette,
  ...props
}: {
  palette: StoryPalette;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <SwatchButton {...props}>
      <span
        className="flex size-full items-end p-1.5"
        style={{
          background: `linear-gradient(135deg, ${palette.ground[0]}, ${palette.ground[1]})`,
        }}
      >
        <span className="h-1.5 w-4 rounded-full" style={{ background: palette.accent }} />
      </span>
    </SwatchButton>
  );
}

/** Drawn with the story renderer itself, in the current color. */
export function BackgroundSwatch({
  background,
  palette,
  ...props
}: {
  background: StoryBackgroundId;
  palette: StoryPaletteId;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (ctx) drawBackgroundSample(ctx, palette, background, SWATCH_WIDTH);
  }, [background, palette]);
  return (
    <SwatchButton {...props}>
      <canvas
        ref={ref}
        width={SWATCH_WIDTH}
        height={SWATCH_HEIGHT}
        aria-hidden
        className="size-full"
      />
    </SwatchButton>
  );
}
