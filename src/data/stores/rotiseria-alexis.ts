import type { OptionGroup, Product, StoreSeed } from "@/lib/types";
import { slugify } from "@/lib/validation";

// Rotisería Alexis: tienda de ejemplo con varios catálogos (parrilla, pizzas,
// torpedos, minutas, pastas, empanadas…). Los pedidos llegan a su WhatsApp real:
// para probar sin molestar, cambiá `whatsapp` por tu número.

const EMPANADA_FLAVORS = ["Jamón y queso", "Árabes", "Carne dulce", "Carne salada", "Caprese", "Verdura", "Pollo", "Cebolla"];

/** Gustos surtidos: el cliente reparte la media docena o la docena entre los que quiera. */
function empanadaFlavors(units: number): OptionGroup {
  return {
    id: "gustos",
    name: "Elegí los gustos",
    min: units,
    max: units,
    options: EMPANADA_FLAVORS.map((name) => ({ id: slugify(name), name, price: 0, maxQty: units })),
  };
}

const torpedoFilling: OptionGroup = {
  id: "relleno",
  name: "¿De qué lo querés?",
  min: 1,
  max: 1,
  options: [
    { id: "milanesa", name: "Milanesa de carne", price: 0 },
    { id: "hamburguesa", name: "Hamburguesa", price: 0 },
  ],
};

const XXL_FLAVORS = ["Pollo", "Carne salada", "Carne dulce", "Pescado", "Jamón y queso", "Cebolla", "Choclo y queso"];

/** Empanadas XXL (disco rotisero): mismos gustos para la unidad, la media y la docena. */
function xxlFlavors(units: number): OptionGroup {
  return {
    id: "gustos",
    name: units === 1 ? "Elegí el gusto" : "Elegí los gustos",
    min: units,
    max: units,
    options: XXL_FLAVORS.map((name) => ({ id: slugify(name), name, price: 0, maxQty: units })),
  };
}

/** Un acompañamiento a elegir (o hasta `max`), sin costo extra. */
function sides(names: string[], max = 1): OptionGroup {
  return {
    id: "acompanamiento",
    name: max === 1 ? "Elegí el acompañamiento" : "Acompañamientos",
    min: 1,
    max,
    options: names.map((name) => ({ id: slugify(name), name, price: 0 })),
  };
}

const pastaSauce: OptionGroup = {
  id: "salsa",
  name: "Salsa",
  min: 1,
  max: 1,
  options: ["Tuco", "Crema", "Mixta", "Bolognesa"].map((name) => ({ id: slugify(name), name, price: 0 })),
};

const hotDogSauces: OptionGroup = {
  id: "aderezos",
  name: "Aderezos",
  min: 0,
  options: ["Mayonesa", "Ketchup", "Mostaza", "Salsa golf"].map((name) => ({ id: slugify(name), name, price: 0 })),
};

/** Promo de pizzas: oferta con precio especial, sin armar con productos (no todas esas pizzas se venden sueltas). */
function pizzaPromo(id: string, name: string, price: number): Product {
  return { id, name, price, isOffer: true };
}

export const rotiseriaAlexis: StoreSeed = {
  business: {
    id: "biz_rotiseria_alexis",
    slug: "rotiseria-alexis",
    name: "Rotisería Alexis",
    description: "Parrilla, pizzas, hamburguesas, torpedos, milanesas, empanadas XXL y pastas.",
    logoUrl: "/demo/logos/rotiseria-alexis.png",
    whatsapp: "5493436617446",
    address: {
      street: "Sarmiento 450",
      city: "Victoria",
      province: "Entre Ríos",
      lat: -32.621,
      lng: -60.1581,
    },
    timezone: "America/Argentina/Buenos_Aires",
    schedule: {
      0: [
        { open: "11:00", close: "14:30" },
        { open: "20:00", close: "00:30" },
      ],
      1: [],
      2: [{ open: "20:00", close: "00:30" }],
      3: [{ open: "20:00", close: "00:30" }],
      4: [{ open: "20:00", close: "00:30" }],
      5: [{ open: "20:00", close: "01:30" }],
      6: [
        { open: "11:00", close: "14:30" },
        { open: "20:00", close: "01:30" },
      ],
    },
    acceptOrdersWhenClosed: true,
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
        cbu: "0000003100099999999901",
        alias: "ROTISERIA.ALEXIS",
        holder: "Rotisería Alexis (demo)",
        bank: "Mercado Pago",
      },
      mixed: true,
    },
  },
  coupons: [
    { code: "BIENVENIDA", type: "percent", value: 10, active: true },
    { code: "FINDE2000", type: "fixed", value: 2000, minSubtotal: 15000, active: true },
  ],
  // Panel de prueba: admin@rotiseriaalexis.demo / demo1234
  admin: {
    email: "admin@rotiseriaalexis.demo",
    passwordHash:
      "scrypt$qPfViTmrQ6dX37p72rEYpQ$Hq1WOyEzU79jfwvd3UPApRVnfmzUI51VN7iAyoV1pMYcEHFZcinGN1UmMhgDoyJzBvBOqb-SI7w0AVE9686l5g",
  },
  // Catálogo armado con dos listas reales que mandan por WhatsApp (con sus precios) más
  // las burgers y el pollo de la casa. Donde un producto aparecía en las dos, quedó el de
  // la rotisería. Los productos nuevos no tienen foto a propósito: mejor ninguna que una
  // de referencia que no es la real.
  menu: [
    {
      id: "ofertas",
      emoji: "🔥",
      name: "Ofertas",
      kind: "offers",
      subcategories: [
        {
          id: "ofertas",
          name: "Ofertas",
          products: [
            {
              id: "pizza-y-empanadas",
              name: "Pizza + media docena",
              description: "Una pizza común y media docena de empanadas de los gustos que quieras.",
              price: 12500,
              bundle: [
                { productId: "pizza-comun", qty: 1 },
                { productId: "media-docena", qty: 1 },
              ],
              optionGroups: [{ ...empanadaFlavors(6), name: "Gustos de las empanadas" }],
            },
          ],
        },
      ],
    },
    {
      id: "parrilla",
      emoji: "🥩",
      name: "Parrilla",
      subcategories: [
        {
          id: "parrilla",
          name: "Parrilla",
          products: [
            {
              id: "asado-1",
              name: "Asado para 1 persona",
              description: "Con papas o ensalada.",
              price: 17000,
              optionGroups: [sides(["Papas fritas", "Ensalada"])],
            },
            {
              id: "asado-2",
              name: "Asado para 2 personas",
              description: "Con papas fritas y/o ensalada, puré o rusa.",
              price: 24000,
              optionGroups: [sides(["Papas fritas", "Ensalada", "Puré", "Ensalada rusa"], 2)],
            },
            {
              id: "pollo-parrilla",
              name: "Pollo a la parrilla",
              description: "Con ensalada rusa, papas fritas o ensalada mixta.",
              price: 22000,
              optionGroups: [sides(["Ensalada rusa", "Papas fritas", "Ensalada mixta"])],
            },
          ],
        },
      ],
    },
    {
      id: "pizzas",
      emoji: "🍕",
      name: "Pizzas",
      subcategories: [
        {
          id: "promos",
          name: "Promos",
          products: [
            {
              id: "promo-2-muzza",
              name: "2 muzza",
              price: 13000,
              isOffer: true,
              featured: true,
              bundle: [{ productId: "pizza-comun", qty: 2 }],
            },
            pizzaPromo("promo-2-muzza-jamon", "2 muzza con jamón", 15000),
            pizzaPromo("promo-especial-napolitana", "1 especial + 1 napolitana", 15000),
            pizzaPromo("promo-2-especiales", "2 especiales", 15000),
            pizzaPromo("promo-jamon-napolitana", "1 muzza con jamón + 1 napolitana", 15000),
            pizzaPromo("promo-fugazzetta-napolitana", "1 fugazzetta + 1 napolitana", 15000),
            pizzaPromo("promo-napolitana-bomba", "1 napolitana + 1 bomba", 15000),
            pizzaPromo("promo-pollo-clasica", "1 pollo a la crema + 1 pizza clásica", 15000),
            {
              id: "promo-pizza-empanadas-xxl",
              name: "Pizza + 12 empanadas XXL",
              description: "Pizza de 8 porciones y una docena de empanadas XXL de los gustos que quieras.",
              price: 22000,
              isOffer: true,
              featured: true,
              optionGroups: [{ ...xxlFlavors(12), name: "Gustos de las empanadas" }],
            },
          ],
        },
        {
          id: "pizzas",
          name: "Pizzas",
          products: [
            { id: "pizza-comun", name: "Pizza común", price: 7000 },
            { id: "pizza-salchichas", name: "Pizza de salchichas", price: 9000 },
            {
              id: "pizza-especial",
              name: "Pizza especial, napo o calabresa",
              price: 10000,
              optionGroups: [
                {
                  id: "gusto",
                  name: "Elegí la pizza",
                  min: 1,
                  max: 1,
                  options: [
                    { id: "especial", name: "Especial", price: 0 },
                    { id: "napolitana", name: "Napolitana", price: 0 },
                    { id: "calabresa", name: "Calabresa", price: 0 },
                  ],
                },
              ],
            },
            { id: "pizza-papas-huevo", name: "Pizza con papas fritas y huevos fritos", price: 12000 },
            { id: "pizza-pollo", name: "Pizza de pollo", price: 12000 },
            { id: "pizza-palmitos", name: "Pizza de palmitos", price: 10000 },
            { id: "pizza-champinones", name: "Pizza de champiñones", price: 10000 },
            { id: "hamburpizza", name: "Hamburpizza", price: 16000 },
          ],
        },
      ],
    },
    {
      id: "hamburguesas",
      emoji: "🍔",
      name: "Hamburguesas",
      subcategories: [
        {
          id: "con-papas",
          name: "Hamburguesas",
          products: [
            {
              id: "hamburguesa-con-papas",
              name: "Hamburguesa XXL completa con papas",
              variants: [
                { id: "una", name: "1 hamburguesa", price: 7000 },
                { id: "dos", name: "2 hamburguesas", price: 13000 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "panchos",
      emoji: "🌭",
      name: "Panchos y choris",
      subcategories: [
        {
          id: "panchos",
          name: "Panchos y choris",
          products: [
            {
              id: "super-pancho",
              name: "Súper pancho con papas bastón",
              price: 4000,
              optionGroups: [hotDogSauces],
            },
            {
              id: "dos-panchos-coca",
              name: "2 súper panchos + Coca 1 litro",
              price: 10000,
              isOffer: true,
              featured: true,
              bundle: [
                { productId: "super-pancho", qty: 2 },
                { productId: "gaseosa-1l", variantId: "coca", qty: 1 },
              ],
              optionGroups: [hotDogSauces],
            },
            { id: "choripan", name: "Choripán con papas", price: 4000 },
          ],
        },
      ],
    },
    {
      id: "torpedos",
      emoji: "🥖",
      name: "Torpedos",
      subcategories: [
        {
          id: "torpedos",
          name: "Torpedos",
          products: [
            {
              id: "torpedo-con-papas",
              name: "Torpedo con papas",
              description: "De milanesa de carne o de hamburguesa.",
              variants: [
                { id: "para-1", name: "Para 1 persona", price: 9000 },
                { id: "para-2", name: "Para 2 personas", price: 12000 },
              ],
              optionGroups: [torpedoFilling],
            },
            {
              id: "super-torpedo-completo",
              name: "Súper torpedo completo 40 cm con papas",
              description: "Comen 4 o 5 personas.",
              price: 15000,
            },
            {
              id: "super-torpedo-hamburguesa",
              name: "Súper torpedo de hamburguesa 40 cm con papas",
              price: 16000,
            },
            {
              id: "super-torpedo-lomo",
              name: "Súper torpedo de lomo 40 cm con papas",
              price: 17000,
            },
            {
              id: "torpedo-x4",
              name: "Torpedo de mila con papas x4",
              description: "Para compartir. También puede ser de hamburguesa.",
              variants: [
                { id: "comun", name: "Común", price: 16000 },
                { id: "huevos", name: "Con huevos", price: 17000 },
              ],
              optionGroups: [torpedoFilling],
            },
          ],
        },
      ],
    },
    {
      id: "sandwiches",
      emoji: "🥪",
      name: "Sándwiches",
      subcategories: [
        {
          id: "miga",
          name: "Sándwiches de miga",
          products: [
            {
              id: "miga",
              name: "Docena de sándwiches de miga",
              description: "Triples de jamón, queso, lechuga y tomate.",
              variants: [
                { id: "simples", name: "Simples", price: 13000 },
                { id: "triples", name: "Triples", price: 14000 },
              ],
            },
          ],
        },
        {
          id: "carlitos",
          name: "Carlitos",
          products: [
            {
              id: "carlitos",
              name: "Carlitos",
              description: "8 triángulos.",
              variants: [
                { id: "simple", name: "Simple", price: 10000 },
                { id: "especial", name: "Especial", price: 11000 },
                { id: "pollo", name: "De pollo", price: 12000 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "minutas",
      emoji: "🍳",
      name: "Minutas",
      subcategories: [
        {
          id: "milanesas",
          name: "Milanesas y lomo",
          products: [
            {
              id: "milanesa-con-papas",
              name: "Milanesa con papas",
              variants: [
                { id: "carne", name: "De carne", price: 10000 },
                { id: "pollo", name: "De pollo", price: 10000 },
                { id: "pescado", name: "De pescado", price: 10000 },
              ],
            },
            { id: "mila-napo", name: "Milanesa napolitana con papas", price: 12000 },
            { id: "mila-al-plato", name: "Mila al plato con papas y huevo", price: 10000 },
            { id: "mila-especial", name: "Mila especial", price: 10000 },
            { id: "mila-a-caballo", name: "Mila a caballo", price: 10000 },
            { id: "lomo-completo", name: "Lomo completo con papas", price: 10000 },
            {
              id: "pizzanesa",
              name: "Pizzanesa",
              description: "Para 2 o 3 personas.",
              price: 23000,
              optionGroups: [
                {
                  id: "gusto",
                  name: "Elegí el gusto",
                  min: 1,
                  max: 1,
                  options: [
                    "Muzza",
                    "Jamón",
                    "Napolitana",
                    "Panceta",
                    "Madrileña",
                    "Fugazzetta",
                    "Roquefort",
                    "Especial",
                    "Verdeo",
                    "Cheddar",
                  ].map((name) => ({ id: slugify(name), name, price: 0 })),
                },
              ],
            },
          ],
        },
        {
          id: "tortillas-y-mas",
          name: "Tortillas y más",
          products: [
            {
              id: "tortilla",
              name: "Tortilla de papa",
              variants: [
                { id: "una", name: "Una tortilla", price: 10000 },
                { id: "dos", name: "Dos tortillas", price: 18000 },
              ],
            },
            { id: "omelette", name: "Omelette con ensalada", price: 8000 },
            { id: "tacos", name: "Tacos con papas", price: 9000 },
          ],
        },
      ],
    },
    {
      id: "pastas",
      emoji: "🍝",
      name: "Pastas",
      subcategories: [
        {
          id: "pastas",
          name: "Pastas",
          products: [
            { id: "noquis", name: "Ñoquis", price: 9000, optionGroups: [pastaSauce] },
            { id: "tallarines", name: "Tallarines", price: 9000, optionGroups: [pastaSauce] },
          ],
        },
      ],
    },
    {
      id: "empanadas",
      emoji: "🥟",
      name: "Empanadas",
      subcategories: [
        {
          id: "xxl",
          name: "XXL (disco rotisero)",
          products: [
            {
              id: "docena-xxl",
              name: "Docena surtida XXL",
              price: 15000,
              optionGroups: [xxlFlavors(12)],
            },
            { id: "media-docena-xxl", name: "Media docena XXL", price: 9000, optionGroups: [xxlFlavors(6)] },
            { id: "empanada-xxl", name: "Empanada XXL", price: 2000, optionGroups: [xxlFlavors(1)] },
          ],
        },
        {
          id: "empanadas",
          name: "Comunes",
          products: [
            {
              id: "media-docena",
              name: "Media docena de empanadas",
              description: "Jamón y queso, árabes, carne dulce o salada, caprese, verdura, pollo y cebolla.",
              price: 7000,
              optionGroups: [empanadaFlavors(6)],
            },
            {
              id: "docena",
              name: "Docena de empanadas",
              description: "Jamón y queso, árabes, carne dulce o salada, caprese, verdura, pollo y cebolla.",
              price: 12000,
              optionGroups: [empanadaFlavors(12)],
            },
          ],
        },
      ],
    },
    {
      id: "rabas",
      emoji: "🦑",
      name: "Rabas",
      subcategories: [
        {
          id: "rabas",
          name: "Rabas",
          products: [
            {
              id: "rabas",
              name: "Rabas a la romana",
              description: "De 21 a 25 aros, con salsas.",
              price: 22000,
            },
          ],
        },
      ],
    },
    {
      id: "papas",
      emoji: "🍟",
      name: "Papas",
      subcategories: [
        {
          id: "papas",
          name: "Papas",
          products: [
            { id: "papas-fritas", name: "Papas fritas grandes", price: 6000 },
            { id: "papas-cheddar", name: "Papas con cheddar", price: 9000 },
          ],
        },
      ],
    },
    {
      // Las bebidas no llevan "¿Alguna aclaración?".
      id: "bebidas",
      emoji: "🥤",
      name: "Bebidas",
      hideNotes: true,
      subcategories: [
        {
          id: "cervezas",
          name: "Cervezas",
          products: [
            { id: "brahma", name: "Brahma 1,2 litros", price: 4000 },
            { id: "cerveza-lata", name: "Cerveza en lata 473 cc", price: 3000 },
            {
              id: "laton",
              name: "Latón",
              variants: [
                { id: "schneider", name: "Schneider", price: 4000 },
                { id: "budweiser", name: "Budweiser", price: 4000 },
              ],
            },
          ],
        },
        {
          id: "gaseosas",
          name: "Gaseosas y aguas",
          products: [
            {
              id: "gaseosa-500",
              name: "Línea Coca o agua saborizada 500 cc",
              variants: [
                { id: "coca", name: "Coca-Cola", price: 2500 },
                { id: "sprite", name: "Sprite", price: 2500 },
                { id: "fanta", name: "Fanta", price: 2500 },
                { id: "agua", name: "Agua saborizada", price: 2500 },
              ],
            },
            {
              id: "gaseosa-1l",
              name: "Coca o Sprite 1 litro",
              variants: [
                { id: "coca", name: "Coca-Cola", price: 3000 },
                { id: "sprite", name: "Sprite", price: 3000 },
              ],
            },
            { id: "coca-retornable", name: "Coca-Cola retornable 2 litros", price: 4000 },
            {
              id: "manaos",
              name: "Manaos o Doble Cola 3 litros",
              variants: [
                { id: "manaos", name: "Manaos", price: 3000 },
                { id: "doble-cola", name: "Doble Cola", price: 3000 },
              ],
            },
            {
              id: "pepsi",
              name: "Pepsi",
              variants: [
                { id: "3l", name: "3 litros", price: 4800 },
                { id: "2l", name: "2 litros", price: 3500 },
                { id: "1-5l", name: "1,5 litros", price: 3000 },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "postres",
      emoji: "🍮",
      name: "Postres",
      subcategories: [
        {
          id: "postres",
          name: "Postres",
          products: [
            {
              id: "flan",
              name: "Flan o budín casero",
              description: "500 g aprox.",
              variants: [
                { id: "flan", name: "Flan", price: 4000 },
                { id: "budin", name: "Budín", price: 4000 },
              ],
            },
            { id: "ensalada-frutas", name: "Ensalada de frutas", price: 3500 },
            {
              id: "helado",
              name: "Helado",
              variants: [
                { id: "3l", name: "3 litros", price: 14000 },
                { id: "1kg", name: "1 kg", price: 16000 },
                { id: "medio", name: "½ kg", price: 9000 },
                { id: "cuarto", name: "¼ kg", price: 6000 },
              ],
              optionGroups: [
                {
                  id: "sabores",
                  name: "Sabores",
                  min: 1,
                  max: 4,
                  options: ["Chocolate", "Frutilla", "Americana", "Menta granizada", "Vainilla", "Dulce de leche"].map(
                    (name) => ({ id: slugify(name), name, price: 0 }),
                  ),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
