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

/** Colores en hex de 6 dígitos (#e8590c). */
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

export interface DeliveryZone {
  /** Radio máximo en km, en línea recta desde el local. */
  upToKm: number;
  cost: number;
}

export interface DeliverySettings {
  pickup: boolean;
  delivery: boolean;
  /** De menor a mayor radio. Sin zonas, el costo de envío se coordina por WhatsApp. */
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
  logoUrl: string;
  /** Imagen para la vista previa al compartir el link (WhatsApp, Instagram). */
  coverUrl?: string;
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
  theme: Theme;
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

export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  /** Precio único. Se ignora si el producto tiene `variants`. */
  price?: number;
  /** "Presentaciones": simple, doble, triple… */
  variants?: Variant[];
  /** "Personalizá tu selección": extras, salsas, guarniciones… */
  optionGroups?: OptionGroup[];
  soldOut?: boolean;
  /** Aparece en "Lo más pedido", arriba del menú. */
  featured?: boolean;
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

export interface ProductContext {
  product: Product;
  category: { id: string; name: string };
  /** Encabezado del producto en el mensaje: "Minutas · De pollo" o "Bebidas". */
  sectionLabel: string;
}

export interface SearchEntry {
  productId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  categoryId: string;
  categoryName: string;
  priceFrom: number;
  hasVariants: boolean;
  soldOut: boolean;
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
