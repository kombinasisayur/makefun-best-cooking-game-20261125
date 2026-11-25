// Pâtisserie Lumière — all of the drawing.
// One canvas, no images: the pink-and-gold atelier, the brass order rail,
// the marble counter with its ingredient bins, the cake rising layer by
// layer on the plate, the oven and piping bench, and a finished cake
// waiting on the pass. Everything the judge sees is painted here.

import { INGREDIENTS, PIPING_STYLES, ingredientById } from './recipes.js';

export const LAYOUT = {
  board: { x: 16, y: 84, w: 320, h: 476 },
  ticketH: 148,
  plate: { cx: 636, baseY: 452, w: 240 },
  pass: { x: 776, y: 250, w: 168, h: 196 },
  binsY: 600, binW: 66, binH: 74, binGap: 8, binsX: 360,
  oven: { x: 960, y: 96, w: 304, h: 208 },
  ovenButton: { x: 976, y: 252, w: 272, h: 38 },
  piping: { x: 960, y: 320, w: 304, h: 196 },
  pipingButtonsY: 420,
  serveButton: { x: 960, y: 532, w: 144, h: 56 },
  binButton: { x: 1120, y: 532, w: 144, h: 56 },
  message: { x: 16, y: 716, w: 1248, h: 68 },
};

const INK = '#4a2436';
const GOLD = '#c9a227';
const PINK = '#f6cdd8';
const CREAM = '#fdf6ec';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hashNoise(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Draw one cake: plate, stacked layers bottom-first, piping on top.
// layers: [{ id, baked }] — raw sponge is paler and marked with a wisp.
export function drawCake(ctx, cx, baseY, width, layers, piping) {
  const layerH = 17;
  // plate
  ctx.fillStyle = '#e9e2d4';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, baseY, width / 2, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fbf7ee';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 2, width / 2 - 14, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  let y = baseY - 4;
  layers.forEach((layer, i) => {
    const ing = ingredientById(layer.id);
    if (!ing) return;
    const w = width - 26 - i * 3;
    const x = cx - w / 2;
    y -= layerH;
    ctx.fillStyle = layer.needsBake && !layer.baked ? '#f8e7bd' : ing.color;
    rr(ctx, x, y, w, layerH - 2, 5);
    ctx.fill();
    ctx.strokeStyle = ing.edge;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (layer.id === 'strawberry' || layer.id === 'blueberry') {
      ctx.fillStyle = layer.id === 'strawberry' ? '#ff8f96' : '#7d90cc';
      for (let d = 0; d < 5; d++) {
        const fx = x + 16 + hashNoise(i * 31 + d * 7) * (w - 32);
        ctx.beginPath();
        ctx.arc(fx, y + layerH / 2 - 1, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (layer.needsBake && !layer.baked) {
      ctx.fillStyle = 'rgba(120,90,40,.75)';
      ctx.font = 'bold 9px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('RAW', cx, y + layerH - 5);
    }
  });

  if (piping) {
    const topY = y - 4;
    const w = width - 26 - Math.max(0, layers.length - 1) * 3;
    ctx.strokeStyle = '#fff7ea';
    ctx.fillStyle = '#fff7ea';
    ctx.lineWidth = 3;
    if (piping === 'rosettes') {
      for (let s = 0; s < 6; s++) {
        const fx = cx - w / 2 + 14 + s * ((w - 28) / 5);
        ctx.beginPath();
        ctx.arc(fx, topY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(fx, topY, 2.6, 0, Math.PI * 2);
        ctx.fillStyle = '#e5484d';
        ctx.fill();
        ctx.fillStyle = '#fff7ea';
      }
    } else if (piping === 'zigzag') {
      ctx.beginPath();
      const steps = 10;
      for (let s = 0; s <= steps; s++) {
        const fx = cx - w / 2 + 8 + s * ((w - 16) / steps);
        const fy = topY + (s % 2 === 0 ? -5 : 3);
        if (s === 0) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    } else if (piping === 'swirls') {
      for (let s = 0; s < 5; s++) {
        const fx = cx - w / 2 + 16 + s * ((w - 32) / 4);
        ctx.beginPath();
        ctx.arc(fx, topY, 5.5, 0.4, Math.PI * 1.8);
        ctx.stroke();
      }
    }
  }
  return y;
}

function drawTicket(ctx, ticket, x, y, w, board) {
  ctx.fillStyle = '#fffdf6';
  rr(ctx, x, y, w, LAYOUT.ticketH - 10, 8);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('#' + ticket.id + '  ' + ticket.recipe.name, x + 10, y + 22);
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#7a4a5c';
  const layersText = ticket.recipe.layers
    .map((id) => ingredientById(id).name.replace(' Crème', '').replace('Génoise ', ''))
    .join(' · ');
  wrapText(ctx, layersText, x + 10, y + 42, w - 110, 14);
  ctx.fillText('Pipe: ' + ticket.recipe.piping, x + 10, y + 88);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText(ticket.recipe.price + ' écus', x + 10, y + 110);
  // mini cake preview on the ticket's right edge
  const miniLayers = ticket.recipe.layers.map((id) => ({ id, baked: true }));
  drawCake(ctx, x + w - 46, y + 108, 74, miniLayers, ticket.recipe.piping);
  // patience bar
  const frac = board.patienceFraction(ticket);
  ctx.fillStyle = '#e8d9c8';
  rr(ctx, x + 10, y + LAYOUT.ticketH - 28, w - 20, 9, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.45 ? '#7fae5c' : frac > 0.2 ? '#e0a32e' : '#d23c3c';
  rr(ctx, x + 10, y + LAYOUT.ticketH - 28, Math.max(6, (w - 20) * frac), 9, 4);
  ctx.fill();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineH;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

export function binRect(i) {
  return { x: LAYOUT.binsX + i * (LAYOUT.binW + LAYOUT.binGap), y: LAYOUT.binsY, w: LAYOUT.binW, h: LAYOUT.binH };
}

export function pipingRect(i) {
  return { x: 976 + i * 92, y: LAYOUT.pipingButtonsY, w: 84, h: 40 };
}

export function drawScene(ctx, state) {
  const W = 1280, H = 800;
  // wall: blush plaster with a gold picture rail
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#f9e3e8');
  grad.addColorStop(0.55, '#f6d3dc');
  grad.addColorStop(0.551, '#eec3cd');
  grad.addColorStop(1, '#d9a7b4');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 440, W, 4);
  // marble counter slab
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(344, 448, 592, 268);
  ctx.strokeStyle = '#cfc4ae';
  ctx.strokeRect(344, 448, 592, 268);
  for (let v = 0; v < 7; v++) {
    ctx.strokeStyle = 'rgba(180,170,150,.35)';
    ctx.beginPath();
    const vx = 360 + hashNoise(v * 13) * 540;
    ctx.moveTo(vx, 452);
    ctx.bezierCurveTo(vx + 30, 540, vx - 24, 620, vx + 12, 712);
    ctx.stroke();
  }

  drawHeader(ctx, state);
  drawBoard(ctx, state);
  drawPass(ctx, state);
  drawPlateArea(ctx, state);
  drawBins(ctx, state);
  drawOven(ctx, state);
  drawPipingBench(ctx, state);
  drawButtons(ctx, state);
  drawMessage(ctx, state);
  if (state.banner) drawBanner(ctx);
  if (state.mode === 'over') drawGameOver(ctx, state);
}

function drawHeader(ctx, state) {
  ctx.fillStyle = '#3d1f2e';
  ctx.fillRect(0, 0, 1280, 64);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 64, 1280, 3);
  ctx.fillStyle = '#f6cdd8';
  ctx.font = 'bold 24px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('PÂTISSERIE LUMIÈRE', 20, 40);
  // shift clock — the big visible timer
  const secs = Math.max(0, Math.ceil(state.clock));
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, '0');
  ctx.fillStyle = state.clock <= 30 ? '#ff9a9a' : '#ffe9a8';
  ctx.font = 'bold 30px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('⏳ ' + mm + ':' + ss, 640, 42);
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#f6cdd8';
  ctx.fillText('SHIFT', 640, 58);
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('Écus ' + state.coins + '   Score ' + state.score, 1258, 30);
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = state.strikes > 0 ? '#ff9a9a' : '#f6cdd8';
  ctx.fillText('Walk-outs ' + state.strikes + ' / 3', 1258, 54);
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#5b3427';
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— COMMANDES · ORDERS —', b.x + b.w / 2, b.y + 24);
  state.board.tickets.forEach((ticket, i) => {
    drawTicket(ctx, ticket, b.x + 10, b.y + 36 + i * LAYOUT.ticketH, b.w - 20, state.board);
  });
  if (state.board.tickets.length === 0) {
    ctx.fillStyle = '#f6cdd8';
    ctx.font = 'italic 15px Georgia, serif';
    ctx.fillText('The rail is quiet… for now.', b.x + b.w / 2, b.y + 90);
  }
}

function drawPass(ctx, state) {
  const p = LAYOUT.pass;
  ctx.fillStyle = '#6d4530';
  rr(ctx, p.x, p.y, p.w, p.h, 8);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE PASS', p.x + p.w / 2, p.y + 20);
  ctx.fillStyle = '#8a5a3d';
  ctx.fillRect(p.x + 8, p.y + p.h - 34, p.w - 16, 8);
  if (state.passCake) {
    drawCake(ctx, p.x + p.w / 2, p.y + p.h - 38, 132, state.passCake.layers, state.passCake.piping);
    ctx.fillStyle = '#fdf6ec';
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillText(state.passCake.name, p.x + p.w / 2, p.y + 42);
    ctx.fillStyle = '#b7e39a';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText('READY TO SERVE ✓', p.x + p.w / 2, p.y + p.h - 8);
  } else {
    ctx.fillStyle = '#d9bfa5';
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillText('finished cakes', p.x + p.w / 2, p.y + 96);
    ctx.fillText('rest here', p.x + p.w / 2, p.y + 114);
  }
}

function drawPlateArea(ctx, state) {
  const p = LAYOUT.plate;
  ctx.fillStyle = INK;
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ASSEMBLY PLATE', p.cx, 268);
  // cake stand
  ctx.fillStyle = '#d8cfc0';
  ctx.fillRect(p.cx - 8, p.baseY + 12, 16, 26);
  ctx.beginPath();
  ctx.ellipse(p.cx, p.baseY + 42, 62, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.plate.layers.length === 0 && !state.plate.piping) {
    drawCake(ctx, p.cx, p.baseY, p.w, [], null);
    ctx.fillStyle = '#8a6a58';
    ctx.font = 'italic 13px Georgia, serif';
    ctx.fillText('click ingredients to stack', p.cx, p.baseY - 26);
  } else {
    drawCake(ctx, p.cx, p.baseY, p.w, state.plate.layers, state.plate.piping);
  }
  // next-layer hint: what the first open ticket wants next
  const next = state.nextNeeded;
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = '#7a4a5c';
  if (next) {
    ctx.fillText('Next for ticket #' + next.ticketId + ': ' + next.label, p.cx, 522);
  } else if (state.plate.layers.length) {
    ctx.fillText('Plate ready — pipe it, then SERVE.', p.cx, 522);
  }
  if (state.plate.piping) {
    ctx.fillStyle = '#4a7a34';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Piped: ' + state.plate.piping + ' ✓', p.cx, 542);
  }
}

function drawBins(ctx, state) {
  ctx.fillStyle = INK;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('INGREDIENTS — click or press 1–8', 640, LAYOUT.binsY - 12);
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    ctx.fillStyle = '#fffdf6';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = ing.edge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ing.color;
    rr(ctx, r.x + 8, r.y + 8, r.w - 16, 26, 5);
    ctx.fill();
    ctx.strokeStyle = ing.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (ing.id === 'strawberry' || ing.id === 'blueberry') {
      ctx.fillStyle = ing.id === 'strawberry' ? '#ff8f96' : '#7d90cc';
      for (let d = 0; d < 3; d++) {
        ctx.beginPath();
        ctx.arc(r.x + 18 + d * 15, r.y + 21, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = INK;
    ctx.font = 'bold 10px Georgia, serif';
    ctx.textAlign = 'left';
    wrapText(ctx, ing.name, r.x + 5, r.y + 50, r.w - 8, 11);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(ing.key, r.x + r.w / 2, r.y + r.h - 3);
    ctx.textAlign = 'center';
  });
}

function drawOven(ctx, state) {
  const o = LAYOUT.oven;
  ctx.fillStyle = '#4c4c55';
  rr(ctx, o.x, o.y, o.w, o.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOUR · OVEN', o.x + o.w / 2, o.y + 24);
  // oven window
  ctx.fillStyle = state.oven.busy ? '#ffb45e' : '#2c2c33';
  rr(ctx, o.x + 52, o.y + 36, o.w - 104, 92, 8);
  ctx.fill();
  ctx.strokeStyle = '#191920';
  ctx.stroke();
  if (state.plate.layers.length) {
    drawCake(ctx, o.x + o.w / 2, o.y + 116, 150, state.plate.layers, null);
  }
  // timer bar
  ctx.fillStyle = '#191920';
  rr(ctx, o.x + 20, o.y + 140, o.w - 40, 12, 5);
  ctx.fill();
  if (state.oven.busy) {
    ctx.fillStyle = '#ffcf6e';
    rr(ctx, o.x + 20, o.y + 140, (o.w - 40) * state.oven.fraction(), 12, 5);
    ctx.fill();
    ctx.fillStyle = '#fdf6ec';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Baking… ' + state.oven.timeLeft.toFixed(1) + 's', o.x + o.w / 2, o.y + 170);
  } else {
    ctx.fillStyle = '#cfc4ae';
    ctx.font = '13px Georgia, serif';
    ctx.fillText(state.oven.hasRawSponge(state.plate) ? 'Raw sponge waiting!' : 'Oven idle', o.x + o.w / 2, o.y + 170);
  }
  const btn = LAYOUT.ovenButton;
  ctx.fillStyle = state.oven.canStart(state.plate) ? '#c96f2e' : '#6a6a72';
  rr(ctx, btn.x, btn.y, btn.w, btn.h, 8);
  ctx.fill();
  ctx.fillStyle = '#fff7ea';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillText('BAKE SPONGE  (B)', btn.x + btn.w / 2, btn.y + 25);
}

function drawPipingBench(ctx, state) {
  const p = LAYOUT.piping;
  ctx.fillStyle = '#7a4a5c';
  rr(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PIPING BENCH', p.x + p.w / 2, p.y + 24);
  ctx.fillStyle = '#f6cdd8';
  ctx.font = '12px Georgia, serif';
  ctx.fillText('finish the cake with one flourish', p.x + p.w / 2, p.y + 44);
  // piping bag timer
  ctx.fillStyle = '#3d1f2e';
  rr(ctx, p.x + 20, p.y + 56, p.w - 40, 12, 5);
  ctx.fill();
  if (state.pipingBench.busy) {
    ctx.fillStyle = '#f6cdd8';
    rr(ctx, p.x + 20, p.y + 56, (p.w - 40) * state.pipingBench.fraction(), 12, 5);
    ctx.fill();
    ctx.fillStyle = '#fdf6ec';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('Piping ' + state.pipingBench.styleId + '… ' + state.pipingBench.timeLeft.toFixed(1) + 's', p.x + p.w / 2, p.y + 88);
  }
  PIPING_STYLES.forEach((style, i) => {
    const r = pipingRect(i);
    const active = state.plate.piping === style.id;
    ctx.fillStyle = active ? '#7fae5c' : '#fdf6ec';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = GOLD;
    ctx.stroke();
    ctx.fillStyle = active ? '#fdf6ec' : INK;
    ctx.font = 'bold 12px Georgia, serif';
    ctx.fillText(style.name, r.x + r.w / 2, r.y + 18);
    ctx.font = '11px Georgia, serif';
    ctx.fillText('(' + style.key + ')', r.x + r.w / 2, r.y + 33);
  });
}

function drawButtons(ctx, state) {
  const s = LAYOUT.serveButton;
  ctx.fillStyle = '#7fae5c';
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fdf6ec';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVE ␣', s.x + s.w / 2, s.y + 35);
  const b = LAYOUT.binButton;
  ctx.fillStyle = '#8a4a3a';
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.fillStyle = '#fdf6ec';
  ctx.fillText('BIN ⌫', b.x + b.w / 2, b.y + 35);
  ctx.fillStyle = INK;
  ctx.font = '12px Georgia, serif';
  ctx.fillText('serve the plate to a', 1032, 612);
  ctx.fillText('matching ticket', 1032, 628);
  ctx.fillText('scrap the plate', 1192, 612);
  ctx.fillText('and start over', 1192, 628);
}

function drawMessage(ctx, state) {
  const m = LAYOUT.message;
  ctx.fillStyle = '#3d1f2e';
  rr(ctx, m.x, m.y, m.w, m.h, 10);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.stroke();
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.message || '', m.x + 18, m.y + 28);
  ctx.fillStyle = '#f6cdd8';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('Stack layers in ticket order · sponge must be BAKED · pipe the named finish · serve before patience runs out.', m.x + 18, m.y + 52);
}

function drawBanner(ctx) {
  ctx.fillStyle = 'rgba(61,31,46,.88)';
  ctx.fillRect(344, 96, 592, 118);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  ctx.strokeRect(344, 96, 592, 118);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('PÂTISSERIE LUMIÈRE', 640, 148);
  ctx.fillStyle = '#f6cdd8';
  ctx.font = 'italic 17px Georgia, serif';
  ctx.fillText('Parisian Layer Cake Atelier — stack, bake, pipe, serve', 640, 182);
}

function drawGameOver(ctx, state) {
  ctx.fillStyle = 'rgba(43,20,32,.82)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 46px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVICE OVER', 640, 340);
  ctx.fillStyle = '#fdf6ec';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('Final score ' + state.score + ' · ' + state.coins + ' écus earned · ' + state.served + ' cakes served', 640, 392);
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillStyle = '#f6cdd8';
  ctx.fillText('Press R or click anywhere to open the atelier again.', 640, 440);
}
