import { toWhatsAppNumber } from "./phone";
import { allProducts } from "./menu";
import { offersIncluding } from "./offers";
import type {
  Business,
  BundleItem,
  Category,
  Coupon,
  DeliverySettings,
  OptionGroup,
  PaymentSettings,
  Product,
  Theme,
  TimeRange,
  Weekday,
  WeeklySchedule,
} from "./types";
import { cleanMultiline, cleanText, HEX_COLOR, toAmount, toInt, uniqueId } from "./validation";

// Validación de los formularios del panel. Reciben lo que manda el navegador (no
// confiable) y devuelven datos limpios o errores por campo ("variants.0.price").

export type FieldErrors = Record<string, string>;
export type FormResult<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const field = (record: unknown, key: string): unknown => (isRecord(record) ? record[key] : undefined);
const done = <T>(value: T, errors: FieldErrors): FormResult<T> =>
  Object.keys(errors).length ? { ok: false, errors } : { ok: true, value };

/**
 * Saca los errores de los campos que se acaban de editar: "variants" también borra
 * "variants.0.price". Si no había ninguno, devuelve el mismo objeto (no re-renderiza).
 */
export function withoutErrors(errors: FieldErrors, fields: string[]): FieldErrors {
  const stale = Object.keys(errors).filter((key) =>
    fields.some((field) => key === field || key.startsWith(`${field}.`)),
  );
  if (!stale.length) return errors;
  const next = { ...errors };
  for (const key of stale) delete next[key];
  return next;
}

/** Fotos: subidas desde el panel (/media/...) o las de ejemplo (/demo/...). */
const IMAGE_URL = /^\/(media|demo)\/[A-Za-z0-9._/-]{1,200}$/;
export function cleanImageUrl(value: unknown): string | undefined {
  const url = cleanText(value, 220);
  return IMAGE_URL.test(url) && !url.includes("..") ? url : undefined;
}

/* ------------------------------------------------------------------ Productos */

export const NEW_GROUP = "__nuevo__";

export interface ProductDraft {
  id: string | null;
  name: string;
  description: string;
  imageUrl: string;
  categoryId: string;
  /** Id de un grupo existente o NEW_GROUP. */
  subcategoryId: string;
  newGroupName: string;
  hasVariants: boolean;
  price: string;
  variants: { id: string | null; name: string; price: string }[];
  optionGroups: {
    id: string | null;
    name: string;
    min: string;
    max: string;
    options: { id: string | null; name: string; price: string; maxQty: string }[];
  }[];
  /** Es una oferta (en cualquier categoría): habilita el armador y "destacada". */
  isOffer: boolean;
  /** Armador de ofertas: productos del menú que incluye. */
  bundle: { productId: string; variantId: string; qty: string }[];
  soldOut: boolean;
  featured: boolean;
}

export interface ProductPlacement {
  product: Product;
  categoryId: string;
  /** Grupo dentro de la categoría; `isNew` si hay que crearlo. */
  group: { id: string; name: string; isNew: boolean };
}

const allProductIds = (menu: Category[]) =>
  menu.flatMap((c) => c.subcategories.flatMap((s) => s.products.map((p) => p.id)));

/** Mantiene el id si es válido y no está repetido; si no, lo genera desde el nombre. */
function keepId(raw: unknown, name: string, taken: Set<string>, fallback: string): string {
  const id = typeof raw === "string" && /^[a-z0-9-]{1,40}$/.test(raw) && !taken.has(raw) ? raw : uniqueId(name, taken, fallback);
  taken.add(id);
  return id;
}

export function buildProduct(draft: unknown, menu: Category[]): FormResult<ProductPlacement> {
  const errors: FieldErrors = {};
  const name = cleanText(field(draft, "name"), 60);
  if (name.length < 2) errors.name = "Escribí el nombre del producto.";

  const category = menu.find((c) => c.id === field(draft, "categoryId"));
  if (!category) errors.categoryId = "Elegí una categoría.";

  let group: ProductPlacement["group"] = { id: "", name: "", isNew: false };
  if (category) {
    const requested = field(draft, "subcategoryId");
    if (requested === NEW_GROUP) {
      const groupName = cleanText(field(draft, "newGroupName"), 40);
      if (groupName.length < 2) errors.newGroupName = "Escribí el nombre del grupo.";
      const id = uniqueId(groupName, category.subcategories.map((s) => s.id), "grupo");
      group = { id, name: groupName, isNew: true };
    } else {
      const existing = category.subcategories.find((s) => s.id === requested) ?? category.subcategories[0];
      if (existing) group = { id: existing.id, name: existing.name, isNew: false };
      else errors.subcategoryId = "Elegí un grupo.";
    }
  }

  const rawId = field(draft, "id");
  const existingIds = allProductIds(menu);
  let id: string;
  if (typeof rawId === "string" && rawId) {
    if (!existingIds.includes(rawId)) errors.id = "El producto ya no existe.";
    id = rawId;
  } else {
    id = uniqueId(name, existingIds, "producto");
  }

  const product: Product = { id, name };
  const description = cleanMultiline(field(draft, "description"), 300);
  if (description) product.description = description;
  const imageUrl = cleanImageUrl(field(draft, "imageUrl"));
  if (imageUrl) product.imageUrl = imageUrl;

  if (field(draft, "hasVariants") === true) {
    const rows = list(field(draft, "variants"));
    if (!rows.length) errors.variants = "Agregá al menos una presentación.";
    if (rows.length > 12) errors.variants = "Hasta 12 presentaciones.";
    const taken = new Set<string>();
    product.variants = rows.slice(0, 12).map((row, i) => {
      const variantName = cleanText(field(row, "name"), 30);
      const price = toAmount(field(row, "price"));
      if (!variantName) errors[`variants.${i}.name`] = "Falta el nombre.";
      if (price === null || price === 0) errors[`variants.${i}.price`] = "Falta el precio.";
      return { id: keepId(field(row, "id"), variantName, taken, "opcion"), name: variantName, price: price ?? 0 };
    });
  } else {
    const price = toAmount(field(draft, "price"));
    if (price === null || price === 0) errors.price = "Poné un precio.";
    product.price = price ?? 0;
  }

  const groups = list(field(draft, "optionGroups"));
  if (groups.length > 10) errors.optionGroups = "Hasta 10 grupos de opciones.";
  const groupIds = new Set<string>();
  const optionGroups: OptionGroup[] = groups.slice(0, 10).map((row, g) => {
    const groupName = cleanText(field(row, "name"), 40);
    if (!groupName) errors[`optionGroups.${g}.name`] = "Falta el nombre del grupo.";
    const min = toInt(field(row, "min") || 0, 0, 20);
    const rawMax = field(row, "max");
    const max = rawMax === "" || rawMax === undefined || rawMax === null ? undefined : toInt(rawMax, 1, 20);
    if (min === null) errors[`optionGroups.${g}.min`] = "Entre 0 y 20.";
    if (max === null || (max !== undefined && min !== null && max < min)) {
      errors[`optionGroups.${g}.max`] = "Tiene que ser mayor o igual al mínimo.";
    }
    const optionRows = list(field(row, "options"));
    if (!optionRows.length) errors[`optionGroups.${g}.options`] = "Agregá al menos una opción.";
    const optionIds = new Set<string>();
    const options = optionRows.slice(0, 30).map((option, o) => {
      const optionName = cleanText(field(option, "name"), 40);
      if (!optionName) errors[`optionGroups.${g}.options.${o}.name`] = "Falta el nombre.";
      const rawPrice = field(option, "price");
      const price = rawPrice === "" || rawPrice === undefined ? 0 : toAmount(rawPrice);
      if (price === null) errors[`optionGroups.${g}.options.${o}.price`] = "Precio inválido.";
      const rawQty = field(option, "maxQty");
      const maxQty = rawQty === "" || rawQty === undefined ? 1 : toInt(rawQty, 1, 20);
      if (maxQty === null) errors[`optionGroups.${g}.options.${o}.maxQty`] = "Entre 1 y 20.";
      const result: OptionGroup["options"][number] = {
        id: keepId(field(option, "id"), optionName, optionIds, "opcion"),
        name: optionName,
        price: price ?? 0,
      };
      if (maxQty && maxQty > 1) result.maxQty = maxQty;
      return result;
    });
    const result: OptionGroup = {
      id: keepId(field(row, "id"), groupName, groupIds, "grupo"),
      name: groupName,
      min: min ?? 0,
      options,
    };
    if (max !== undefined && max !== null) result.max = max;
    return result;
  });
  if (optionGroups.length) product.optionGroups = optionGroups;

  // En la categoría de ofertas todo es oferta; en las demás, si se marcó. Si no es oferta,
  // no se guarda lo que haya quedado en el armador.
  const isOffer = field(draft, "isOffer") === true || category?.kind === "offers";
  const bundleRows = isOffer ? list(field(draft, "bundle")) : [];
  if (bundleRows.length > 12) errors.bundle = "Hasta 12 productos por oferta.";
  const catalog = allProducts(menu);
  const bundle: BundleItem[] = bundleRows.slice(0, 12).map((row, i) => {
    const included = catalog.find((p) => p.id === field(row, "productId"));
    if (!included) errors[`bundle.${i}.productId`] = "Elegí un producto.";
    else if (included.id === id) errors[`bundle.${i}.productId`] = "Una oferta no puede incluirse a sí misma.";
    else if (included.bundle?.length || included.isOffer) errors[`bundle.${i}.productId`] = "No se puede incluir otra oferta.";
    const qty = toInt(field(row, "qty"), 1, 20);
    if (qty === null) errors[`bundle.${i}.qty`] = "Entre 1 y 20.";
    const item: BundleItem = { productId: included?.id ?? "", qty: qty ?? 1 };
    if (included?.variants?.length) {
      const variant = included.variants.find((v) => v.id === field(row, "variantId"));
      if (variant) item.variantId = variant.id;
      else errors[`bundle.${i}.variantId`] = "Elegí la presentación.";
    }
    return item;
  });
  if (isOffer && offersIncluding(catalog, id).length) {
    errors.bundle = "Este producto está incluido en otra oferta: no puede ser una oferta.";
  }
  if (isOffer) product.isOffer = true;
  if (bundle.length) product.bundle = bundle;
  if (field(draft, "soldOut") === true) product.soldOut = true;
  // Arriba del menú solo se destacan ofertas.
  if (isOffer && field(draft, "featured") === true) product.featured = true;

  return done({ product, categoryId: category?.id ?? "", group }, errors);
}

function locate(menu: Category[], productId: string) {
  for (const category of menu) {
    for (const subcategory of category.subcategories) {
      const index = subcategory.products.findIndex((p) => p.id === productId);
      if (index >= 0) return { category, subcategory, index };
    }
  }
  return null;
}

/** Guarda el producto en su categoría y grupo (lo mueve si cambió de lugar). */
export function placeProduct(menu: Category[], { product, categoryId, group }: ProductPlacement): void {
  const category = menu.find((c) => c.id === categoryId);
  if (!category) throw new Error("Categoría inexistente.");
  let target = category.subcategories.find((s) => s.id === group.id);
  if (!target) {
    target = { id: group.id, name: group.name, products: [] };
    category.subcategories.push(target);
  }
  const current = locate(menu, product.id);
  if (current && current.subcategory === target) {
    target.products[current.index] = product;
    return;
  }
  if (current) current.subcategory.products.splice(current.index, 1);
  target.products.push(product);
}

export function removeProduct(menu: Category[], productId: string): boolean {
  const current = locate(menu, productId);
  if (!current) return false;
  current.subcategory.products.splice(current.index, 1);
  return true;
}

export function updateProductFlags(
  menu: Category[],
  productId: string,
  flags: { soldOut?: boolean; featured?: boolean },
): boolean {
  const current = locate(menu, productId);
  if (!current) return false;
  const product = current.subcategory.products[current.index];
  if (typeof flags.soldOut === "boolean") {
    if (flags.soldOut) product.soldOut = true;
    else delete product.soldOut;
  }
  if (typeof flags.featured === "boolean") {
    if (flags.featured) product.featured = true;
    else delete product.featured;
  }
  return true;
}

function swap<T>(items: T[], index: number, direction: -1 | 1): boolean {
  const other = index + direction;
  if (index < 0 || other < 0 || other >= items.length) return false;
  [items[index], items[other]] = [items[other], items[index]];
  return true;
}

export function moveProduct(menu: Category[], productId: string, direction: -1 | 1): boolean {
  const current = locate(menu, productId);
  return current ? swap(current.subcategory.products, current.index, direction) : false;
}

export function moveCategory(menu: Category[], categoryId: string, direction: -1 | 1): boolean {
  return swap(
    menu,
    menu.findIndex((c) => c.id === categoryId),
    direction,
  );
}

/* ----------------------------------------------------------------- Categorías */

export interface CategoryDraft {
  id: string | null;
  name: string;
  imageUrl: string;
  /** Emoji que decora la categoría en la tienda (🍕). Vacío = sin emoji. */
  emoji: string;
  /** Categoría de ofertas: sus productos se arman con el armador de ofertas. */
  offers: boolean;
  /** Sin el campo "¿Alguna aclaración?" (bebidas). */
  hideNotes: boolean;
  groups: { id: string | null; name: string }[];
}

const EMOJI_CHARS = /^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f]+$/u;

/** Uno o dos emojis ("🍕", "🍔🍟"). Vacío = sin emoji; null si no es un emoji. */
export function cleanEmoji(value: unknown): string | null {
  const emoji = cleanText(value, 24).replace(/\s/g, "");
  if (!emoji) return "";
  // Emoji_Component incluye dígitos, # y *: se exige algo dibujado y nada de ASCII.
  const valid = EMOJI_CHARS.test(emoji) && /\p{Extended_Pictographic}/u.test(emoji) && !/[\x00-\x7f]/.test(emoji);
  const graphemes = [...new Intl.Segmenter("es").segment(emoji)].length;
  return valid && graphemes <= 2 ? emoji : null;
}

/** Crea o actualiza una categoría. Un grupo con productos no se puede borrar. */
export function applyCategory(menu: Category[], draft: unknown): FormResult<string> {
  const errors: FieldErrors = {};
  const name = cleanText(field(draft, "name"), 40);
  if (name.length < 2) errors.name = "Escribí el nombre de la categoría.";
  const imageUrl = cleanImageUrl(field(draft, "imageUrl"));

  const rawId = field(draft, "id");
  const existing = typeof rawId === "string" && rawId ? menu.find((c) => c.id === rawId) : undefined;
  if (rawId && !existing) errors.id = "La categoría ya no existe.";

  const rows = list(field(draft, "groups")).slice(0, 20);
  const taken = new Set<string>();
  const groups = rows.map((row, i) => {
    // Con un solo grupo no se muestra ningún subtítulo: si quedó sin nombre, usa el de la categoría.
    const single = rows.length === 1;
    const groupName = cleanText(field(row, "name"), 40) || (single ? name : "");
    if (!groupName && !single) errors[`groups.${i}.name`] = "Falta el nombre del grupo.";
    const previous = existing?.subcategories.find((s) => s.id === field(row, "id"));
    const id = previous && !taken.has(previous.id) ? previous.id : uniqueId(groupName || name, taken, "grupo");
    taken.add(id);
    return { id, name: groupName, products: previous?.products ?? [] };
  });
  if (!groups.length) groups.push({ id: uniqueId(name, [], "grupo"), name, products: [] });

  for (const removed of existing?.subcategories.filter((s) => !taken.has(s.id)) ?? []) {
    if (removed.products.length) errors.groups = `"${removed.name}" tiene productos: movelos antes de borrar el grupo.`;
  }
  const flags: Pick<Category, "emoji" | "kind" | "hideNotes"> = {};
  const emoji = cleanEmoji(field(draft, "emoji"));
  if (emoji === null) errors.emoji = "Poné un emoji (ej: 🍕) o dejalo vacío.";
  else if (emoji) flags.emoji = emoji;
  if (field(draft, "offers") === true) flags.kind = "offers";
  if (field(draft, "hideNotes") === true) flags.hideNotes = true;

  if (Object.keys(errors).length) return { ok: false, errors };

  if (existing) {
    existing.name = name;
    if (imageUrl) existing.imageUrl = imageUrl;
    else delete existing.imageUrl;
    delete existing.emoji;
    delete existing.kind;
    delete existing.hideNotes;
    Object.assign(existing, flags);
    existing.subcategories = groups;
    return { ok: true, value: existing.id };
  }
  const id = uniqueId(name, menu.map((c) => c.id), "categoria");
  menu.push({ id, name, ...(imageUrl ? { imageUrl } : {}), ...flags, subcategories: groups });
  return { ok: true, value: id };
}

export function removeCategory(menu: Category[], categoryId: string): FormResult<null> {
  const index = menu.findIndex((c) => c.id === categoryId);
  if (index < 0) return { ok: false, errors: { id: "La categoría ya no existe." } };
  if (menu[index].subcategories.some((s) => s.products.length)) {
    return { ok: false, errors: { id: "La categoría tiene productos: borralos o movelos primero." } };
  }
  menu.splice(index, 1);
  return { ok: true, value: null };
}

/* -------------------------------------------------------------------- Ajustes */

export function buildStoreInfo(
  input: unknown,
): FormResult<Pick<Business, "name" | "description" | "highlight" | "whatsapp" | "instagram" | "address">> {
  const errors: FieldErrors = {};
  const name = cleanText(field(input, "name"), 60);
  if (name.length < 2) errors.name = "Escribí el nombre del local.";
  const description = cleanText(field(input, "description"), 200);
  const highlight = cleanText(field(input, "highlight"), 80);
  const whatsapp = toWhatsAppNumber(cleanText(field(input, "whatsapp"), 30));
  if (!/^\d{10,15}$/.test(whatsapp)) errors.whatsapp = "Revisá el número (con característica, sin 0 ni 15).";
  const instagram = cleanText(field(input, "instagram"), 31).replace(/^@/, "");
  if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) errors.instagram = "Usuario inválido.";
  const address = field(input, "address");
  const street = cleanText(field(address, "street"), 80);
  const city = cleanText(field(address, "city"), 60);
  const province = cleanText(field(address, "province"), 60);
  const lat = field(address, "lat");
  const lng = field(address, "lng");
  if (street.length < 3) errors["address.street"] = "Escribí la dirección.";
  if (city.length < 2) errors["address.city"] = "Escribí la ciudad.";
  if (province.length < 2) errors["address.province"] = "Escribí la provincia.";
  const validPoint =
    typeof lat === "number" && typeof lng === "number" && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (!validPoint) errors["address.location"] = "Marcá el local en el mapa.";
  return done(
    {
      name,
      description: description || undefined,
      highlight: highlight || undefined,
      whatsapp,
      instagram: instagram || undefined,
      address: { street, city, province, lat: validPoint ? lat : 0, lng: validPoint ? lng : 0 },
    },
    errors,
  );
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3));

export function buildSchedule(
  input: unknown,
): FormResult<{ schedule: WeeklySchedule; acceptOrdersWhenClosed: boolean }> {
  const errors: FieldErrors = {};
  const days = field(input, "schedule");
  const schedule = {} as WeeklySchedule;
  for (const day of [0, 1, 2, 3, 4, 5, 6] as Weekday[]) {
    const ranges = list(field(days, String(day))).slice(0, 3);
    schedule[day] = ranges.map((range, i): TimeRange => {
      const open = cleanText(field(range, "open"), 5);
      const close = cleanText(field(range, "close"), 5);
      if (!TIME.test(open) || !TIME.test(close) || open === close) {
        errors[`schedule.${day}.${i}`] = "Revisá el horario.";
      }
      return { open, close };
    });
    const sorted = [...schedule[day]].sort((a, b) => toMinutes(a.open) - toMinutes(b.open));
    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1];
      const previousEnd = toMinutes(previous.close) <= toMinutes(previous.open) ? 24 * 60 : toMinutes(previous.close);
      if (toMinutes(sorted[i].open) < previousEnd) errors[`schedule.${day}`] = "Las franjas se superponen.";
    }
    schedule[day] = sorted;
  }
  return done({ schedule, acceptOrdersWhenClosed: field(input, "acceptOrdersWhenClosed") === true }, errors);
}

export function buildDelivery(input: unknown): FormResult<DeliverySettings> {
  const errors: FieldErrors = {};
  const pickup = field(input, "pickup") === true;
  const delivery = field(input, "delivery") === true;
  if (!pickup && !delivery) errors.methods = "Activá al menos una forma de entrega.";
  const rows = list(field(input, "zones"));
  if (rows.length > 8) errors.zones = "Hasta 8 zonas.";
  const taken = new Set<string>();
  const zones = rows.slice(0, 8).map((zone, i) => {
    const name = cleanText(field(zone, "name"), 40);
    const cost = toAmount(field(zone, "cost"));
    if (name.length < 2) errors[`zones.${i}.name`] = "Poné el nombre de la zona.";
    if (cost === null) errors[`zones.${i}.cost`] = "Poné el costo (0 si es gratis).";
    return { id: keepId(field(zone, "id"), name, taken, "zona"), name, cost: cost ?? 0 };
  });
  const names = zones.map((z) => z.name.toLowerCase());
  if (new Set(names).size !== names.length) errors.zones = "Hay dos zonas con el mismo nombre.";
  const rawMin = field(input, "minOrder");
  const minOrder = rawMin === "" || rawMin === null || rawMin === undefined ? 0 : toAmount(rawMin);
  if (minOrder === null) errors.minOrder = "Monto inválido.";
  const result: DeliverySettings = { pickup, delivery, zones };
  if (minOrder) result.minOrder = minOrder;
  return done(result, errors);
}

export function buildPayments(input: unknown): FormResult<PaymentSettings> {
  const errors: FieldErrors = {};
  const cash = field(input, "cash") === true;
  const transferOn = field(input, "transferEnabled") === true;
  let transfer: PaymentSettings["transfer"] = null;
  if (transferOn) {
    const raw = field(input, "transfer");
    const alias = cleanText(field(raw, "alias"), 20);
    const cbu = cleanText(field(raw, "cbu"), 30).replace(/\D/g, "");
    const holder = cleanText(field(raw, "holder"), 80);
    const bank = cleanText(field(raw, "bank"), 40);
    if (!/^[A-Za-z0-9.-]{6,20}$/.test(alias)) errors["transfer.alias"] = "El alias tiene de 6 a 20 letras, números o puntos.";
    if (!/^\d{22}$/.test(cbu)) errors["transfer.cbu"] = "El CBU/CVU tiene 22 números.";
    if (holder.length < 2) errors["transfer.holder"] = "Escribí el titular de la cuenta.";
    transfer = { alias, cbu, holder, ...(bank ? { bank } : {}) };
  }
  if (!cash && !transfer) errors.methods = "Activá al menos una forma de pago.";
  const mixed = field(input, "mixed") === true && cash && Boolean(transfer);
  return done({ cash, transfer, mixed }, errors);
}

export function buildAppearance(
  input: unknown,
): FormResult<{ theme: Theme; logoUrl: string; coverUrl?: string }> {
  const errors: FieldErrors = {};
  const primary = cleanText(field(input, "primary"), 7);
  const accent = cleanText(field(input, "accent"), 7);
  if (!HEX_COLOR.test(primary)) errors.primary = "Elegí un color.";
  if (!HEX_COLOR.test(accent)) errors.accent = "Elegí un color.";
  const logoUrl = cleanImageUrl(field(input, "logoUrl"));
  if (!logoUrl) errors.logoUrl = "Subí el logo del local.";
  const coverUrl = cleanImageUrl(field(input, "coverUrl"));
  return done({ theme: { primary: primary.toLowerCase(), accent: accent.toLowerCase() }, logoUrl: logoUrl ?? "", coverUrl }, errors);
}

/* -------------------------------------------------------------------- Cupones */

export function buildCoupon(input: unknown, existing: Coupon[], originalCode: string | null): FormResult<Coupon> {
  const errors: FieldErrors = {};
  const code = cleanText(field(input, "code"), 20).toUpperCase();
  if (!/^[A-Z0-9]{3,20}$/.test(code)) errors.code = "De 3 a 20 letras o números, sin espacios.";
  else if (code !== originalCode && existing.some((c) => c.code === code)) errors.code = "Ya existe un cupón con ese código.";
  const type = field(input, "type") === "fixed" ? "fixed" : "percent";
  const value = type === "percent" ? toInt(field(input, "value"), 1, 90) : toAmount(field(input, "value"));
  if (value === null || value === 0) errors.value = type === "percent" ? "Entre 1 y 90 %." : "Poné el monto del descuento.";
  const rawMin = field(input, "minSubtotal");
  const minSubtotal = rawMin === "" || rawMin === null || rawMin === undefined ? 0 : toAmount(rawMin);
  if (minSubtotal === null) errors.minSubtotal = "Monto inválido.";
  const coupon: Coupon = { code, type, value: value ?? 0, active: field(input, "active") !== false };
  if (minSubtotal) coupon.minSubtotal = minSubtotal;
  return done(coupon, errors);
}

/* ------------------------------------------------- Borradores para el formulario */

const asText = (value: number | undefined) => (value === undefined ? "" : String(value));

export function emptyProductDraft(menu: Category[], categoryId?: string): ProductDraft {
  const category = menu.find((c) => c.id === categoryId) ?? menu[0];
  return {
    id: null,
    name: "",
    description: "",
    imageUrl: "",
    categoryId: category?.id ?? "",
    subcategoryId: category?.subcategories[0]?.id ?? "",
    newGroupName: "",
    hasVariants: false,
    price: "",
    variants: [
      { id: null, name: "", price: "" },
      { id: null, name: "", price: "" },
    ],
    optionGroups: [],
    isOffer: category?.kind === "offers",
    bundle: [],
    soldOut: false,
    featured: false,
  };
}

export function toProductDraft(menu: Category[], productId: string): ProductDraft | null {
  const current = locate(menu, productId);
  if (!current) return null;
  const product = current.subcategory.products[current.index];
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
    categoryId: current.category.id,
    subcategoryId: current.subcategory.id,
    newGroupName: "",
    hasVariants: Boolean(product.variants?.length),
    price: asText(product.price),
    variants: product.variants?.length
      ? product.variants.map((v) => ({ id: v.id, name: v.name, price: String(v.price) }))
      : [
          { id: null, name: "", price: "" },
          { id: null, name: "", price: "" },
        ],
    optionGroups: (product.optionGroups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      min: String(group.min),
      max: asText(group.max),
      options: group.options.map((o) => ({
        id: o.id,
        name: o.name,
        price: o.price ? String(o.price) : "",
        maxQty: o.maxQty && o.maxQty > 1 ? String(o.maxQty) : "",
      })),
    })),
    isOffer: Boolean(product.isOffer || product.bundle?.length || current.category.kind === "offers"),
    bundle: (product.bundle ?? []).map((item) => ({
      productId: item.productId,
      variantId: item.variantId ?? "",
      qty: String(item.qty),
    })),
    soldOut: Boolean(product.soldOut),
    featured: Boolean(product.featured),
  };
}

/** El producto tal como se vería en la tienda, para la vista previa del editor. */
export function previewProduct(draft: ProductDraft): Product {
  const product: Product = {
    id: draft.id ?? "vista-previa",
    name: draft.name.trim() || "Nombre del producto",
    description: draft.description.trim() || undefined,
    imageUrl: cleanImageUrl(draft.imageUrl),
    soldOut: draft.soldOut || undefined,
    isOffer: draft.isOffer || undefined,
  };
  const bundle = (draft.isOffer ? draft.bundle : [])
    .map((item) => ({ productId: item.productId, variantId: item.variantId || undefined, qty: toInt(item.qty, 1, 20) ?? 1 }))
    .filter((item) => item.productId);
  if (bundle.length) product.bundle = bundle;
  if (draft.hasVariants) {
    const variants = draft.variants
      .map((v, i) => ({ id: `v${i}`, name: v.name || "—", price: toAmount(v.price) ?? 0 }))
      .filter((v) => v.price > 0);
    product.variants = variants.length ? variants : [{ id: "v0", name: "—", price: 0 }];
  } else {
    product.price = toAmount(draft.price) ?? 0;
  }
  return product;
}

export function toCategoryDraft(category: Category): CategoryDraft {
  return {
    id: category.id,
    name: category.name,
    imageUrl: category.imageUrl ?? "",
    emoji: category.emoji ?? "",
    offers: category.kind === "offers",
    hideNotes: Boolean(category.hideNotes),
    groups: category.subcategories.map((s) => ({ id: s.id, name: s.name })),
  };
}
