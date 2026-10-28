"use client";

import { useEffect, useState } from "react";
import { STORY_FONTS } from "../render";

/** True once the story fonts are loaded, so the canvas never draws with fallbacks. */
export function useStoryFonts(enabled = true): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    Promise.all(STORY_FONTS.map((font) => document.fonts.load(font)))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [enabled, ready]);
  return ready;
}
