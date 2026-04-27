/**
 * Auth pages layout — tema selalu aurora.
 * Halaman login/register/forgot-password adalah milik platform,
 * bukan tenant, jadi tidak ikut tema tenant.
 */
"use client";

import { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "aurora");
  }, []);

  return <>{children}</>;
}
