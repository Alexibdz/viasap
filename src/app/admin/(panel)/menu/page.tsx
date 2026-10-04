import MenuManager from "@/components/admin/MenuManager";
import { requireAdminStore } from "@/lib/server/session";

export default async function MenuPage() {
  const store = await requireAdminStore();
  return <MenuManager menu={store.menu} />;
}
