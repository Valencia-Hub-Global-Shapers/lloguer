import {
  STORY_HEIGHT as H,
  STORY_WIDTH as W,
  getPalette,
  wrapText,
  type StoryBackgroundId,
  type StoryLayout,
  type StoryPalette,
  type StoryPaletteId,
} from "./options";

/** Everything the story shows, already translated and filtered by the options. */
export type StoryContent = {
  eyebrow: string | null;
  headline: string;
  note: string;
  price: string | null;
  perMonth: string;
  place: string | null;
  facts: string[];
  description: string | null;
  contacts: { label: string; value: string }[];
  reviewedOn: string;
  host: string;
};

/** A photo that failed to load is null and drawn as a plain tile. */
export type StoryImage = HTMLImageElement | HTMLCanvasElement | ImageBitmap | null;

const PAD = 88;
/** Instagram covers the top and bottom of a story with its own UI. */
const SAFE_TOP = 230;
const FOOTER_TOP = 1620;
const CONTENT_BOTTOM = FOOTER_TOP - 56;
const MIN_PHOTO = 380;
const RADIUS = 10;

const SERIF = '"Newsreader", Georgia, serif';
const SANS = '"Work Sans", system-ui, sans-serif';
const LOGO = '"Fraunces", Georgia, serif';

/** Font faces the story uses; load them before drawing so canvas does not fall back. */
export const STORY_FONTS = [
  `400 80px ${SERIF}`,
  `500 80px ${SERIF}`,
  `400 32px ${SANS}`,
  `500 32px ${SANS}`,
  `600 32px ${SANS}`,
  `600 52px ${LOGO}`,
];

type Ctx = CanvasRenderingContext2D;

/** A block measured up front and drawn later, so layouts can stack them. */
type Block = { height: number; draw: (ctx: Ctx, top: number) => void };

export function drawStory(
  ctx: Ctx,
  content: StoryContent,
  layout: StoryLayout,
  paletteId: StoryPaletteId,
  background: StoryBackgroundId,
  images: StoryImage[],
): void {
  const palette = getPalette(paletteId);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawGround(ctx, palette, background, 0);

  if (layout === "cover") drawCover(ctx, content, palette, background, images[0] ?? null);
  else if (layout === "card" && images.length > 0) drawCard(ctx, content, palette, images);
  else drawTextOnly(ctx, content, palette);

  drawFooter(ctx, content, palette);
  ctx.restore();
}

/* ---------- layouts ---------- */

function drawCard(ctx: Ctx, content: StoryContent, palette: StoryPalette, images: StoryImage[]) {
  const top = headBlocks(ctx, content, palette, false);
  // Shrink the lower blocks until the photos get a decent share of the story
  const attempts: [number, number][] = [
    [3, 4],
    [3, 0],
    [2, 0],
    [1, 0],
  ];
  let bottom: Block[] = [];
  let photoHeight = 0;
  for (const [chipRows, descLines] of attempts) {
    bottom = tailBlocks(ctx, content, palette, chipRows, descLines);
    photoHeight = CONTENT_BOTTOM - SAFE_TOP - stackHeight(top) - stackHeight(bottom) - 2 * 44;
    if (photoHeight >= MIN_PHOTO) break;
  }
  // Worst case (every block at its longest) still leaves about 280 px
  photoHeight = Math.max(photoHeight, 220);

  let y = drawStack(ctx, top, SAFE_TOP);
  y += 44;
  drawPhotoGrid(ctx, images, palette, PAD, y, W - 2 * PAD, photoHeight);
  drawStack(ctx, bottom, CONTENT_BOTTOM - stackHeight(bottom));
}

function drawCover(
  ctx: Ctx,
  content: StoryContent,
  palette: StoryPalette,
  background: StoryBackgroundId,
  image: StoryImage,
) {
  if (image) drawImageCover(ctx, image, 0, 0, W, H);
  const top = headBlocks(ctx, content, palette, false);
  let bottom = tailBlocks(ctx, content, palette, 3, 4);
  if (stackHeight(top) + stackHeight(bottom) > 1000) {
    bottom = tailBlocks(ctx, content, palette, 2, 0);
  }
  const height = stackHeight(top) + 36 + stackHeight(bottom);
  const panelTop = CONTENT_BOTTOM - height - 72;

  // Fade the photo into the palette ground so text stays legible on any picture
  const fade = palette.ground[1];
  const gradient = ctx.createLinearGradient(0, panelTop - 360, 0, panelTop);
  gradient.addColorStop(0, withAlpha(fade, 0));
  gradient.addColorStop(1, withAlpha(fade, 1));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, panelTop - 360, W, 360);
  drawGround(ctx, palette, background, panelTop);

  const y = drawStack(ctx, top, panelTop + 36);
  drawStack(ctx, bottom, y + 36);
}

function drawTextOnly(ctx: Ctx, content: StoryContent, palette: StoryPalette) {
  const top = headBlocks(ctx, content, palette, true);
  let bottom = tailBlocks(ctx, content, palette, 4, 9);
  const room = CONTENT_BOTTOM - SAFE_TOP - 72;
  if (stackHeight(top) + stackHeight(bottom) > room) bottom = tailBlocks(ctx, content, palette, 3, 4);
  if (stackHeight(top) + stackHeight(bottom) > room) bottom = tailBlocks(ctx, content, palette, 2, 0);
  const total = stackHeight(top) + 72 + stackHeight(bottom);
  const start = Math.max(SAFE_TOP, (SAFE_TOP + CONTENT_BOTTOM) / 2 - total / 2);

  let y = drawStack(ctx, top, start);
  y += 36;
  ctx.fillStyle = palette.accent;
  ctx.fillRect(PAD, y, 120, 6);
  drawStack(ctx, bottom, y + 36);
}

/* ---------- blocks ---------- */

/** Eyebrow, headline and the poster's own note. */
function headBlocks(ctx: Ctx, content: StoryContent, palette: StoryPalette, large: boolean): Block[] {
  const blocks: Block[] = [];
  const width = W - 2 * PAD;

  if (content.eyebrow) {
    const eyebrow = content.eyebrow.toUpperCase();
    blocks.push({
      height: 34 + 22,
      draw: (c, top) => {
        c.font = `600 30px ${SANS}`;
        c.fillStyle = palette.accent;
        c.fillText(fitLine(c, eyebrow, width), PAD, top + 30);
      },
    });
  }

  if (content.headline.trim()) {
    const size = large ? 112 : 84;
    const lineHeight = Math.round(size * 1.08);
    ctx.font = `400 ${size}px ${SERIF}`;
    const lines = wrapText(content.headline, width, (s) => ctx.measureText(s).width, large ? 4 : 3);
    blocks.push({
      height: lines.length * lineHeight,
      draw: (c, top) => {
        c.font = `400 ${size}px ${SERIF}`;
        c.fillStyle = palette.ink;
        lines.forEach((line, i) => c.fillText(line, PAD, top + size * 0.82 + i * lineHeight));
      },
    });
  }

  if (content.note.trim()) {
    const size = large ? 50 : 44;
    const lineHeight = Math.round(size * 1.25);
    const inset = 34;
    ctx.font = `500 ${size}px ${SERIF}`;
    const lines = wrapText(
      content.note,
      width - inset,
      (s) => ctx.measureText(s).width,
      3,
    );
    blocks.push({
      height: 28 + lines.length * lineHeight,
      draw: (c, top) => {
        const y = top + 28;
        c.fillStyle = palette.accent;
        c.fillRect(PAD, y + 6, 6, lines.length * lineHeight - 6);
        c.font = `500 ${size}px ${SERIF}`;
        c.fillStyle = palette.ink;
        lines.forEach((line, i) =>
          c.fillText(line, PAD + inset, y + size * 0.85 + i * lineHeight),
        );
      },
    });
  }
  return blocks;
}

/** Price, place, fact chips, description excerpt and contact lines. */
function tailBlocks(
  ctx: Ctx,
  content: StoryContent,
  palette: StoryPalette,
  chipRows: number,
  descLines: number,
): Block[] {
  const blocks: Block[] = [];
  const width = W - 2 * PAD;

  if (content.price) {
    const price = content.price;
    blocks.push({
      height: 132,
      draw: (c, top) => {
        const baseline = top + 112;
        c.font = `500 140px ${SERIF}`;
        c.fillStyle = palette.accent;
        c.fillText(price, PAD, baseline);
        const priceWidth = c.measureText(price).width;
        c.font = `500 42px ${SANS}`;
        c.fillStyle = palette.muted;
        c.fillText(` ${content.perMonth}`, PAD + priceWidth + 6, baseline);
      },
    });
  }

  if (content.place) {
    const place = content.place;
    blocks.push({
      height: 64,
      draw: (c, top) => {
        drawPin(c, PAD + 14, top + 22, palette.accent);
        c.font = `600 40px ${SANS}`;
        c.fillStyle = palette.ink;
        c.fillText(fitLine(c, place, width - 46), PAD + 46, top + 44);
      },
    });
  }

  if (content.facts.length > 0 && chipRows > 0) {
    ctx.font = `500 32px ${SANS}`;
    const rows = layoutChips(ctx, content.facts, width, chipRows);
    blocks.push({
      height: 18 + rows.length * 78,
      draw: (c, top) => {
        c.font = `500 32px ${SANS}`;
        rows.forEach((row, r) => {
          const y = top + 18 + r * 78;
          for (const chip of row) {
            c.fillStyle = palette.chipBg;
            roundRect(c, PAD + chip.x, y, chip.width, 64, 32);
            c.fill();
            c.fillStyle = palette.chipInk;
            c.fillText(chip.label, PAD + chip.x + 26, y + 43);
          }
        });
      },
    });
  }

  if (content.description && descLines > 0) {
    ctx.font = `400 32px ${SANS}`;
    const lines = wrapText(content.description, width, (s) => ctx.measureText(s).width, descLines);
    blocks.push({
      height: 24 + lines.length * 44,
      draw: (c, top) => {
        c.font = `400 32px ${SANS}`;
        c.fillStyle = palette.muted;
        lines.forEach((line, i) => c.fillText(line, PAD, top + 24 + 32 + i * 44));
      },
    });
  }

  if (content.contacts.length > 0) {
    const contacts = content.contacts;
    blocks.push({
      height: 30 + contacts.length * 60,
      draw: (c, top) => {
        contacts.forEach((contact, i) => {
          const baseline = top + 30 + 42 + i * 60;
          c.font = `500 30px ${SANS}`;
          c.fillStyle = palette.muted;
          const label = `${contact.label}  `;
          c.fillText(label, PAD, baseline);
          const labelWidth = c.measureText(label).width;
          c.font = `600 40px ${SANS}`;
          c.fillStyle = palette.ink;
          c.fillText(fitLine(c, contact.value, width - labelWidth), PAD + labelWidth, baseline);
        });
      },
    });
  }
  return blocks;
}

function stackHeight(blocks: Block[]): number {
  return blocks.reduce((sum, block) => sum + block.height, 0);
}

/** Draws the blocks top-down and returns the y just below the last one. */
function drawStack(ctx: Ctx, blocks: Block[], top: number): number {
  let y = top;
  for (const block of blocks) {
    block.draw(ctx, y);
    y += block.height;
  }
  return y;
}

type Chip = { label: string; x: number; width: number };

function layoutChips(ctx: Ctx, labels: string[], width: number, maxRows: number): Chip[][] {
  const rows: Chip[][] = [[]];
  let x = 0;
  for (const label of labels) {
    const text = fitLine(ctx, label, width - 52);
    const chipWidth = ctx.measureText(text).width + 52;
    if (x > 0 && x + chipWidth > width) {
      if (rows.length === maxRows) break;
      rows.push([]);
      x = 0;
    }
    rows[rows.length - 1].push({ label: text, x, width: chipWidth });
    x += chipWidth + 14;
  }
  return rows.filter((row) => row.length > 0);
}

/* ---------- footer: the Lloguer credit every story carries ---------- */

function drawFooter(ctx: Ctx, content: StoryContent, palette: StoryPalette) {
  ctx.fillStyle = palette.rule;
  ctx.fillRect(PAD, FOOTER_TOP, W - 2 * PAD, 2);

  const top = FOOTER_TOP + 40;
  drawLogo(ctx, PAD, top, 80, palette);
  ctx.font = `600 56px ${LOGO}`;
  ctx.fillStyle = palette.ink;
  ctx.fillText("Lloguer", PAD + 104, top + 60);

  ctx.textAlign = "right";
  ctx.font = `500 28px ${SANS}`;
  ctx.fillStyle = palette.muted;
  ctx.fillText(content.reviewedOn, W - PAD, top + 30);
  ctx.font = `600 32px ${SANS}`;
  ctx.fillStyle = palette.ink;
  ctx.fillText(content.host, W - PAD, top + 72);
  ctx.textAlign = "left";
}

/** Same paths as LogoMark (src/components/logo-mark.tsx), on a 64-unit grid. */
function drawLogo(ctx: Ctx, x: number, y: number, size: number, palette: StoryPalette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.fillStyle = palette.logoTile;
  roundRect(ctx, 0, 0, 64, 64, 14);
  ctx.fill();
  ctx.fillStyle = palette.logoGlyph;
  ctx.fill(new Path2D("M19 24 32 10l13 14v9H19Z"));
  roundRect(ctx, 29.5, 32, 5, 24, 1.5);
  ctx.fill();
  roundRect(ctx, 34, 38, 8, 4.5, 1);
  ctx.fill();
  roundRect(ctx, 34, 46, 6, 4.5, 1);
  ctx.fill();
  ctx.fillStyle = palette.logoTile;
  ctx.beginPath();
  ctx.arc(32, 25, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- ground and photos ---------- */

/**
 * Background swatch: the top-left corner of a story with this color and
 * background, scaled so the pattern stays readable at thumbnail size.
 */
export function drawBackgroundSample(
  ctx: Ctx,
  paletteId: StoryPaletteId,
  background: StoryBackgroundId,
  width: number,
): void {
  ctx.save();
  ctx.scale(width / 200, width / 200);
  // Painted twice: at thumbnail size the faint story pattern would vanish
  drawGround(ctx, getPalette(paletteId), background, 0, 2);
  ctx.restore();
}

/** Gradient ground plus the background pattern, from fromY down. */
function drawGround(
  ctx: Ctx,
  palette: StoryPalette,
  background: StoryBackgroundId,
  fromY: number,
  passes = 1,
) {
  const gradient = ctx.createLinearGradient(0, 0, W, H);
  gradient.addColorStop(0, palette.ground[0]);
  gradient.addColorStop(1, palette.ground[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, fromY, W, H - fromY);

  if (background === "plain") return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, fromY, W, H - fromY);
  ctx.clip();
  ctx.fillStyle = palette.pattern;
  ctx.strokeStyle = palette.pattern;
  for (let i = 0; i < passes; i++) {
    ctx.save();
    PATTERNS[background](ctx);
    ctx.restore();
  }
  ctx.restore();
}

/** Same sequence on every draw, so a pattern never jumps while editing. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

/** Each pattern paints with the current fill and stroke style over the whole story. */
const PATTERNS: Record<Exclude<StoryBackgroundId, "plain">, (ctx: Ctx) => void> = {
  /** Paper grain: fine specks. */
  paper: (ctx) => {
    const random = seeded(11);
    for (let i = 0; i < 16000; i++) {
      const size = random() > 0.9 ? 3 : 2;
      ctx.fillRect(random() * W, random() * H, size, size);
    }
  },

  /** A loose street grid, like the map the listings live on. */
  map: (ctx) => {
    const random = seeded(7);
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.21);
    for (const axis of [0, 1]) {
      let offset = -H;
      while (offset < H) {
        offset += 70 + random() * 120;
        ctx.lineWidth = random() > 0.82 ? 14 : 4;
        ctx.beginPath();
        if (axis === 0) {
          ctx.moveTo(-H, offset);
          ctx.lineTo(H, offset);
        } else {
          ctx.moveTo(offset, -H);
          ctx.lineTo(offset, H);
        }
        ctx.stroke();
      }
    }
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(-260, -520, 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(320, 480, 110, 0, Math.PI * 2);
    ctx.stroke();
  },

  /** Halftone dots that grow toward the bottom-right corner. */
  dots: (ctx) => {
    const step = 46;
    for (let row = 0; row * step < H + step; row++) {
      const shift = row % 2 === 0 ? 0 : step / 2;
      for (let x = shift; x < W + step; x += step) {
        const y = row * step;
        const radius = 2.5 + 8 * ((x + y) / (W + H));
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  /** Rows of gentle waves, for the Mediterranean. */
  waves: (ctx) => {
    ctx.lineWidth = 4;
    for (let row = 0, y = 30; y < H + 40; row++, y += 64) {
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 12) {
        const wave = y + 15 * Math.sin((x / 240) * Math.PI * 2 + row * 0.9);
        if (x === -20) ctx.moveTo(x, wave);
        else ctx.lineTo(x, wave);
      }
      ctx.stroke();
    }
  },

  /** Line drawing of Valencian tiles: square, diamond, rosette and corner arcs. */
  tiles: (ctx) => {
    const cell = W / 5;
    // Busier than the other patterns, so a little fainter
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 4;
    for (let y = 0; y < H; y += cell) {
      for (let x = 0; x < W; x += cell) {
        const cx = x + cell / 2;
        const cy = y + cell / 2;
        ctx.strokeRect(x, y, cell, cell);
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(x + cell, cy);
        ctx.lineTo(cx, y + cell);
        ctx.lineTo(x, cy);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.05, 0, Math.PI * 2);
        ctx.fill();
        for (const [px, py, start] of [
          [x, y, 0],
          [x + cell, y, Math.PI / 2],
          [x + cell, y + cell, Math.PI],
          [x, y + cell, (3 * Math.PI) / 2],
        ]) {
          ctx.beginPath();
          ctx.arc(px, py, cell * 0.22, start, start + Math.PI / 2);
          ctx.stroke();
        }
      }
    }
  },
};

function drawPhotoGrid(
  ctx: Ctx,
  images: StoryImage[],
  palette: StoryPalette,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const gap = 14;
  const half = (w - gap) / 2;
  const halfH = (h - gap) / 2;
  const cells: [number, number, number, number][] =
    images.length === 1
      ? [[x, y, w, h]]
      : images.length === 2
        ? [
            [x, y, half, h],
            [x + half + gap, y, half, h],
          ]
        : images.length === 3
          ? [
              [x, y, w * 0.6 - gap / 2, h],
              [x + w * 0.6 + gap / 2, y, w * 0.4 - gap / 2, halfH],
              [x + w * 0.6 + gap / 2, y + halfH + gap, w * 0.4 - gap / 2, halfH],
            ]
          : [
              [x, y, half, halfH],
              [x + half + gap, y, half, halfH],
              [x, y + halfH + gap, half, halfH],
              [x + half + gap, y + halfH + gap, half, halfH],
            ];
  cells.forEach(([cx, cy, cw, ch], i) => {
    const image = images[i];
    ctx.save();
    roundRect(ctx, cx, cy, cw, ch, RADIUS);
    ctx.clip();
    if (image) {
      drawImageCover(ctx, image, cx, cy, cw, ch);
    } else {
      ctx.fillStyle = palette.chipBg;
      ctx.fillRect(cx, cy, cw, ch);
    }
    ctx.restore();
  });
}

/** Like CSS object-fit: cover. */
function drawImageCover(
  ctx: Ctx,
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const iw = "naturalWidth" in image ? image.naturalWidth : image.width;
  const ih = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

/* ---------- primitives ---------- */

function drawPin(ctx: Ctx, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, Math.PI, 0);
  ctx.lineTo(cx, cy + 28);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitLine(ctx: Ctx, text: string, maxWidth: number): string {
  return wrapText(text.replace(/\s+/g, " "), maxWidth, (s) => ctx.measureText(s).width, 1)[0] ?? "";
}

/** "#rrggbb" with the given alpha, for gradients that fade to the ground color. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
