// Pâtisserie Lumière — the two working stations.
// The oven bakes every raw génoise layer already stacked on the plate;
// the piping bench applies the finishing flourish. Both run on visible
// timers and refuse to start until there is real work waiting.

export const OVEN_SECONDS = 4;
export const PIPING_SECONDS = 3;

export class Oven {
  constructor() {
    this.busy = false;
    this.timeLeft = 0;
    this.total = OVEN_SECONDS;
  }

  hasRawSponge(plate) {
    return plate.layers.some((l) => l.needsBake && !l.baked);
  }

  canStart(plate) {
    return !this.busy && plate.layers.length > 0 && this.hasRawSponge(plate);
  }

  start(plate) {
    if (!this.canStart(plate)) return false;
    this.busy = true;
    this.timeLeft = this.total;
    this.plate = plate;
    return true;
  }

  update(dt) {
    if (!this.busy) return false;
    this.timeLeft -= dt;
    if (this.timeLeft > 0) return false;
    for (const layer of this.plate.layers) {
      if (layer.needsBake) layer.baked = true;
    }
    this.busy = false;
    this.plate = null;
    return true; // just finished
  }

  fraction() {
    return this.busy ? 1 - this.timeLeft / this.total : 0;
  }
}

export class PipingBench {
  constructor() {
    this.busy = false;
    this.timeLeft = 0;
    this.total = PIPING_SECONDS;
    this.styleId = null;
  }

  canStart(plate) {
    return !this.busy && plate.layers.length > 0 && !plate.piping;
  }

  start(plate, styleId) {
    if (!this.canStart(plate)) return false;
    this.busy = true;
    this.timeLeft = this.total;
    this.styleId = styleId;
    this.plate = plate;
    return true;
  }

  update(dt) {
    if (!this.busy) return false;
    this.timeLeft -= dt;
    if (this.timeLeft > 0) return false;
    this.plate.piping = this.styleId;
    this.busy = false;
    this.plate = null;
    this.styleId = null;
    return true; // just finished
  }

  fraction() {
    return this.busy ? 1 - this.timeLeft / this.total : 0;
  }
}
