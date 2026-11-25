// Pâtisserie Lumière — the order board.
// Tickets arrive on the brass rail, each with a patience bar that drains
// while the guest waits. Serve in time for a tip; let one burn down to
// nothing and the guest walks out — a strike against the house.

import { RECIPES } from './recipes.js';

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = [];       // { id, recipe, patienceLeft, patienceMax }
    this.nextId = 1;
    this.spawnTimer = 0;     // seconds until the next guest arrives
    this.maxOpen = 3;        // rail slots; the rush raises this to 4
  }

  pickRecipe() {
    const pool = RECIPES.slice(0, this.recipePoolSize);
    return pool[Math.floor(this.rng() * pool.length)];
  }

  get recipePoolSize() {
    return this._poolSize || 3;
  }

  set recipePoolSize(n) {
    this._poolSize = Math.min(RECIPES.length, Math.max(2, n));
  }

  addTicket(recipe) {
    const r = recipe || this.pickRecipe();
    const ticket = {
      id: this.nextId++,
      recipe: r,
      patienceMax: r.patience,
      patienceLeft: r.patience,
    };
    this.tickets.push(ticket);
    return ticket;
  }

  // Force the board into a known state (screenshot scenes, opening rush).
  seedBoard(recipeIds, patienceFractions) {
    this.tickets = [];
    this.nextId = 1;
    recipeIds.forEach((id, i) => {
      const recipe = RECIPES.find((r) => r.id === id);
      const t = this.addTicket(recipe);
      const f = patienceFractions && patienceFractions[i] != null ? patienceFractions[i] : 1;
      t.patienceLeft = Math.round(t.patienceMax * f);
    });
  }

  update(dt, pressure) {
    const expired = [];
    for (const t of this.tickets) {
      t.patienceLeft -= dt * pressure.patienceDrain;
      if (t.patienceLeft <= 0) expired.push(t);
    }
    if (expired.length) {
      this.tickets = this.tickets.filter((t) => t.patienceLeft > 0);
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.tickets.length < this.maxOpen) {
      this.addTicket();
      this.spawnTimer = pressure.spawnGap * (0.75 + this.rng() * 0.5);
    }
    return expired;
  }

  // Find the ticket a finished plate satisfies, if any.
  matchTicket(plate) {
    for (const t of this.tickets) {
      if (plateMatchesRecipe(plate, t.recipe)) return t;
    }
    return null;
  }

  removeTicket(ticket) {
    this.tickets = this.tickets.filter((t) => t !== ticket);
  }

  patienceFraction(ticket) {
    return Math.max(0, ticket.patienceLeft / ticket.patienceMax);
  }
}

// A plate matches when its baked layers equal the recipe, bottom-first,
// and its piping finish is the one the ticket asks for.
export function plateMatchesRecipe(plate, recipe) {
  if (!plate || plate.piping !== recipe.piping) return false;
  if (plate.layers.length !== recipe.layers.length) return false;
  for (let i = 0; i < recipe.layers.length; i++) {
    const layer = plate.layers[i];
    if (layer.id !== recipe.layers[i]) return false;
    if (layer.needsBake && !layer.baked) return false;
  }
  return true;
}
