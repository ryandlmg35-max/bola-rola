import { useEffect, useState, type ReactNode } from "react";

/** Evita divergência de hidratação: só renderiza depois que o estado salvo carrega. */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  if (!pronto) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Carregando…</div>;
  }
  return <>{children}</>;
}
