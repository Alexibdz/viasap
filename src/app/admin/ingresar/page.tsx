import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { getAdminStore } from "@/lib/server/session";

export default async function LoginPage() {
  if (await getAdminStore()) redirect("/admin");
  // Las credenciales de prueba se muestran solo mientras se desarrolla.
  return <LoginForm showDemo={process.env.NODE_ENV !== "production"} />;
}
