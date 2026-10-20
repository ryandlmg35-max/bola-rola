import { createFileRoute } from "@tanstack/react-router";

import { ClientOnly } from "@/components/ClientOnly";
import { Painel } from "@/rp/Painel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SPACE · Império MR — Roleplay" },
      {
        name: "description",
        content:
          "Simulador de roleplay do império Space: cada ação tem consequência real no caixa, no povo e no vestiário. O mundo continua de onde parou.",
      },
      { property: "og:title", content: "SPACE · Império MR — Roleplay" },
      {
        property: "og:description",
        content:
          "Cada ordem do boss man move os números do império. Salve local, mundo persistente.",
      },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <ClientOnly>
      <Painel />
    </ClientOnly>
  );
}
