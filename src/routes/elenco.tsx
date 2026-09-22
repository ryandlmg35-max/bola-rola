import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ClientOnly } from "@/components/ClientOnly";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notaClube, useSim } from "@/sim/store";
import type { Posicao } from "@/sim/types";

const POSICOES: Posicao[] = ["GOL", "ZAG", "LAT", "VOL", "MEI", "ATA"];

export const Route = createFileRoute("/elenco")({
  validateSearch: (search: Record<string, unknown>) => ({
    clube: typeof search.clube === "string" ? search.clube : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Elenco e perfil do clube — Simulador Futebol" },
      {
        name: "description",
        content:
          "Edite jogadores, notas e posições do elenco e acompanhe o histórico do clube entre temporadas.",
      },
      { property: "og:title", content: "Elenco e perfil do clube — Simulador Futebol" },
      {
        property: "og:description",
        content: "Editor de elenco com impacto direto na simulação das partidas.",
      },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <Layout>
      <ClientOnly>
        <Conteudo />
      </ClientOnly>
    </Layout>
  );
}

function Conteudo() {
  const navigate = useNavigate();
  const { clube: clubeBusca } = Route.useSearch();
  const st = useSim();
  const clubeId = clubeBusca ?? st.clubeSelecionado ?? Object.keys(st.clubes)[0];
  const clube = st.clubes[clubeId];

  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState<Posicao>("MEI");
  const [nota, setNota] = useState(70);

  if (!clube) return <p className="text-muted-foreground">Clube não encontrado.</p>;

  const ordenados = [...clube.elenco].sort(
    (a, b) => POSICOES.indexOf(a.posicao) - POSICOES.indexOf(b.posicao) || b.nota - a.nota,
  );

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="h-8 w-8 rounded-full"
              style={{ backgroundColor: clube.cor }}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{clube.nome}</h1>
              <p className="text-sm text-muted-foreground">
                {clube.pais} · Nota do elenco <strong>{notaClube(clube)}</strong>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={clubeId}
              onValueChange={(v) => {
                st.selecionarClube(v);
                void navigate({ to: "/elenco", search: { clube: v } });
              }}
            >
              <SelectTrigger className="w-[240px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {Object.values(st.clubes)
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.pais})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => st.selecionarClube(clubeId)}>
              Definir como meu clube
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Adicionar jogador</h2>
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do jogador"
            />
          </div>
          <div>
            <Label>Posição</Label>
            <Select value={posicao} onValueChange={(v) => setPosicao(v as Posicao)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POSICOES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="nota">Nota (40–99)</Label>
            <Input
              id="nota"
              type="number"
              min={40}
              max={99}
              value={nota}
              onChange={(e) => setNota(Number(e.target.value))}
            />
          </div>
          <Button
            onClick={() => {
              if (!nome.trim()) return;
              st.adicionarJogador(clubeId, {
                nome: nome.trim(),
                posicao,
                nota: Math.max(40, Math.min(99, nota)),
              });
              setNome("");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3 font-semibold">
          Elenco ({clube.elenco.length})
        </div>
        <div className="divide-y divide-border/60">
          {ordenados.map((j) => (
            <div
              key={j.id}
              className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm"
            >
              <Input
                className="h-9 w-48 flex-1"
                value={j.nome}
                onChange={(e) =>
                  st.atualizarJogador(clubeId, { ...j, nome: e.target.value })
                }
              />
              <Select
                value={j.posicao}
                onValueChange={(v) =>
                  st.atualizarJogador(clubeId, { ...j, posicao: v as Posicao })
                }
              >
                <SelectTrigger className="h-9 w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSICOES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="h-9 w-20"
                type="number"
                min={40}
                max={99}
                value={j.nota}
                onChange={(e) =>
                  st.atualizarJogador(clubeId, {
                    ...j,
                    nota: Math.max(40, Math.min(99, Number(e.target.value))),
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => st.removerJogador(clubeId, j.id)}
                aria-label={`Remover ${j.nome}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Histórico</h2>
        {clube.historico.length ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {clube.historico
              .slice()
              .reverse()
              .map((h, i) => (
                <li key={i}>
                  Temporada {h.temporada} · {h.competicao} — {h.posicao}º lugar
                </li>
              ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem histórico ainda. Simule uma temporada e avance para registrar campanhas.
          </p>
        )}
      </section>
    </div>
  );
}
