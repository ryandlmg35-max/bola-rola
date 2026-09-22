import { Link } from "@tanstack/react-router";

import type { Clube, LinhaTabela, ZonaTabela } from "@/sim/types";

function classeZona(pos: number, zonas: ZonaTabela[]) {
  const z = zonas.find((zz) => pos >= (zz.desde ?? 1) && pos <= zz.ate);
  return z?.classe ?? "";
}

export function Tabela({
  linhas,
  clubes,
  zonas,
  titulo,
}: {
  linhas: LinhaTabela[];
  clubes: Record<string, Clube>;
  zonas: ZonaTabela[];
  titulo?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {titulo ? (
        <div className="border-b border-border px-4 py-2 text-sm font-semibold">
          {titulo}
        </div>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2 text-left font-medium">#</th>
              <th className="px-3 py-2 text-left font-medium">Clube</th>
              {["P", "J", "V", "E", "D", "GP", "GC", "SG"].map((h) => (
                <th key={h} className="w-10 px-2 py-2 text-center font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => {
              const c = clubes[l.clubeId];
              return (
                <tr
                  key={l.clubeId}
                  className={`border-b border-border/50 last:border-0 ${classeZona(i + 1, zonas)}`}
                >
                  <td className="px-3 py-1.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-1.5">
                    <Link
                      to="/elenco"
                      search={{ clube: l.clubeId }}
                      className="flex items-center gap-2 hover:text-primary"
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c?.cor }}
                      />
                      <span className="truncate">{c?.nome ?? l.clubeId}</span>
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 text-center font-semibold">{l.pontos}</td>
                  <td className="px-2 py-1.5 text-center">{l.jogos}</td>
                  <td className="px-2 py-1.5 text-center">{l.vitorias}</td>
                  <td className="px-2 py-1.5 text-center">{l.empates}</td>
                  <td className="px-2 py-1.5 text-center">{l.derrotas}</td>
                  <td className="px-2 py-1.5 text-center">{l.golsPro}</td>
                  <td className="px-2 py-1.5 text-center">{l.golsContra}</td>
                  <td className="px-2 py-1.5 text-center">{l.saldo}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {zonas.length ? (
        <div className="flex flex-wrap gap-3 border-t border-border px-4 py-2 text-xs text-muted-foreground">
          {zonas.map((z) => (
            <span key={z.rotulo} className={`${z.classe} pl-2`}>
              {z.rotulo}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
