import { ArrowRight, CalendarPlus, MapPin, Sparkles, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { localPorId, nomeLocal } from "./viagens";
import type { ConviteReuniao } from "./types";

interface Props {
  convite: ConviteReuniao;
  noLocal: boolean;
  compact?: boolean;
  onIr: () => void;
  onDispensar: () => void;
}

/**
 * Card que nasce quando o chat detecta uma reunião. O botão leva pro mapa 3D
 * de viagem (ou direto pra sala, se o Ryan já estiver no local).
 */
export function ConviteReuniaoCard({ convite, noLocal, compact, onIr, onDispensar }: Props) {
  const local = localPorId(convite.localId);
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-ouro/45 bg-gradient-to-br from-ouro/15 via-card to-background ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-ouro/10 blur-2xl" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-ouro">
            <Sparkles className="h-3 w-3" />
            Reunião detectada
          </div>
          <div className={`mt-0.5 font-bold leading-tight ${compact ? "text-sm" : "text-lg"}`}>
            {convite.titulo}
          </div>
        </div>
        <button
          type="button"
          onClick={onDispensar}
          className="shrink-0 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          aria-label="Dispensar convite"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-ouro" />
          {nomeLocal(local)}
        </span>
        <span className="flex items-center gap-1">
          <CalendarPlus className="h-3 w-3 text-ouro" />
          {convite.quando}
        </span>
        {!compact && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 text-ouro" />
            {convite.participantes.join(" · ")}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          size={compact ? "sm" : "default"}
          onClick={onIr}
          className="bg-ouro font-bold text-black hover:bg-ouro/90"
        >
          {noLocal ? "Entrar na reunião" : "Marcar reunião e ir"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
        <span className="text-[10px] leading-tight text-muted-foreground">
          {noLocal
            ? "Você já está no local. A sala está pronta."
            : "O mapa 3D abre com jatos e helicópteros disponíveis."}
        </span>
      </div>
    </div>
  );
}
