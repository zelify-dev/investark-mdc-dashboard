"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirige la ruta legacy de Mi cuenta al tab Mi perfil dentro de Configuración. */
export default function MyAccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/settings?section=profile");
  }, [router]);

  return <div className="zelify-workspace-page" />;
}
