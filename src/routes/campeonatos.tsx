import { Link, createFileRoute } from "@tanstack/react-router";

import { ClientOnly } from "@/components/ClientOnly";
import { Layout } from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { DEFS } from "@/sim/competicoes";
import { useSim } from "@/sim/store";
import type { Regiao } from "@/sim/types";

export const Route = createFileRoute("/campeonatos")({
  head: () => ({
    meta: [
      { title: "Campeonatos — Simulador Futebol" },
      {
        name: "description",
        content:
          "Todas as competições do simulador: Séries A, B e C, Copa do Brasil, cinco ligas europeias, Champions, Libertadores e Mundial.",
      },
      { property: "og:title", content: "Campeonatos — Simulador Futebol" },
      {
        property: "og:description",
        content: "Escolha uma competição para simular rodadas e ver a classificação.",
      },
    ],
  }),
  component: Campeonatos,
});

const TITULOS: Record<Regiao, string> = {
  brasil: "Brasil",
  europa: "Ligas europeias",
  internacional: "Competições internacionais",
};

function Campeonatos() {
  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Campeonatos</h1>
      <ClientOnly>
        <Lista />
      </ClientOnly>
    </Layout>
  );
}

function Lista() {
  const competicoes = useSim((s) => s.competicoes);
  const clubes = useSim((s) => s.clubes);

  return (
    <div className="space-y-8">
      {(["brasil", "europa", "internacional"] as Regiao[]).map((regiao) => (
        <section key={regiao}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {TITULOS[regiao]}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEFS.filter((d) => d.regiao === regiao).map((d) => {
              const comp = competicoes[d.id];
              const campeao = comp?.campeao ? clubes[comp.campeao]?.nome : null;
              return (
                <Link
                  key={d.id}
                  to="/campeonato/$id"
                  params={{ id: d.id }}
                  className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{d.nome}</span>
                    <Badge variant={d.implementado === "completo" ? "default" : "secondary"}>
                      {d.implementado}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">
                    {d.observacao}
                  </p>
                  <p className="mt-2 text-xs text-primary">
                    {campeao ? `Campeão: ${campeao}` : comp ? "Em andamento" : "Não iniciada"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
