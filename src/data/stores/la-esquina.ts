import type { OptionGroup, Product, StoreSeed } from "@/lib/types";

// Rotisería de ejemplo (ficticia). El número de WhatsApp es un placeholder
// inválido: reemplazalo por el tuyo para probar el envío de pedidos.

const sideIncluded: OptionGroup = {
  id: "guarnicion",
  name: "Guarnición",
  min: 1,
  max: 1,
  options: [
    { id: "papas", name: "Papas fritas", price: 0 },
    { id: "pure", name: "Puré de papas", price: 0 },
    { id: "ensalada", name: "Ensalada mixta", price: 0 },
    { id: "sin", name: "Sin guarnición", price: 0 },
  ],
};

const pastaSauce: OptionGroup[] = [
  {
    id: "salsa",
    name: "Salsa",
    min: 1,
    max: 1,
    options: [
      { id: "fileto", name: "Fileto", price: 0 },
      { id: "bolognesa", name: "Bolognesa", price: 1500 },
      { id: "crema", name: "Crema", price: 1200 },
      { id: "mixta", name: "Mixta", price: 1200 },
    ],
  },
  {
    id: "queso",
    name: "Para sumar",
    min: 0,
    options: [{ id: "queso", name: "Queso rallado", price: 500 }],
  },
];

function empanada(id: string, name: string, prices: number[], featured = false): Product {
  const sizes = [
    { id: "unidad", name: "Unidad" },
    { id: "media", name: "Media docena" },
    { id: "docena", name: "Docena" },
  ];
  return {
    id,
    name,
    description: "Al horno, con masa casera.",
    imageUrl: "/demo/empanadas.jpg",
    featured,
    variants: prices.map((price, i) => ({ ...sizes[i], price })),
  };
}

export const laEsquina: StoreSeed = {
  business: {
    id: "biz_la_esquina",
    slug: "la-esquina",
    name: "Rotisería La Esquina",
    description: "Comida casera para llevar: pollo al spiedo, minutas, pastas y empanadas.",
    logoUrl: "/demo/logos/la-esquina.svg",
    coverUrl: "/demo/pollo-spiedo.jpg",
    whatsapp: "5493430000000",
    address: {
      street: "San Martín 850",
      city: "Paraná",
      province: "Entre Ríos",
      lat: -31.7319,
      lng: -60.5299,
    },
    timezone: "America/Argentina/Buenos_Aires",
    schedule: {
      0: [{ open: "11:00", close: "14:30" }],
      1: [],
      2: [
        { open: "11:00", close: "14:30" },
        { open: "19:30", close: "23:30" },
      ],
      3: [
        { open: "11:00", close: "14:30" },
        { open: "19:30", close: "23:30" },
      ],
      4: [
        { open: "11:00", close: "14:30" },
        { open: "19:30", close: "23:30" },
      ],
      5: [
        { open: "11:00", close: "14:30" },
        { open: "19:30", close: "23:30" },
      ],
      6: [
        { open: "11:00", close: "14:30" },
        { open: "19:30", close: "23:30" },
      ],
    },
    acceptOrdersWhenClosed: false,
    theme: { primary: "#2f6b4f", accent: "#f2c14e" },
    delivery: {
      pickup: true,
      delivery: true,
      zones: [
        { upToKm: 2, cost: 1200 },
        { upToKm: 4, cost: 1800 },
        { upToKm: 7, cost: 2600 },
      ],
      minOrder: 10000,
    },
    payments: {
      cash: true,
      transfer: {
        cbu: "0000003100099999999902",
        alias: "LAESQUINA.ROTI.DEMO",
        holder: "Rotisería La Esquina (demo)",
      },
      mixed: false,
    },
  },
  coupons: [{ code: "ESQUINA15", type: "percent", value: 15, minSubtotal: 12000, active: true }],
  // Panel de prueba: admin@laesquina.demo / demo1234
  admin: {
    email: "admin@laesquina.demo",
    passwordHash:
      "scrypt$806YVvOFMb-sxjg4fsZclA$P_66Zwb1TF4u3SxAo9dU2VO5Nq2chDP7h4r8PV3g5kCQV-71RFdz-oB2xXp179jfDV_EOvb6u_iKWQ7Tb32YtQ",
  },
  menu: [
    {
      id: "pollos",
      name: "Pollos",
      imageUrl: "/demo/pollo-entero.jpg",
      subcategories: [
        {
          id: "pollos",
          name: "Pollos",
          products: [
            {
              id: "pollo-spiedo",
              name: "Pollo al spiedo",
              description: "Dorado a la leña, con chimichurri de la casa.",
              imageUrl: "/demo/pollo-spiedo.jpg",
              featured: true,
              variants: [
                { id: "entero", name: "Entero", price: 14000 },
                { id: "medio", name: "Medio", price: 7500 },
              ],
              optionGroups: [
                {
                  id: "guarnicion",
                  name: "Sumale guarnición",
                  min: 0,
                  options: [
                    { id: "papas", name: "Papas fritas", price: 3500, maxQty: 3 },
                    { id: "pure", name: "Puré de papas", price: 3000, maxQty: 3 },
                    { id: "ensalada", name: "Ensalada mixta", price: 2800, maxQty: 3 },
                  ],
                },
              ],
            },
            {
              id: "suprema",
              name: "Suprema grillada",
              description: "Pechuga a la plancha con limón y hierbas. Incluye guarnición.",
              imageUrl: "/demo/suprema-grillada.jpg",
              price: 8500,
              optionGroups: [sideIncluded],
            },
          ],
        },
      ],
    },
    {
      id: "minutas",
      name: "Minutas",
      imageUrl: "/demo/milanesa.jpg",
      subcategories: [
        {
          id: "de-carne",
          name: "De carne",
          products: [
            {
              id: "milanesa-carne",
              name: "Milanesa de carne",
              description: "Nalga rebozada a mano. Incluye guarnición.",
              imageUrl: "/demo/milanesa.jpg",
              featured: true,
              variants: [
                { id: "sola", name: "Sola", price: 7500 },
                { id: "napolitana", name: "Napolitana", price: 9500 },
                { id: "caballo", name: "A caballo", price: 9000 },
              ],
              optionGroups: [sideIncluded],
            },
          ],
        },
        {
          id: "de-pollo",
          name: "De pollo",
          products: [
            {
              id: "milanesa-pollo",
              name: "Milanesa de pollo",
              description: "Pechuga rebozada a mano. Incluye guarnición.",
              variants: [
                { id: "sola", name: "Sola", price: 7000 },
                { id: "napolitana", name: "Napolitana", price: 9000 },
              ],
              optionGroups: [sideIncluded],
            },
          ],
        },
        {
          id: "al-pan",
          name: "Al pan",
          products: [
            {
              id: "choripan",
              name: "Choripán",
              imageUrl: "/demo/chorizos.jpg",
              price: 4500,
              optionGroups: [
                {
                  id: "salsas",
                  name: "Salsas",
                  min: 0,
                  options: [
                    { id: "chimichurri", name: "Chimichurri", price: 0 },
                    { id: "criolla", name: "Salsa criolla", price: 0 },
                  ],
                },
              ],
            },
            {
              id: "sanguche-milanesa",
              name: "Sánguche de milanesa",
              description: "Completo: lechuga, tomate, jamón y queso.",
              variants: [
                { id: "simple", name: "Simple", price: 7500 },
                { id: "completo", name: "Completo", price: 9000 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "empanadas",
      name: "Empanadas",
      imageUrl: "/demo/empanadas.jpg",
      subcategories: [
        {
          id: "empanadas",
          name: "Empanadas",
          products: [
            empanada("empanada-carne", "Carne suave", [1200, 6800, 13000], true),
            empanada("empanada-picante", "Carne picante", [1200, 6800, 13000]),
            empanada("empanada-pollo", "Pollo", [1200, 6800, 13000]),
            empanada("empanada-jyq", "Jamón y queso", [1100, 6300, 12000]),
            empanada("empanada-humita", "Humita", [1100, 6300, 12000]),
            empanada("empanada-caprese", "Caprese", [1100, 6300, 12000]),
          ],
        },
      ],
    },
    {
      id: "pastas",
      name: "Pastas",
      imageUrl: "/demo/ravioles.jpg",
      subcategories: [
        {
          id: "pastas",
          name: "Pastas",
          products: [
            {
              id: "ravioles",
              name: "Ravioles de verdura",
              imageUrl: "/demo/ravioles.jpg",
              price: 8000,
              optionGroups: pastaSauce,
            },
            {
              id: "tallarines",
              name: "Tallarines caseros",
              imageUrl: "/demo/tallarines.jpg",
              price: 7000,
              optionGroups: pastaSauce,
            },
            { id: "noquis", name: "Ñoquis de papa", price: 6500, optionGroups: pastaSauce },
          ],
        },
      ],
    },
    {
      id: "pizzas",
      name: "Pizzas",
      imageUrl: "/demo/pizza-muzzarella.jpg",
      subcategories: [
        {
          id: "pizzas",
          name: "Pizzas",
          products: [
            {
              id: "pizza-muzzarella",
              name: "Muzzarella",
              imageUrl: "/demo/pizza-muzzarella.jpg",
              variants: [
                { id: "chica", name: "Chica", price: 7000 },
                { id: "grande", name: "Grande", price: 9500 },
              ],
            },
            {
              id: "pizza-especial",
              name: "Especial",
              description: "Jamón, morrones y aceitunas.",
              imageUrl: "/demo/pizza-especial.jpg",
              variants: [
                { id: "chica", name: "Chica", price: 8500 },
                { id: "grande", name: "Grande", price: 11500 },
              ],
            },
            { id: "fugazzeta", name: "Fugazzeta grande", price: 10000 },
          ],
        },
      ],
    },
    {
      id: "guarniciones",
      name: "Guarniciones",
      imageUrl: "/demo/ensalada.jpg",
      subcategories: [
        {
          id: "guarniciones",
          name: "Guarniciones",
          products: [
            { id: "papas-fritas", name: "Papas fritas", imageUrl: "/demo/papas-fritas.jpg", price: 3500 },
            { id: "pure", name: "Puré de papas", price: 3000 },
            {
              id: "ensalada-mixta",
              name: "Ensalada mixta",
              description: "Lechuga, tomate y cebolla.",
              imageUrl: "/demo/ensalada.jpg",
              price: 2800,
            },
            {
              id: "ensalada-pasta",
              name: "Ensalada de pasta",
              imageUrl: "/demo/ensalada-pasta.jpg",
              price: 4000,
            },
          ],
        },
      ],
    },
    {
      id: "bebidas",
      name: "Bebidas",
      imageUrl: "/demo/gaseosas-latas.jpg",
      subcategories: [
        {
          id: "bebidas",
          name: "Bebidas",
          products: [
            {
              id: "gaseosa",
              name: "Gaseosa 1,5 litros",
              imageUrl: "/demo/gaseosa-vaso.jpg",
              variants: [
                { id: "coca", name: "Coca-Cola", price: 3500 },
                { id: "sprite", name: "Sprite", price: 3300 },
                { id: "fanta", name: "Fanta", price: 3300 },
              ],
            },
            { id: "agua", name: "Agua 1,5 litros", price: 2200 },
            { id: "cerveza", name: "Cerveza 1 litro", imageUrl: "/demo/cerveza.jpg", price: 4000 },
          ],
        },
      ],
    },
    {
      id: "postres",
      name: "Postres",
      imageUrl: "/demo/postre.jpg",
      subcategories: [
        {
          id: "postres",
          name: "Postres",
          products: [
            {
              id: "flan",
              name: "Flan casero",
              price: 3000,
              optionGroups: [
                {
                  id: "acompanamiento",
                  name: "Acompañalo con",
                  min: 0,
                  max: 1,
                  options: [
                    { id: "ddl", name: "Dulce de leche", price: 800 },
                    { id: "crema", name: "Crema", price: 800 },
                    { id: "mixto", name: "Mixto", price: 1200 },
                  ],
                },
              ],
            },
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
