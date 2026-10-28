import {
  STORY_HEIGHT as H,
  STORY_WIDTH as W,
  getTheme,
  wrapText,
  type StoryLayout,
  type StoryTheme,
  type StoryThemeId,
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
export type StoryImage = HTMLImageElement | ImageBitmap | null;

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
  themeId: StoryThemeId,
  images: StoryImage[],
): void {
  const theme = getTheme(themeId);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  drawBackground(ctx, theme);

  if (layout === "cover") drawCover(ctx, content, theme, images[0] ?? null);
  else if (layout === "card" && images.length > 0) drawCard(ctx, content, theme, images);
  else drawTextOnly(ctx, content, theme);

  drawFooter(ctx, content, theme);
  ctx.restore();
}

/* ---------- layouts ---------- */

function drawCard(ctx: Ctx, content: StoryContent, theme: StoryTheme, images: StoryImage[]) {
  const top = headBlocks(ctx, content, theme, false);
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
    bottom = tailBlocks(ctx, content, theme, chipRows, descLines);
    photoHeight = CONTENT_BOTTOM - SAFE_TOP - stackHeight(top) - stackHeight(bottom) - 2 * 44;
    if (photoHeight >= MIN_PHOTO) break;
  }
  // Worst case (every block at its longest) still leaves about 280 px
  photoHeight = Math.max(photoHeight, 220);

  let y = drawStack(ctx, top, SAFE_TOP);
  y += 44;
  drawPhotoGrid(ctx, images, theme, PAD, y, W - 2 * PAD, photoHeight);
  drawStack(ctx, bottom, CONTENT_BOTTOM - stackHeight(bottom));
}

function drawCover(ctx: Ctx, content: StoryContent, theme: StoryTheme, image: StoryImage) {
  if (image) drawImageCover(ctx, image, 0, 0, W, H);
  const top = headBlocks(ctx, content, theme, false);
  let bottom = tailBlocks(ctx, content, theme, 3, 4);
  if (stackHeight(top) + stackHeight(bottom) > 1000) {
    bottom = tailBlocks(ctx, content, theme, 2, 0);
  }
  const height = stackHeight(top) + 36 + stackHeight(bottom);
  const panelTop = CONTENT_BOTTOM - height - 72;

  // Fade the photo into the theme ground so text stays legible on any picture
  const fade = groundStops(theme)[1];
  const gradient = ctx.createLinearGradient(0, panelTop - 360, 0, panelTop);
  gradient.addColorStop(0, withAlpha(fade, 0));
  gradient.addColorStop(1, withAlpha(fade, 1));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, panelTop - 360, W, 360);
  fillGround(ctx, theme, panelTop, H - panelTop);
  if (theme.pattern) drawPattern(ctx, theme.pattern, panelTop);

  const y = drawStack(ctx, top, panelTop + 36);
  drawStack(ctx, bottom, y + 36);
}

function drawTextOnly(ctx: Ctx, content: StoryContent, theme: StoryTheme) {
  const top = headBlocks(ctx, content, theme, true);
  let bottom = tailBlocks(ctx, content, theme, 4, 9);
  const room = CONTENT_BOTTOM - SAFE_TOP - 72;
  if (stackHeight(top) + stackHeight(bottom) > room) bottom = tailBlocks(ctx, content, theme, 3, 4);
  if (stackHeight(top) + stackHeight(bottom) > room) bottom = tailBlocks(ctx, content, theme, 2, 0);
  const total = stackHeight(top) + 72 + stackHeight(bottom);
  const start = Math.max(SAFE_TOP, (SAFE_TOP + CONTENT_BOTTOM) / 2 - total / 2);

  let y = drawStack(ctx, top, start);
  y += 36;
  ctx.fillStyle = theme.accent;
  ctx.fillRect(PAD, y, 120, 6);
  drawStack(ctx, bottom, y + 36);
}

/* ---------- blocks ---------- */

/** Eyebrow, headline and the poster's own note. */
function headBlocks(ctx: Ctx, content: StoryContent, theme: StoryTheme, large: boolean): Block[] {
  const blocks: Block[] = [];
  const width = W - 2 * PAD;

  if (content.eyebrow) {
    const eyebrow = content.eyebrow.toUpperCase();
    blocks.push({
      height: 34 + 22,
      draw: (c, top) => {
        c.font = `600 30px ${SANS}`;
        c.fillStyle = theme.accent;
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
        c.fillStyle = theme.ink;
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
        c.fillStyle = theme.accent;
        c.fillRect(PAD, y + 6, 6, lines.length * lineHeight - 6);
        c.font = `500 ${size}px ${SERIF}`;
        c.fillStyle = theme.ink;
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
  theme: StoryTheme,
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
        c.fillStyle = theme.accent;
        c.fillText(price, PAD, baseline);
        const priceWidth = c.measureText(price).width;
        c.font = `500 42px ${SANS}`;
        c.fillStyle = theme.muted;
        c.fillText(` ${content.perMonth}`, PAD + priceWidth + 6, baseline);
      },
    });
  }

  if (content.place) {
    const place = content.place;
    blocks.push({
      height: 64,
      draw: (c, top) => {
        drawPin(c, PAD + 14, top + 22, theme.accent);
        c.font = `600 40px ${SANS}`;
        c.fillStyle = theme.ink;
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
            c.fillStyle = theme.chipBg;
            roundRect(c, PAD + chip.x, y, chip.width, 64, 32);
            c.fill();
            c.fillStyle = theme.chipInk;
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
        c.fillStyle = theme.muted;
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
          c.fillStyle = theme.muted;
          const label = `${contact.label}  `;
          c.fillText(label, PAD, baseline);
          const labelWidth = c.measureText(label).width;
          c.font = `600 40px ${SANS}`;
          c.fillStyle = theme.ink;
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

function drawFooter(ctx: Ctx, content: StoryContent, theme: StoryTheme) {
  ctx.fillStyle = theme.rule;
  ctx.fillRect(PAD, FOOTER_TOP, W - 2 * PAD, 2);

  const top = FOOTER_TOP + 40;
  drawLogo(ctx, PAD, top, 80, theme);
  ctx.font = `600 56px ${LOGO}`;
  ctx.fillStyle = theme.ink;
  ctx.fillText("Lloguer", PAD + 104, top + 60);

  ctx.textAlign = "right";
  ctx.font = `500 28px ${SANS}`;
  ctx.fillStyle = theme.muted;
  ctx.fillText(content.reviewedOn, W - PAD, top + 30);
  ctx.font = `600 32px ${SANS}`;
  ctx.fillStyle = theme.ink;
  ctx.fillText(content.host, W - PAD, top + 72);
  ctx.textAlign = "left";
}

/** Same paths as LogoMark (src/components/logo-mark.tsx), on a 64-unit grid. */
function drawLogo(ctx: Ctx, x: number, y: number, size: number, theme: StoryTheme) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.fillStyle = theme.logoTile;
  roundRect(ctx, 0, 0, 64, 64, 14);
  ctx.fill();
  ctx.fillStyle = theme.logoGlyph;
  ctx.fill(new Path2D("M19 24 32 10l13 14v9H19Z"));
  roundRect(ctx, 29.5, 32, 5, 24, 1.5);
  ctx.fill();
  roundRect(ctx, 34, 38, 8, 4.5, 1);
  ctx.fill();
  roundRect(ctx, 34, 46, 6, 4.5, 1);
  ctx.fill();
  ctx.fillStyle = theme.logoTile;
  ctx.beginPath();
  ctx.arc(32, 25, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- ground and photos ---------- */

function groundStops(theme: StoryTheme): [string, string] {
  return typeof theme.background === "string"
    ? [theme.background, theme.background]
    : theme.background;
}

function fillGround(ctx: Ctx, theme: StoryTheme, y: number, height: number) {
  const [from, to] = groundStops(theme);
  if (from === to) {
    ctx.fillStyle = from;
  } else {
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, y, W, height);
}

function drawBackground(ctx: Ctx, theme: StoryTheme) {
  fillGround(ctx, theme, 0, H);
  if (theme.pattern) drawPattern(ctx, theme.pattern, 0);
}

/** A loose street grid, like the map the listings live on. Seeded, so always the same. */
function drawPattern(ctx: Ctx, color: string, fromY: number) {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, fromY, W, H - fromY);
  ctx.clip();
  ctx.strokeStyle = color;
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
  ctx.restore();
}

function drawPhotoGrid(
  ctx: Ctx,
  images: StoryImage[],
  theme: StoryTheme,
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
      ctx.fillStyle = theme.chipBg;
      ctx.fillRect(cx, cy, cw, ch);
    }
    ctx.restore();
  });
}

/** Like CSS object-fit: cover. */
function drawImageCover(
  ctx: Ctx,
  image: HTMLImageElement | ImageBitmap,
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
