import SettingsTabs from "@/components/admin/settings/SettingsTabs";
import { requireAdminStore } from "@/lib/server/session";

export default async function SettingsPage() {
  const store = await requireAdminStore();
  return <SettingsTabs business={store.business} />;
}
