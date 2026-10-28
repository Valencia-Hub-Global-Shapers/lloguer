/**
 * Flat illustration of a shared-flat room in the brand colors, used as the
 * photo of the landing demo story so it needs no stock picture.
 */
export function drawSampleRoom(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Wall and floor
  ctx.fillStyle = "#f2ede2";
  ctx.fillRect(0, 0, 1200, 900);
  ctx.fillStyle = "#dcc8a6";
  ctx.fillRect(0, 660, 1200, 240);
  ctx.fillStyle = "#cdb690";
  for (let x = -40; x < 1200; x += 150) ctx.fillRect(x, 660, 4, 240);

  // Window with the sky and a rooftop
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(110, 120, 380, 420);
  const sky = ctx.createLinearGradient(0, 140, 0, 520);
  sky.addColorStop(0, "#8fbfe8");
  sky.addColorStop(1, "#f6c99a");
  ctx.fillStyle = sky;
  ctx.fillRect(130, 140, 340, 380);
  ctx.fillStyle = "#e3b23c";
  ctx.beginPath();
  ctx.arc(390, 250, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9876a";
  ctx.fillRect(130, 430, 340, 90);
  ctx.fillStyle = "#b4704f";
  ctx.beginPath();
  ctx.moveTo(130, 430);
  ctx.lineTo(230, 380);
  ctx.lineTo(330, 430);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(292, 140, 16, 380);
  ctx.fillRect(130, 322, 340, 16);
  ctx.fillStyle = "#e4ddce";
  ctx.fillRect(90, 540, 420, 22);

  // Framed print
  ctx.fillStyle = "#1b1a17";
  ctx.fillRect(700, 150, 230, 170);
  ctx.fillStyle = "#faf7f0";
  ctx.fillRect(714, 164, 202, 142);
  ctx.fillStyle = "#d6521d";
  ctx.beginPath();
  ctx.arc(815, 235, 44, 0, Math.PI * 2);
  ctx.fill();

  // Bed
  ctx.fillStyle = "#04365f";
  ctx.fillRect(600, 430, 70, 330);
  ctx.fillStyle = "#054985";
  ctx.fillRect(640, 560, 520, 170);
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 680, 500, 170, 80, 26);
  ctx.fill();
  ctx.fillStyle = "#d6521d";
  roundRect(ctx, 820, 545, 340, 110, 14);
  ctx.fill();
  ctx.fillStyle = "#b4400e";
  ctx.fillRect(820, 600, 340, 10);
  ctx.fillStyle = "#04365f";
  ctx.fillRect(650, 730, 24, 50);
  ctx.fillRect(1120, 730, 24, 50);

  // Plant
  ctx.fillStyle = "#3f7a4f";
  for (const [x, y, r] of [
    [205, 560, 58],
    [150, 600, 48],
    [262, 605, 50],
    [205, 625, 44],
  ]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#b4400e";
  ctx.beginPath();
  ctx.moveTo(140, 640);
  ctx.lineTo(270, 640);
  ctx.lineTo(250, 780);
  ctx.lineTo(160, 780);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
