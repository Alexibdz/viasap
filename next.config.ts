import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir `npm run dev` desde el celular en la misma red (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  experimental: {
    // Fotos del panel: se achican en el navegador, pero dejamos margen.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
