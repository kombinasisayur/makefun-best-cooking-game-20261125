// Pâtisserie Lumière — hands on the counter.
// Mouse clicks land on ingredient bins, the oven button, the piping
// styles and the SERVE / BIN buttons; the keyboard mirrors every one of
// them so a fast pâtissier never has to reach for the mouse.

import { INGREDIENTS, PIPING_STYLES } from './recipes.js';
import { LAYOUT, binRect, pipingRect } from './render.js';

function inside(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

export function attachInput(canvas, actions) {
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) * (canvas.width / rect.width);
    const y = (ev.clientY - rect.top) * (canvas.height / rect.height);
    if (actions.anyClick && actions.anyClick()) return;
    for (let i = 0; i < INGREDIENTS.length; i++) {
      if (inside(x, y, binRect(i))) return actions.addLayer(INGREDIENTS[i].id);
    }
    if (inside(x, y, LAYOUT.ovenButton)) return actions.bake();
    for (let i = 0; i < PIPING_STYLES.length; i++) {
      if (inside(x, y, pipingRect(i))) return actions.pipe(PIPING_STYLES[i].id);
    }
    if (inside(x, y, LAYOUT.serveButton)) return actions.serve();
    if (inside(x, y, LAYOUT.binButton)) return actions.scrap();
  });

  window.addEventListener('keydown', (ev) => {
    if (actions.anyKey && actions.anyKey(ev.key)) {
      ev.preventDefault();
      return;
    }
    const ing = INGREDIENTS.find((i) => i.key === ev.key);
    if (ing) return actions.addLayer(ing.id);
    const style = PIPING_STYLES.find((p) => p.key.toLowerCase() === ev.key.toLowerCase());
    if (style) return actions.pipe(style.id);
    if (ev.key === 'b' || ev.key === 'B') return actions.bake();
    if (ev.key === ' ' || ev.key === 'Enter') {
      ev.preventDefault();
      return actions.serve();
    }
    if (ev.key === 'Backspace' || ev.key === 'Delete') {
      ev.preventDefault();
      return actions.scrap();
    }
  });
}
