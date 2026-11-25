// Pâtisserie Lumière — the menu book.
// Every cake is an ordered stack of layers, an optional oven pass for its
// sponge, and one piping finish. Ingredients live on the marble counter;
// a layer only counts when it lands on the plate in the recipe's order.

export const INGREDIENTS = [
  { id: 'sponge',    name: 'Génoise Sponge',  key: '1', color: '#f3d189', edge: '#d9a94f', needsBake: true },
  { id: 'vanilla',   name: 'Vanilla Crème',   key: '2', color: '#fdf3d8', edge: '#e3cf9e', needsBake: false },
  { id: 'strawberry',name: 'Strawberry',      key: '3', color: '#e5484d', edge: '#b02a30', needsBake: false },
  { id: 'ganache',   name: 'Choc Ganache',    key: '4', color: '#5b3427', edge: '#3c2015', needsBake: false },
  { id: 'blueberry', name: 'Blueberry',       key: '5', color: '#4b5fa5', edge: '#2f3f74', needsBake: false },
  { id: 'pistachio', name: 'Pistachio Crème', key: '6', color: '#b7cf8e', edge: '#8cab5e', needsBake: false },
  { id: 'meringue',  name: 'Meringue Kiss',   key: '7', color: '#ffffff', edge: '#e8dcc8', needsBake: false },
  { id: 'caramel',   name: 'Salted Caramel',  key: '8', color: '#d98e32', edge: '#a8641c', needsBake: false },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id) || null;
}

// Piping finishes: the last flourish, done at the piping bench.
export const PIPING_STYLES = [
  { id: 'rosettes', name: 'Rosettes', key: 'Q' },
  { id: 'zigzag',   name: 'Zigzag',   key: 'W' },
  { id: 'swirls',   name: 'Swirls',   key: 'E' },
];

export function pipingById(id) {
  return PIPING_STYLES.find((p) => p.id === id) || null;
}

// The five house cakes. layers are listed bottom-first, exactly as the
// pâtissier must stack them on the plate.
export const RECIPES = [
  {
    id: 'fraisier', name: 'Fraisier Classique', price: 42, patience: 95,
    layers: ['sponge', 'vanilla', 'strawberry', 'sponge'], piping: 'rosettes',
    note: 'The strawberry wedding favourite.',
  },
  {
    id: 'millefeuille', name: 'Mille-Feuille Lumière', price: 48, patience: 100,
    layers: ['sponge', 'pistachio', 'sponge', 'caramel'], piping: 'zigzag',
    note: 'Crisp layers, green-gold heart.',
  },
  {
    id: 'myrtille', name: 'Gâteau Myrtille', price: 52, patience: 105,
    layers: ['sponge', 'blueberry', 'vanilla', 'sponge', 'meringue'], piping: 'swirls',
    note: 'Blueberry dusk under a meringue cloud.',
  },
  {
    id: 'chocolat', name: 'Chocolat Royal', price: 56, patience: 110,
    layers: ['sponge', 'ganache', 'sponge', 'ganache', 'strawberry'], piping: 'rosettes',
    note: 'Double ganache, one bright berry crown.',
  },
  {
    id: 'opera', name: 'Opéra Lumière', price: 64, patience: 120,
    layers: ['sponge', 'caramel', 'ganache', 'sponge', 'pistachio', 'meringue'], piping: 'zigzag',
    note: 'Six layers, the full evening performance.',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}
