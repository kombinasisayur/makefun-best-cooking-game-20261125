// Pâtisserie Lumière — the service loop.
// One shift in the atelier: tickets land on the brass rail, the pâtissier
// stacks layers in ticket order, bakes the sponge, pipes the finish and
// serves before patience runs dry. Every 45 seconds the room gets busier
// — patience drains faster, guests arrive sooner, grander cakes appear.

import { ingredientById, pipingById, recipeById } from './recipes.js';
import { OrderBoard } from './orders.js';
import { Oven, PipingBench } from './stations.js';
import { drawScene } from './render.js';
import { attachInput } from './input.js';

const SHIFT_SECONDS = 180;
const MAX_STRIKES = 3;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function freshPlate() {
  return { layers: [], piping: null };
}

function layerFrom(id) {
  const ing = ingredientById(id);
  return { id, needsBake: ing.needsBake, baked: false };
}

class Atelier {
  constructor(seed) {
    this.rng = mulberry32(seed);
    this.board = new OrderBoard(this.rng);
    this.oven = new Oven();
    this.pipingBench = new PipingBench();
    this.reset();
  }

  reset() {
    this.plate = freshPlate();
    this.passCake = null;
    this.clock = SHIFT_SECONDS;
    this.elapsed = 0;
    this.coins = 0;
    this.score = 0;
    this.strikes = 0;
    this.served = 0;
    this.mode = 'play';
    this.message = 'First guests! Stack the ticket layers on the plate.';
    this.board.tickets = [];
    this.board.nextId = 1;
    this.board.spawnTimer = 2.5;
    this.board.addTicket(recipeById('fraisier'));
    this.board.addTicket(recipeById('millefeuille'));
  }

  pressure() {
    const level = Math.floor(this.elapsed / 45);
    return {
      level,
      patienceDrain: 1 + level * 0.14,
      spawnGap: Math.max(6, 15 - level * 1.6),
    };
  }

  syncPressure() {
    const p = this.pressure();
    this.board.recipePoolSize = 3 + (p.level >= 1 ? 1 : 0) + (p.level >= 3 ? 1 : 0);
    this.board.maxOpen = p.level >= 2 ? 4 : 3;
    return p;
  }

  addLayer(id) {
    if (this.mode !== 'play') return;
    if (this.oven.busy || this.pipingBench.busy) {
      this.message = 'Hands busy — wait for the station timer.';
      return;
    }
    if (this.plate.layers.length >= 6) {
      this.message = 'The plate can hold six layers at most. Serve or bin it.';
      return;
    }
    this.plate.layers.push(layerFrom(id));
    const ing = ingredientById(id);
    this.message = ing.needsBake
      ? ing.name + ' stacked — it must go through the OVEN before serving.'
      : ing.name + ' stacked on the plate.';
  }

  bake() {
    if (this.mode !== 'play') return;
    if (this.oven.start(this.plate)) {
      this.message = 'Into the oven — watch the timer bar.';
    } else if (!this.oven.hasRawSponge(this.plate)) {
      this.message = 'Nothing raw on the plate — the oven can wait.';
    }
  }

  pipe(styleId) {
    if (this.mode !== 'play') return;
    if (this.pipingBench.start(this.plate, styleId)) {
      this.message = 'Piping ' + pipingById(styleId).name + ' — steady hands…';
    } else if (!this.plate.layers.length) {
      this.message = 'Pipe onto a cake, not an empty plate.';
    } else if (this.plate.piping) {
      this.message = 'Already piped with ' + this.plate.piping + '.';
    }
  }

  serve() {
    if (this.mode !== 'play') return;
    const ticket = this.board.matchTicket(this.plate);
    if (!ticket) {
      this.message = this.plate.layers.length
        ? 'No open ticket matches this plate — check layers, bake and piping.'
        : 'The plate is empty; there is nothing to serve.';
      return;
    }
    // Tip scales with the cake's price and the patience left on the rail:
    // a grand Opéra served instantly tips far better than a rushed Fraisier.
    const tip = Math.round(ticket.recipe.price * 0.3 * this.board.patienceFraction(ticket));
    this.coins += ticket.recipe.price + tip;
    this.score += ticket.recipe.price * 10 + tip * 5;
    this.served += 1;
    this.passCake = {
      name: ticket.recipe.name,
      layers: this.plate.layers.map((l) => ({ ...l })),
      piping: this.plate.piping,
    };
    this.board.removeTicket(ticket);
    this.plate = freshPlate();
    this.message = 'Served ' + ticket.recipe.name + '! +' + (ticket.recipe.price + tip) + ' écus (tip ' + tip + ').';
  }

  scrap() {
    if (this.mode !== 'play') return;
    if (!this.plate.layers.length && !this.plate.piping) return;
    this.plate = freshPlate();
    this.message = 'Plate scrapped. A clean plate, a clear head.';
  }

  nextNeeded() {
    const ticket = this.board.tickets[0];
    if (!ticket) return null;
    const want = ticket.recipe.layers;
    for (let i = 0; i < want.length; i++) {
      const have = this.plate.layers[i];
      if (!have || have.id !== want[i]) {
        return { ticketId: ticket.id, label: ingredientById(want[i]).name + (ingredientById(want[i]).needsBake ? ' (then BAKE)' : '') };
      }
      if (have.needsBake && !have.baked) {
        return { ticketId: ticket.id, label: 'BAKE the sponge (B)' };
      }
    }
    if (this.plate.layers.length > want.length) {
      return { ticketId: ticket.id, label: 'too many layers — BIN and restart' };
    }
    if (!this.plate.piping) {
      return { ticketId: ticket.id, label: 'pipe ' + ticket.recipe.piping + ' (' + pipingById(ticket.recipe.piping).key + ')' };
    }
    if (this.plate.piping !== ticket.recipe.piping) {
      return { ticketId: ticket.id, label: 'wrong piping — ticket wants ' + ticket.recipe.piping };
    }
    return { ticketId: ticket.id, label: 'SERVE it (Space)' };
  }

  update(dt) {
    if (this.mode !== 'play') return;
    this.elapsed += dt;
    this.clock -= dt;
    const p = this.syncPressure();
    if (this.oven.update(dt)) this.message = 'Ding! The sponge is baked golden.';
    if (this.pipingBench.update(dt)) this.message = 'Piping done — the cake is dressed.';
    const expired = this.board.update(dt, p);
    for (const t of expired) {
      this.strikes += 1;
      this.message = 'Ticket #' + t.id + ' walked out! Strike ' + this.strikes + ' of ' + MAX_STRIKES + '.';
    }
    if (this.strikes >= MAX_STRIKES || this.clock <= 0) {
      this.mode = 'over';
      this.clock = Math.max(0, this.clock);
    }
  }

  view() {
    return {
      board: this.board,
      plate: this.plate,
      passCake: this.passCake,
      oven: this.oven,
      pipingBench: this.pipingBench,
      clock: this.clock,
      coins: this.coins,
      score: this.score,
      strikes: this.strikes,
      served: this.served,
      mode: this.mode,
      message: this.message,
      nextNeeded: this.mode === 'play' ? this.nextNeeded() : null,
      banner: false,
    };
  }
}

// ---- deterministic screenshot scenes -------------------------------------
// ?shot=cover|rush|serve&seed=N freezes one composed frame: order rail
// full, ingredients out, a cake mid-assembly, timers visible, and a
// finished cake resting on the pass.

function buildShotScene(kind, seed) {
  const game = new Atelier(seed);
  const L = (id, baked) => ({ id, needsBake: ingredientById(id).needsBake, baked: !!baked });

  if (kind === 'cover') {
    game.board.seedBoard(['fraisier', 'chocolat'], [0.82, 0.55]);
    game.plate = { layers: [L('sponge', true), L('vanilla'), L('strawberry')], piping: null };
    game.passCake = { name: 'Chocolat Royal', layers: [L('sponge', true), L('ganache'), L('sponge', true), L('ganache'), L('strawberry')], piping: 'rosettes' };
    game.oven.busy = true; game.oven.timeLeft = 2.3; game.oven.plate = game.plate;
    game.clock = 152; game.coins = 128; game.score = 340; game.served = 3;
    game.message = 'Welcome to the atelier — the morning rush is coming.';
  } else if (kind === 'rush') {
    game.board.seedBoard(['opera', 'myrtille', 'millefeuille'], [0.34, 0.58, 0.21]);
    game.plate = { layers: [L('sponge', true), L('caramel'), L('ganache'), L('sponge', false)], piping: null };
    game.passCake = { name: 'Fraisier Classique', layers: [L('sponge', true), L('vanilla'), L('strawberry'), L('sponge', true)], piping: 'rosettes' };
    game.pipingBench.busy = true; game.pipingBench.timeLeft = 1.5; game.pipingBench.styleId = 'zigzag'; game.pipingBench.plate = game.plate;
    game.clock = 47; game.coins = 264; game.score = 815; game.served = 6; game.strikes = 1;
    game.message = 'RUSH! Three tickets, one raw sponge — bake it, pipe zigzag, serve!';
  } else { // serve
    game.board.seedBoard(['myrtille', 'fraisier'], [0.72, 0.9]);
    game.plate = { layers: [L('sponge', true), L('blueberry'), L('vanilla'), L('sponge', true), L('meringue')], piping: 'swirls' };
    game.passCake = { name: 'Fraisier Classique', layers: [L('sponge', true), L('vanilla'), L('strawberry'), L('sponge', true)], piping: 'rosettes' };
    game.clock = 96; game.coins = 342; game.score = 1090; game.served = 8;
    game.message = 'Gâteau Myrtille is dressed and ready — SERVE it to ticket #1!';
  }
  const view = game.view();
  view.banner = kind === 'cover';
  return view;
}

// ---- boot -----------------------------------------------------------------

const canvas = document.getElementById('atelier');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7) || 7;

if (shot) {
  drawScene(ctx, buildShotScene(shot, seed));
} else {
  const game = new Atelier(seed * 7919 + 13);
  attachInput(canvas, {
    addLayer: (id) => game.addLayer(id),
    bake: () => game.bake(),
    pipe: (id) => game.pipe(id),
    serve: () => game.serve(),
    scrap: () => game.scrap(),
    anyClick: () => {
      if (game.mode === 'over') { game.reset(); return true; }
      return false;
    },
    anyKey: (key) => {
      if (game.mode === 'over' && (key === 'r' || key === 'R')) { game.reset(); return true; }
      return false;
    },
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    game.update(dt);
    drawScene(ctx, game.view());
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
