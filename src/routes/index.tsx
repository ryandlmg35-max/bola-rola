import { Link, createFileRoute } from "@tanstack/react-router";
import { CalendarClock, Database, PlayCircle, RefreshCw, Trophy } from "lucide-react";

import { ClientOnly } from "@/components/ClientOnly";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFS } from "@/sim/competicoes";
import { notaClube, useSim } from "@/sim/store";
import type { ModoSimulacao } from "@/sim/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simulador Futebol — Painel de temporada" },
      {
        name: "description",
        content:
          "Simule Brasileirão Séries A, B e C, ligas europeias e torneios internacionais, com tabelas, elencos editáveis e avanço de temporada.",
      },
      { property: "og:title", content: "Simulador Futebol — Painel de temporada" },
      {
        property: "og:description",
        content:
          "Simulador de campeonatos com tabelas, calendário, elencos editáveis e progressão entre temporadas.",
      },
    ],
  }),
  component: Painel,
});

function Painel() {
  return (
    <Layout>
      <ClientOnly>
        <Conteudo />
      </ClientOnly>
    </Layout>
  );
}

function Conteudo() {
  const st = useSim();
  const clube = st.clubeSelecionado ? st.clubes[st.clubeSelecionado] : null;

  const destaques = DEFS.filter((d) =>
    ["serie-a", "serie-b", "serie-c", "copa-do-brasil"].includes(d.id),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Temporada em curso</p>
            <h1 className="text-3xl font-bold tracking-tight">Temporada {st.temporada}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={st.modo}
              onValueChange={(v) => st.setModo(v as ModoSimulacao)}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nota">Modo: nota de elenco</SelectItem>
                <SelectItem value="aleatorio">Modo: aleatório</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={st.simularTudo}>
              <PlayCircle className="mr-2 h-4 w-4" /> Simular tudo
            </Button>
            <Button variant="secondary" onClick={st.avancarTemporada}>
              <CalendarClock className="mr-2 h-4 w-4" /> Avançar temporada
            </Button>
            <Button variant="outline" onClick={st.resetar}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reiniciar
            </Button>
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Tudo é salvo automaticamente no seu navegador. No modo “nota de elenco” o
          resultado depende da média do elenco (com vantagem de mando de campo); no modo
          “aleatório” os placares são sorteados.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Trophy className="h-4 w-4 text-primary" /> Competições do Brasil
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {destaques.map((d) => {
              const comp = st.competicoes[d.id];
              const campeao = comp?.campeao ? st.clubes[comp.campeao]?.nome : null;
              return (
                <Link
                  key={d.id}
                  to="/campeonato/$id"
                  params={{ id: d.id }}
                  className="rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{d.nome}</span>
                    <Badge variant={d.implementado === "completo" ? "default" : "secondary"}>
                      {d.implementado}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {campeao ? `Campeão: ${campeao}` : comp ? "Em andamento" : "Não iniciada"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Seu clube</h2>
          {clube ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: clube.cor }}
                />
                <span className="font-medium">{clube.nome}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Nota do elenco: <strong>{notaClube(clube)}</strong> · {clube.elenco.length}{" "}
                jogadores
              </p>
              <Button asChild className="mt-4 w-full" variant="secondary">
                <Link to="/elenco" search={{ clube: clube.id }}>
                  Editar elenco
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum clube selecionado.</p>
          )}
          <div className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Database className="h-3.5 w-3.5" /> Fonte dos dados: demonstração
            </p>
            <p className="mt-1">
              {st.api.mensagem ??
                "Nenhuma credencial de API configurada — os dados são de demonstração."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={!!st.api.carregando}
              onClick={() => void st.atualizarDados()}
            >
              {st.api.carregando ? `Verificando ${st.api.carregando}…` : "Verificar fonte"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
