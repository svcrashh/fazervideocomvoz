# PRONTO — tela-real-com-camera (02/10/2026)

## O que tem na pasta
- `montar.mjs`: lê os parâmetros, a gravação do gravador da skill e a locução, monta o projeto do motor, renderiza cada formato, mixa a voz e tira a folha de quadros.
- `cena.js` + `index.html`: a composição (câmera, véu + desfoque, cartão de passo, intertítulo, karaokê, "Pronto!"). Tudo o que é da marca vem dos parâmetros.
- `exemplo.json` (Lumma One) e `exemplo-pomar.json` (Pomar, marca fictícia).
- `MOLDE.md`: o que é, quando usar e quando não, os parâmetros, as variações, como renderizar e os limites.

## O que foi provado (renderizado e olhado)
Vídeos finais em `~/Desktop/moldes-teste/tela-real-com-camera/videos/`, todos a 60 fps com motion blur e a voz mixada:

| vídeo | duração | formato |
|---|---|---|
| `lumma-qr-do-kit-16x9.mp4` | 17,0 s | 1920×1080 |
| `lumma-qr-do-kit-9x16.mp4` | 17,0 s | 1080×1920 |
| `pomar-montar-cesta-16x9.mp4` | 18,4 s | 1920×1080 |
| `pomar-montar-cesta-9x16.mp4` | 18,4 s | 1080×1920 |

Cada um tem a sua `-folha.png` (24 quadros), e eu olhei as quatro.
- **A promessa está no quadro 0.** O título aparece inteiro desde o primeiro quadro, sobre a tela velada, e a legenda karaokê da abertura já está na tela.
- **A tela nunca aparece encolhida enquanto se fala dela.** O plano geral dura 1 s, só para situar. Depois a câmera vai até o campo da vez.
  - No 16:9, o zoom fica entre 1,9× e 3,3× (px do quadro por px CSS). Um texto de 14–16 px do app chega a 34–39 px, ou seja, ≥ 3% da altura.
  - No 9:16, o zoom fica entre 3,0× e 3,3×.
- **O destaque é véu + desfoque.** O campo fica nítido, com um contorno fino na cor de destaque. O véu é escuro nas duas marcas.
- **Cartão de passo:** "Passo N de 4" + a frase do `g.passo`, com a barra de progresso. Nos dois formatos ele fica dentro da área segura do Reels (corrigi o 9:16, que saía em x 980 > 940 e y 184 < 250).
- **Intertítulo** de 2–3 palavras entre as etapas: "Agora o QR" e "A entrega".
- **"Pronto!"** abre num círculo a partir do último campo, com o logo, a linha de apoio e a fala de fecho com karaokê.
- **Duas marcas bem diferentes, sem mudar uma linha do molde:**
  - Lumma: escura, Oswald/Rubik/Source Code Pro, laranja, gravação real em lummaone.com.
  - Pomar: creme claro, Bricolage/Space Grotesk, rosa-goiaba e verde, um app estático feito para o teste.
- **16:9 e 9:16 recompostos da mesma gravação:** cartão à esquerda no 16:9, no alto no 9:16, e o campo centrado na área livre de cada formato.
- **Voz:** duas falas curtas por marca, pela ElevenLabs, numa geração só, sem nenhuma tentativa repetida. Gastei 70 créditos.
  - A pronúncia foi conferida por transcrição (`voz.mjs ouvir`): 4 de 4 falas com as palavras de risco ouvidas ("kit", "cesta", "quinta").
  - A voz fala cerca de 35% do tempo.
  - Loudness medido: −16,2 LUFS.
- **Gravação Lumma:** conta `primo@lummaone.com`, com `presskit_analytics_events`, `record_device` e o RUM bloqueados por rota. Nada foi salvo nem publicado, e o kit `primoteste` não foi mexido. Os detalhes estão em `gravacoes/lumma/NOTAS.md`.
- **Checagem do motor (`quadros.cjs`):** sobrou um aviso no quadro 0 ("MOSTRE O QR" coberto pela linha de baixo em 33% dos pontos). Ele vem das máscaras das duas linhas do título, que se encostam. Aumentei a entrelinha para 1,26, mas não rodei a checagem de novo depois disso.

## O que ficou de fora
- **1:1:** a ficha não pede, e eu não fiz.
- **Celular gravado em viewport de celular:** o 9:16 recompõe a gravação de computador. Para app de celular, o modo tutorial da skill continua valendo.
- **Trilha e efeitos de som:** só a voz entra.
- **Critério do catálogo "Entrar pelo convite do SIPEI refeito":** não refiz. A prova foi com o Lumma e a Pomar.
- **Moldura de notebook:** o plano geral usa uma moldura de navegador simples, com o domínio na barra.

## O que eu não consegui conferir
- **O som:** eu não ouço. A transcrição confirma as palavras e o loudness foi medido. Mas a entonação, a voz combinar com cada marca, e algum estalo ou respiração ficam para o ouvido do dono. A Pomar usa a mesma voz do Lumma (Davi Andrei), no perfil calmo: para uma marca real, escolha a voz com `voz.mjs amostras`.
- **Fantasma no 9:16 da Pomar:** em 1–2 quadros, o cartão de sucesso aparece duplicado. Ele entra deslizando no próprio app, e o motion blur junta dois quadros da gravação no zoom de 3×. Não corrigi.
- **No 9:16 sobra uma faixa de baixo** (y ≈ 1300–1920) com a tela velada e desfocada, e ela só ganha a legenda quando há voz. Não está vazia, mas é espaço pouco usado.
- **Texto de 14 px no 9:16:** chega a ~42 px, que é 2,2% da altura (abaixo dos 3%) e 3,9% da largura. Para mais, a gravação precisa de texto maior ou de DSF 4.
