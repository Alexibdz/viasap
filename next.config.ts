import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir `npm run dev` desde el celular en la misma red (http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // La tienda de ejemplo antes se llamaba Doble Queso: los links viejos siguen andando.
  redirects: async () => [
    { source: "/doble-queso", destination: "/rotiseria-alexis", permanent: true },
    { source: "/doble-queso/:path*", destination: "/rotiseria-alexis/:path*", permanent: true },
  ],
  experimental: {
    // Fotos del panel: se achican en el navegador, pero dejamos margen.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
