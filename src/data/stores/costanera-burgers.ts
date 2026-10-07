import type { OptionGroup, Product, StoreSeed } from "@/lib/types";

// Costanera Burgers: hamburguesería de ejemplo en la costanera de Victoria, con
// fotos de ejemplo (Unsplash). Los pedidos llegan al mismo
// WhatsApp que Rotisería Alexis: para probar sin molestar, cambiá `whatsapp`.

const burgerOptions: OptionGroup[] = [
  {
    id: "extras",
    name: "Extras",
    min: 0,
    options: [
      { id: "pepinillos", name: "Pepinillos", price: 500 },
      { id: "cheddar", name: "Extra cheddar", price: 800, maxQty: 3 },
      { id: "bacon", name: "Extra bacon", price: 1200, maxQty: 3 },
      { id: "huevo", name: "Huevo frito", price: 700 },
    ],
  },
  {
    id: "papas",
    name: "Mejorá tus papas",
    min: 0,
    max: 1,
    options: [
      { id: "cheddar", name: "Papas con cheddar", price: 4000 },
      { id: "casa", name: "Papas de la casa", price: 4500 },
    ],
  },
  {
    id: "sin",
    name: "Sacale ingredientes",
    min: 0,
    options: [
      { id: "cebolla", name: "Sin cebolla", price: 0 },
      { id: "tomate", name: "Sin tomate", price: 0 },
      { id: "lechuga", name: "Sin lechuga", price: 0 },
    ],
  },
];

function burger(id: string, name: string, description: string, imageUrl: string, prices: number[]): Product {
  const sizes = ["Simple", "Doble", "Triple"];
  return {
    id,
    name,
    description,
    imageUrl,
    variants: prices.map((price, i) => ({ id: sizes[i].toLowerCase(), name: sizes[i], price })),
    optionGroups: burgerOptions,
  };
}

export const costaneraBurgers: StoreSeed = {
  business: {
    id: "biz_costanera_burgers",
    slug: "costanera-burgers",
    name: "Costanera Burgers",
    description: "Hamburguesas smash y papas, frente al río.",
    highlight: "Todas las burgers vienen con papas.",
    logoUrl: "/demo/logos/costanera-burgers.png",
    coverUrl: "/demo/hamburguesa-combo.jpg",
    whatsapp: "5493436617446",
    address: {
      street: "Av. Costanera",
      city: "Victoria",
      province: "Entre Ríos",
      lat: -32.62891,
      lng: -60.16575,
    },
    timezone: "America/Argentina/Buenos_Aires",
    schedule: {
      0: [{ open: "20:00", close: "00:30" }],
      1: [],
      2: [],
      3: [{ open: "20:00", close: "00:30" }],
      4: [{ open: "20:00", close: "00:30" }],
      5: [{ open: "20:00", close: "01:30" }],
      6: [{ open: "20:00", close: "01:30" }],
    },
    acceptOrdersWhenClosed: true,
    theme: { primary: "#f29100", accent: "#ffd43b" },
    delivery: {
      pickup: true,
      delivery: true,
      zones: [
        { id: "dentro-de-boulevard", name: "Dentro de boulevard", cost: 1000 },
        { id: "fuera-de-boulevard", name: "Fuera de boulevard", cost: 2000 },
        { id: "zona-rural", name: "Zona rural", cost: 3000 },
      ],
      minOrder: 8000,
    },
    payments: {
      cash: true,
      transfer: {
        cbu: "0000003100099999999902",
        alias: "COSTANERA.BURGERS",
        holder: "Costanera Burgers (demo)",
        bank: "Mercado Pago",
      },
      mixed: true,
    },
  },
  coupons: [
    { code: "BIENVENIDA", type: "percent", value: 10, active: true },
    { code: "FINDE2000", type: "fixed", value: 2000, minSubtotal: 15000, active: true },
  ],
  // Panel de prueba: admin@costaneraburgers.demo / demo1234
  admin: {
    email: "admin@costaneraburgers.demo",
    passwordHash:
      "scrypt$qPfViTmrQ6dX37p72rEYpQ$Hq1WOyEzU79jfwvd3UPApRVnfmzUI51VN7iAyoV1pMYcEHFZcinGN1UmMhgDoyJzBvBOqb-SI7w0AVE9686l5g",
  },
  menu: [
    {
      id: "ofertas",
      emoji: "🔥",
      name: "Ofertas",
      kind: "offers",
      imageUrl: "/demo/hamburguesa-combo.jpg",
      subcategories: [
        {
          id: "ofertas",
          name: "Ofertas",
          products: [
            {
              id: "combo-pareja",
              name: "Combo pareja",
              description: "Para dos, con las burgers dobles.",
              imageUrl: "/demo/hamburguesa-combo.jpg",
              price: 22900,
              featured: true,
              bundle: [
                { productId: "classic", variantId: "doble", qty: 2 },
                { productId: "papas-fritas", variantId: "grande", qty: 1 },
              ],
            },
            {
              id: "dos-smash",
              name: "2 Smash dobles",
              description: "Las más pedidas, para compartir.",
              imageUrl: "/demo/hamburguesa-smash.jpg",
              price: 19900,
              bundle: [{ productId: "smash", variantId: "doble", qty: 2 }],
            },
            {
              id: "combo-familiar",
              name: "Combo familiar",
              description: "Para 4: dos Cuarto de libra, dos Classic y papas de la casa.",
              imageUrl: "/demo/hamburguesa-cuarto.jpg",
              price: 34900,
              bundle: [
                { productId: "cuarto-de-libra", variantId: "simple", qty: 2 },
                { productId: "classic", variantId: "simple", qty: 2 },
                { productId: "papas-casa", variantId: "grande", qty: 1 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "hamburguesas",
      emoji: "🍔",
      name: "Hamburguesas",
      // Lo principal del local: se ve abierta apenas entrás.
      expanded: true,
      imageUrl: "/demo/hamburguesa-combo.jpg",
      subcategories: [
        {
          id: "hamburguesas",
          name: "Hamburguesas",
          products: [
            burger(
              "bacon-jam",
              "Bacon Jam",
              "Medallón de 120 g, cheddar, bacon jam casero y cebolla crispy.",
              "/demo/hamburguesa-bacon.jpg",
              [9000, 11500, 14500],
            ),
            burger(
              "classic",
              "Classic",
              "Medallón, cheddar, lechuga, tomate, cebolla y salsa de la casa.",
              "/demo/hamburguesa-clasica.jpg",
              [8000, 10000, 13000],
            ),
            burger(
              "cuarto-de-libra",
              "Cuarto de libra",
              "Medallón, doble cheddar, cebolla, pepinillos, ketchup y mostaza.",
              "/demo/hamburguesa-cuarto.jpg",
              [8500, 10500, 13500],
            ),
            burger(
              "deluxe",
              "Deluxe",
              "Medallón, cheddar, panceta, lechuga, tomate, cebolla morada y mayo de ajo.",
              "/demo/hamburguesa-deluxe.jpg",
              [9500, 11500, 14500],
            ),
            burger(
              "de-la-casa",
              "De la casa",
              "Medallón, provoleta, cebolla caramelizada, rúcula y salsa criolla.",
              "/demo/hamburguesa-casa.jpg",
              [9500, 12000, 15000],
            ),
            burger(
              "smash",
              "Smash",
              "Medallones smash bien dorados, cheddar, pepinillos y salsa smash.",
              "/demo/hamburguesa-smash.jpg",
              [9000, 11000, 13500],
            ),
          ],
        },
      ],
    },
    {
      id: "papas",
      emoji: "🍟",
      name: "Papas y ensaladas",
      imageUrl: "/demo/papas-cono.jpg",
      subcategories: [
        {
          id: "papas",
          name: "Papas y ensaladas",
          products: [
            {
              id: "papas-fritas",
              name: "Papas fritas",
              imageUrl: "/demo/papas-fritas.jpg",
              variants: [
                { id: "chica", name: "Chica", price: 3000 },
                { id: "grande", name: "Grande", price: 4500 },
              ],
            },
            {
              id: "papas-casa",
              name: "Papas de la casa",
              description: "Con ajo, perejil y parmesano.",
              imageUrl: "/demo/papas-casa.jpg",
              variants: [
                { id: "chica", name: "Chica", price: 4500 },
                { id: "grande", name: "Grande", price: 6500 },
              ],
            },
            {
              id: "ensalada-mixta",
              name: "Ensalada mixta",
              description: "Lechuga, tomate y cebolla.",
              imageUrl: "/demo/ensalada.jpg",
              price: 2800,
            },
          ],
        },
      ],
    },
    {
      id: "postres",
      emoji: "🍮",
      name: "Postres",
      imageUrl: "/demo/postre.jpg",
      subcategories: [
        {
          id: "postres",
          name: "Postres",
          products: [
            {
              id: "postre-del-dia",
              name: "Postre del día",
              description: "Preguntanos por WhatsApp cuál es el de hoy.",
              imageUrl: "/demo/postre.jpg",
              price: 3500,
            },
          ],
        },
      ],
    },
  ],
};
