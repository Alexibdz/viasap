import type { OptionGroup, Product, StoreSeed } from "@/lib/types";

// Tienda de ejemplo (ficticia). El número de WhatsApp es un placeholder inválido:
// reemplazalo por el tuyo para probar el envío de pedidos.

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

const sauces: OptionGroup = {
  id: "salsas",
  name: "Salsas",
  min: 1,
  max: 2,
  options: [
    { id: "barbacoa", name: "Barbacoa", price: 0 },
    { id: "ketchup", name: "Ketchup", price: 0 },
    { id: "mostaza-miel", name: "Mostaza y miel", price: 0 },
    { id: "alioli", name: "Alioli", price: 0 },
    { id: "cheddar", name: "Cheddar", price: 600 },
  ],
};

function burger(
  id: string,
  name: string,
  description: string,
  imageUrl: string,
  prices: number[],
  featured = false,
): Product {
  const sizes = ["Simple", "Doble", "Triple"];
  return {
    id,
    name,
    description,
    imageUrl,
    featured,
    variants: prices.map((price, i) => ({ id: sizes[i].toLowerCase(), name: sizes[i], price })),
    optionGroups: burgerOptions,
  };
}

export const dobleQueso: StoreSeed = {
  business: {
    id: "biz_doble_queso",
    slug: "doble-queso",
    name: "Doble Queso Burgers",
    description: "Hamburguesas smash, papas y pollo crispy. Todas las burgers vienen con papas.",
    logoUrl: "/demo/logos/doble-queso.svg",
    coverUrl: "/demo/hamburguesa-combo.jpg",
    whatsapp: "5493436000000",
    instagram: "doblequeso.demo",
    address: {
      street: "Sarmiento 450",
      city: "Victoria",
      province: "Entre Ríos",
      lat: -32.621,
      lng: -60.1581,
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
    theme: { primary: "#e8590c", accent: "#ffd43b" },
    delivery: {
      pickup: true,
      delivery: true,
      zones: [
        { upToKm: 1.5, cost: 1000 },
        { upToKm: 3, cost: 1500 },
        { upToKm: 5, cost: 2200 },
      ],
      minOrder: 8000,
    },
    payments: {
      cash: true,
      transfer: {
        cbu: "0000003100099999999901",
        alias: "DOBLEQUESO.DEMO",
        holder: "Doble Queso Burgers (demo)",
        bank: "Mercado Pago",
      },
      mixed: true,
    },
  },
  coupons: [
    { code: "BIENVENIDA", type: "percent", value: 10, active: true },
    { code: "FINDE2000", type: "fixed", value: 2000, minSubtotal: 15000, active: true },
  ],
  // Panel de prueba: admin@doblequeso.demo / demo1234
  admin: {
    email: "admin@doblequeso.demo",
    passwordHash:
      "scrypt$qPfViTmrQ6dX37p72rEYpQ$Hq1WOyEzU79jfwvd3UPApRVnfmzUI51VN7iAyoV1pMYcEHFZcinGN1UmMhgDoyJzBvBOqb-SI7w0AVE9686l5g",
  },
  menu: [
    {
      id: "hamburguesas",
      name: "Hamburguesas",
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
              true,
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
              true,
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
              true,
            ),
            burger(
              "crispy",
              "Crispy",
              "Pollo crispy, cheddar, lechuga, tomate y mayo de lima.",
              "/demo/hamburguesa-crispy.jpg",
              [10000, 13000],
            ),
          ],
        },
      ],
    },
    {
      id: "pollo",
      name: "Pollo",
      imageUrl: "/demo/bocados-pollo.jpg",
      subcategories: [
        {
          id: "pollo",
          name: "Pollo",
          products: [
            {
              id: "nuggets",
              name: "Nuggets",
              description: "Nuggets de pollo caseros con la salsa que elijas.",
              imageUrl: "/demo/bocados-pollo.jpg",
              featured: true,
              variants: [
                { id: "x6", name: "x6", price: 5000 },
                { id: "x10", name: "x10", price: 7500 },
                { id: "x20", name: "x20", price: 13500 },
              ],
              optionGroups: [sauces],
            },
            {
              id: "tiras",
              name: "Tiras de pollo",
              description: "Tiras de pechuga rebozadas en panko.",
              imageUrl: "/demo/tiras-pollo.jpg",
              variants: [
                { id: "x4", name: "x4", price: 6000 },
                { id: "x8", name: "x8", price: 10500 },
              ],
              optionGroups: [sauces],
            },
            {
              id: "patitas",
              name: "Patitas crispy x4",
              description: "Patitas de pollo crocantes.",
              imageUrl: "/demo/pollo-crispy.jpg",
              price: 7000,
              optionGroups: [sauces],
            },
          ],
        },
      ],
    },
    {
      id: "papas",
      name: "Papas",
      imageUrl: "/demo/papas-cono.jpg",
      subcategories: [
        {
          id: "papas",
          name: "Papas",
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
              id: "papas-cheddar",
              name: "Papas con cheddar y bacon",
              variants: [
                { id: "chica", name: "Chica", price: 4500 },
                { id: "grande", name: "Grande", price: 6500 },
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
          ],
        },
      ],
    },
    {
      id: "bebidas",
      name: "Bebidas",
      imageUrl: "/demo/gaseosa-vaso.jpg",
      subcategories: [
        {
          id: "bebidas",
          name: "Bebidas",
          products: [
            { id: "coca-cola", name: "Coca-Cola 500 ml", imageUrl: "/demo/gaseosa-lata.jpg", price: 2000 },
            { id: "sprite", name: "Sprite 500 ml", price: 2000 },
            { id: "agua", name: "Agua mineral 500 ml", price: 1500, soldOut: true },
            {
              id: "cerveza",
              name: "Cerveza en lata 473 ml",
              imageUrl: "/demo/cerveza.jpg",
              variants: [
                { id: "rubia", name: "Rubia", price: 2800 },
                { id: "negra", name: "Negra", price: 3000 },
              ],
            },
            {
              id: "limonada",
              name: "Limonada casera",
              description: "Con menta y jengibre.",
              imageUrl: "/demo/limonada.jpg",
              variants: [
                { id: "vaso", name: "Vaso", price: 2500 },
                { id: "jarra", name: "Jarra de 1 litro", price: 5500 },
              ],
              optionGroups: [
                {
                  id: "endulzada",
                  name: "Endulzada con",
                  min: 1,
                  max: 1,
                  options: [
                    { id: "azucar", name: "Azúcar", price: 0 },
                    { id: "stevia", name: "Stevia", price: 0 },
                    { id: "sin", name: "Sin endulzar", price: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
