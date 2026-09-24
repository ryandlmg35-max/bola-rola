# Bola Rola

Crie um aplicativo web chamado “Simulador Futebol”, uma aplicação de simulação de campeonatos, não um jogo controlável. Construa uma primeira versão funcional e coerente, não apenas uma landing page ou mockup. Stack padrão Lovable (React + TypeScript + Tailwind + shadcn/ui), estado global organizado (Zustand se adequado), persistência localStorage. Interface em português brasileiro, tema escuro premium com verde gramado, responsiva para desktop/mobile, navegação por Dashboard, Campeonatos e Perfil do time.

REQUISITOS FUNCIONAIS:
1) Dashboard com cards de Brasil, Europa e Internacional, status de competições, temporada atual, progresso e ação “Simular tudo”.
2) Competições nacionais: Brasil Série A (20 clubes, 38 rodadas, 4 rebaixados, 6 vagas Libertadores sendo 4 diretas + 2 preliminares, 8 Sul-Americana); Série B (20, 38, sobem 4/descem 4); Série C (20, fase única turno único de 19 rodadas, top 8 em dois quadrangulares, campeões sobem, quatro últimos descem). Copa do Brasil simplificada com 20 clubes Série A + 12 convidados, mata-mata ida/volta exceto final, campeão classifica Libertadores. Europa: Premier League, La Liga, Serie A italiana (20 clubes/38 rodadas), Bundesliga e Ligue 1 (18/34), regras de rebaixamento e vagas europeias conforme especificação fornecida pelo usuário.
3) Competições internacionais simuladas: Champions, Europa e Conference com 36 clubes, 8 jogos por clube, top 8 direto às oitavas, 9º-24º playoff; Libertadores e Sul-Americana em grupos e mata-mata; Mundial 32 clubes, grupos e mata-mata. Criar montagem de participantes por classificação/campeões quando possível; deixar claro qualquer simplificação.
4) Simulação de resultados: modo “Nota de elenco” e modo “Aleatório”. Nota 0-100, mandante +3, probabilidades suaves e não determinísticas, gols coerentes com força; modo aleatório ignora notas e sorteia resultados/gols. Mostrar modo usado.
5) Simular rodada, turno e temporada completa; botão avançar temporada com promoção/rebaixamento automáticos e histórico de divisão por clube. Simulação de temporada deve ser rápida, sem animação bloqueante; resultados podem aparecer com animação leve.
6) Tabela de classificação com pontos, jogos, vitórias, empates, derrotas, gols pró/contra/saldo, zonas coloridas e lista de rodadas/resultados. Ordenação correta por pontos, saldo e gols pró.
7) Tela de clube: escudo/logo se houver ou iniciais, nota geral, resultados e elenco editável. Adicionar/editar/remover jogador, nome, posição e nota 0-100. Nota do clube é média das notas individuais e atualiza imediatamente.
8) Persistência localStorage para clubes, elencos, notas, resultados, temporadas e configurações; recuperar estado ao reabrir. Botão de reset com confirmação.
9) Dados/API: criar uma camada de serviço preparada para Football-Data.org ou API-Football, com estado de carregamento/progresso por liga, cache e botão “Atualizar dados”. Não exponha chaves secretas no frontend; se não houver credencial configurada, usar conjuntos iniciais locais claramente identificados como dados de demonstração, permitindo usar o simulador sem API. Não alegar que os dados são oficiais/verificados. Football-Data.org pode não fornecer elencos completos/notas EA FC; representar ausências honestamente e permitir edição manual. Preparar configuração segura para integração futura.
10) Fornecer dados iniciais demonstrativos para que o app abra utilizável, priorizando clubes brasileiros e europeus conhecidos. Não afirmar que elencos são atuais ou oficiais sem fonte. Evitar copiar ratings protegidos do EA FC; usar notas sintéticas claramente rotuladas.

IMPLEMENTAÇÃO: Comece com uma base completa funcional e bem organizada, componentes reutilizáveis, tipos TypeScript, lógica de calendário e classificação testável. Corrija erros de build. Se não for viável concluir todas as competições internacionais na primeira etapa, implemente a navegação e o modelo de dados, mas priorize funcionalmente Série A/B/C, editor de elenco, modos de simulação, tabela, persistência e avanço de temporada. Deixe explícito na interface o que está implementado e o que é simplificado. Não invente integração API ativa sem credenciais.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cd0de4bc-4df7-476b-b6cc-6227c6af847b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
