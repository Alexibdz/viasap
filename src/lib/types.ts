// Modelo de datos. Está pensado para mapear 1 a 1 con tablas de Supabase
// (businesses, categories, subcategories, products, variants, option_groups,
// options, coupons, orders) cuando dejemos los datos de ejemplo.

/** 0 = domingo … 6 = sábado (igual que Date#getDay). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Franja "HH:mm". Si `close` <= `open`, la franja termina al día siguiente (ej. 20:00 a 01:30). */
export interface TimeRange {
  open: string;
  close: string;
}

export type WeeklySchedule = Record<Weekday, TimeRange[]>;

/** Colores en hex de 6 dígitos (#e8590c). Los define el diseño de cada negocio (src/designs). */
export interface Theme {
  /** Color de marca: botones, pestaña activa, selecciones. */
  primary: string;
  /** Color de apoyo: etiquetas y detalles (destacados, contador del pedido). */
  accent: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface StoreAddress extends GeoPoint {
  street: string;
  city: string;
  province: string;
}

/** Zona de envío con nombre ("Dentro de boulevard"). El cliente elige la suya al pedir. */
export interface DeliveryZone {
  id: string;
  name: string;
  cost: number;
}

export interface DeliverySettings {
  pickup: boolean;
  delivery: boolean;
  /** En el orden en que se muestran. Sin zonas, el costo de envío se coordina por WhatsApp. */
  zones: DeliveryZone[];
  /** Pedido mínimo para envíos a domicilio. */
  minOrder?: number;
}

export interface TransferDetails {
  cbu: string;
  alias: string;
  holder: string;
  /** Banco o billetera, se muestra debajo del total ("Mercado Pago"). */
  bank?: string;
}

export interface PaymentSettings {
  cash: boolean;
  transfer: TransferDetails | null;
  /** Efectivo + transferencia. Requiere `transfer`. */
  mixed: boolean;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  description?: string;
  /** Va arriba en la tienda y es también la imagen de la vista previa al compartir el link. */
  logoUrl: string;
  /** WhatsApp en formato internacional, solo dígitos: 5493436123456. */
  whatsapp: string;
  instagram?: string;
  address: StoreAddress;
  timezone: string;
  schedule: WeeklySchedule;
  /** Si es false, no se puede enviar el pedido con el local cerrado. */
  acceptOrdersWhenClosed: boolean;
  /** Pausa manual desde el panel ("no tomamos pedidos por un rato"), sin importar el horario. */
  ordersPaused?: boolean;
  delivery: DeliverySettings;
  payments: PaymentSettings;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Option {
  id: string;
  name: string;
  price: number;
  /** Cuántas veces se puede elegir por producto (default 1). */
  maxQty?: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  /** Mínimo de selecciones; 0 = opcional. */
  min: number;
  /** Máximo de selecciones; sin valor = sin límite. */
  max?: number;
  options: Option[];
}

/** Producto del menú incluido en una oferta. */
export interface BundleItem {
  productId: string;
  /** Presentación incluida, si el producto tiene. */
  variantId?: string;
  qty: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  /** Opcional: mejor sin foto que con una foto de referencia que no es la real. */
  imageUrl?: string;
  /** Precio único. Se ignora si el producto tiene `variants`. */
  price?: number;
  /** "Presentaciones": simple, doble, triple… */
  variants?: Variant[];
  /** "Personalizá tu selección": extras, salsas, guarniciones… */
  optionGroups?: OptionGroup[];
  soldOut?: boolean;
  /** Oferta o promo: puede estar en cualquier categoría y destacarse arriba del menú. */
  isOffer?: boolean;
  /** Solo para ofertas: aparece en "Ofertas destacadas", arriba del menú. */
  featured?: boolean;
  /** Lo que incluye la oferta, si se armó con productos del menú (armador de ofertas). */
  bundle?: BundleItem[];
}

export interface Subcategory {
  id: string;
  name: string;
  products: Product[];
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  /** Decoración al lado del nombre en la tienda (🍕). No va en el mensaje de WhatsApp. */
  emoji?: string;
  /** "offers": sus productos se arman con el armador de ofertas. */
  kind?: "offers";
  /** Sin el campo "¿Alguna aclaración?" en sus productos (bebidas). */
  hideNotes?: boolean;
  /** La tienda la muestra desplegada al entrar (si no, arranca cerrada). */
  expanded?: boolean;
  /** Agrupaciones dentro de la categoría. Con una sola, no se muestra título de grupo. */
  subcategories: Subcategory[];
}

export interface Coupon {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotal?: number;
  active: boolean;
}

/** Lo que el navegador necesita saber de un cupón ya validado. */
export type CouponRule = Pick<Coupon, "code" | "type" | "value" | "minSubtotal">;

/** Acceso al panel del local. La contraseña se guarda hasheada (scrypt). */
export interface AdminAccount {
  email: string;
  passwordHash: string;
}

/** Todo lo de una tienda mientras no hay base de datos. Solo se lee en el servidor. */
export interface StoreSeed {
  business: Business;
  menu: Category[];
  coupons: Coupon[];
  admin: AdminAccount;
}

/** Una línea de lo que incluye una oferta, con su precio por separado (cantidad incluida). */
export interface BundleLine {
  productId: string;
  name: string;
  qty: number;
  price: number;
}

export interface OfferInfo {
  lines: BundleLine[];
  /** Lo que costaría comprar todo por separado. */
  regularPrice: number;
  /** Diferencia con el precio de la oferta (0 si no hay ahorro). */
  savings: number;
}

export interface ProductContext {
  product: Product;
  category: { id: string; name: string };
  /** Encabezado del producto en el mensaje: "Minutas · De pollo" o "Bebidas". */
  sectionLabel: string;
  offer?: OfferInfo;
  /** El cliente puede dejar una aclaración (no en las categorías marcadas, como bebidas). */
  allowsNotes: boolean;
}

export interface CartOption {
  groupId: string;
  groupName: string;
  optionId: string;
  name: string;
  price: number;
  /** Cantidad por unidad del producto. */
  qty: number;
}

export interface CartItem {
  /** Id único de la línea del carrito. */
  key: string;
  productId: string;
  name: string;
  imageUrl?: string;
  sectionLabel: string;
  variantId?: string;
  variantName?: string;
  unitPrice: number;
  options: CartOption[];
  /** Lo que incluye una oferta: "2x Classic (Doble), 1x Papas fritas (Grande)". */
  includes?: string;
  notes?: string;
  qty: number;
}

export type DeliveryMethod = "pickup" | "delivery";
export type PaymentMethod = "cash" | "transfer" | "mixed";
export type BuildingType = "house" | "apartment" | "other";

export interface AddressValue {
  label: string;
  location: GeoPoint | null;
  /** El buscador no encontró la altura exacta: conviene ajustar el pin. */
  approximate: boolean;
}

export type Fulfillment =
  | { method: "pickup" }
  | {
      method: "delivery";
      address: string;
      location: GeoPoint | null;
      buildingType: BuildingType;
      floor?: string;
      apartment?: string;
      references?: string;
      /** Nombre de la zona elegida ("Dentro de boulevard"). */
      zone?: string;
      /** null = se coordina por WhatsApp. */
      cost: number | null;
    };

/** pending = recién llegado; ready = listo para retirar o en camino, según la entrega. */
export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

/** Pedido guardado en el servidor (lo que ve el panel del local). */
export interface StoredOrder {
  number: string;
  /** Identificador del pedido; también funciona como "clave" para que el cliente lo siga o lo cancele. */
  code: string;
  createdAt: string;
  status: OrderStatus;
  history: { status: OrderStatus; at: string }[];
  cancelledBy?: "customer" | "store";
  cancelReason?: string;
  customer: { name: string; phone: string };
  items: CartItem[];
  fulfillment: Fulfillment;
  payment: { method: PaymentMethod; cashAmount?: number };
  coupon?: { code: string; discount: number };
  totals: { subtotal: number; discount: number; shipping: number; total: number };
  /** Total que vio el cliente; si no coincide con el recalculado, el panel lo avisa. */
  clientTotal: number;
}

export interface Order {
  number: string;
  code: string;
  createdAt: Date;
  customer: { name: string; phone: string };
  items: CartItem[];
  fulfillment: Fulfillment;
  /** cash: con cuánto abona (opcional). mixed: parte en efectivo. */
  payment: { method: PaymentMethod; cashAmount?: number };
  coupon?: { code: string; discount: number };
  totals: { subtotal: number; discount: number; shipping: number; total: number };
}
