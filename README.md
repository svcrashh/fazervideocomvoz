# /fazervideocomvoz

**Português** · [English](#english)

A mesma ideia da [/fazervideo](https://github.com/svcrashh/fazervideo), com uma voz narrando por cima,
gerada pela ElevenLabs. Ninguém aparece na tela, e a música abaixa quando a voz fala.

Antes de tudo ela olha o seu produto (o repositório, as telas, o que mudou, para quem é e onde o vídeo vai
passar), **recomenda um estilo e diz por quê em uma linha**, e pergunta qual você quer, com um vídeo de exemplo de
cada. São sete estilos, cada um com um molde de verdade:

| Estilo | Para quê |
|---|---|
| **Tela real com câmera** | tutorial: a tela real, a câmera vai até o campo da vez e escurece o resto, cartão de passo, "Pronto!" no fim |
| **Texto que se digita** | produto com caixa de texto (busca, IA, chat): a pergunta escrita na tela desde o primeiro quadro, e a resposta |
| **Lista que corre** | novidades sem índice: frase curta + prova na tela, em rajada (Reels), lista ou cartaz; o muro com tudo no fim |
| **Número que conta** | um número gigante com rótulo de três palavras; vídeo de 6–20 s ou abertura e fecho dos outros |
| **Antes e depois** | a mesma tela no mesmo lugar, em dois estados, cortada no clique; ou o zoom-out que revela o todo |
| **Teaser de luz** | para ser lembrado: fundo escuro, uma linha de luz desenha pedaços da interface e revela o produto |
| **Capítulos com índice** | 6 a 12 novidades no site ou YouTube: índice numerado, um capítulo de cartaz por novidade, a interface redesenhada |

Nenhum estilo encolhe a tela inteira: o que a voz cita aparece grande. Os dois formatos (16:9 e 9:16) são
recompostos, nunca um recorte do outro.

Ela funciona sozinha: não precisa ter a /fazervideo instalada.

## Instalar

```sh
# Mac e Linux
git clone https://github.com/svcrashh/fazervideocomvoz ~/.claude/skills/fazervideocomvoz
```

```powershell
# Windows
git clone https://github.com/svcrashh/fazervideocomvoz "$HOME\.claude\skills\fazervideocomvoz"
```

Abra o Claude Code no seu projeto e peça `/fazervideocomvoz`, ou "faz um vídeo com narração de …".

## A sua chave da ElevenLabs

A voz sai da SUA conta da ElevenLabs (elevenlabs.io). Crie uma chave de API no painel deles e guarde
no arquivo abaixo. **Nunca cole a chave no chat do Claude.** Rode o comando no terminal: ele pede a
chave sem mostrar na tela.

- **Mac** (Terminal):
  ```sh
  mkdir -p ~/.claude/secrets && read -rs "k?Cole a chave da ElevenLabs: " && printf 'ELEVENLABS_API_KEY=%s\n' "$k" > ~/.claude/secrets/elevenlabs.env && chmod 600 ~/.claude/secrets/elevenlabs.env; unset k; echo
  ```
- **Windows** (PowerShell):
  ```powershell
  $s = Read-Host 'Cole a chave da ElevenLabs' -AsSecureString
  $k = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
  New-Item -ItemType Directory -Force "$HOME\.claude\secrets" | Out-Null
  Set-Content -Path "$HOME\.claude\secrets\elevenlabs.env" -Value "ELEVENLABS_API_KEY=$k" -Encoding ascii
  Remove-Variable k, s
  ```

**Plano:** o grátis serve para testar, mas não permite uso comercial, exige citar a ElevenLabs e não
dá acesso às vozes da biblioteca pela API. Para publicar vídeo de produto, o plano pago mais barato
(Starter) já inclui licença comercial. Uma narração de 30 s gasta uns 200 créditos.

A skill mostra quanto vai gastar antes de gerar, e guarda cada fala aprovada: refazer o vídeo não
gasta de novo.

## O que precisa ter na máquina

Node.js 18 ou mais novo, Python 3, ffmpeg e o Chromium do Playwright. Na primeira vez a skill confere
o que falta e mostra o comando certo para o seu sistema.

- **Mac** (com Homebrew): `brew install node python ffmpeg`
- **Windows** (PowerShell): `winget install OpenJS.NodeJS.LTS`, `winget install Python.Python.3.12`,
  `winget install --id Gyan.FFmpeg -e`

## Como ela trabalha

1. Lê o seu projeto, recomenda o estilo com o porquê e pergunta qual você quer; depois faz o briefing do estilo.
2. Escreve o roteiro de locução e você aprova numa tabela, antes de gastar qualquer crédito. Os nomes
   difíceis (marca, nome próprio, termo em inglês) entram num dicionário de pronúncia.
3. Três vozes leem a primeira frase real do roteiro; você escolhe ouvindo.
4. Gera a voz e **transcreve** cada fala: se um nome difícil não saiu certo, refaz antes de montar.
5. Monta pelo molde do estilo. Capítulos: um capítulo inteiro como gabarito, depois os outros em paralelo, e junta
   tudo com a voz no lugar. Tutorial: grava a tela real segurando cada passo pelo tempo da fala.
6. Trilha original que abaixa sob a voz; mede loudness, sincronia e a voz acima da música.
7. Olha a folha de quadros de cada formato (nada vazio, nada ilegível, nada cortado) antes de entregar.

Voz de uma pessoa real (clone) só com autorização por escrito dessa pessoa, guardada na pasta do vídeo.

A documentação completa está em [`SKILL.md`](SKILL.md) e em [`references/`](references/).

## Licença

[MIT](LICENSE).

---

## English

Same idea as [/fazervideo](https://github.com/svcrashh/fazervideo), with a voice narrating on top, generated by
ElevenLabs. Nobody appears on screen, and the music dips when the voice speaks.

First it looks at your product (the repository, the screens, what changed, who it's for and where the video
will run), **recommends a style with a one-line reason**, and asks which one you want, with an example video of
each. There are seven styles, each backed by a real template:

| Style | For |
|---|---|
| **Real screen with camera** | tutorials: the real screen, the camera moves to the field at hand and dims the rest, step card, "Done!" at the end |
| **Typed text** | products with a text box (search, AI, chat): the question typed on screen from the first frame, then the answer |
| **Running list** | what's new without an index: short line + on-screen proof per item, as a burst (Reels), list or poster; the wall at the end |
| **Number that counts** | one giant number with a three-word label; a 6–20 s video or the opening and closing of the others |
| **Before and after** | the same screen in the same spot, in two states, cut on the click; or the zoom-out that reveals the whole |
| **Light teaser** | to be remembered: dark background, a line of light draws pieces of the interface and reveals the product |
| **Chapters with index** | 6 to 12 new features on a site or YouTube: numbered index, one poster-style chapter per feature, the interface redrawn |

No style shrinks the whole screen: whatever the voice mentions shows up big. Both formats (16:9 and 9:16) are
recomposed, never a crop of each other.

It works on its own: you don't need /fazervideo installed. It talks to you in Portuguese or English, whichever you
use, and the narration can be in either language (pick a native voice for it). Its internal references are written in
Portuguese; Claude reads them and answers in your language.

### Install

```sh
# Mac and Linux
git clone https://github.com/svcrashh/fazervideocomvoz ~/.claude/skills/fazervideocomvoz
```

```powershell
# Windows
git clone https://github.com/svcrashh/fazervideocomvoz "$HOME\.claude\skills\fazervideocomvoz"
```

Open Claude Code in your project and ask for `/fazervideocomvoz`, or "make a narrated video of …".

### Your ElevenLabs key

The voice comes from YOUR ElevenLabs account (elevenlabs.io). Create an API key in their dashboard and save it in the
file below. **Never paste the key into the Claude chat.** Run the command in your terminal: it asks for the key
without showing it on screen.

- **Mac** (Terminal):
  ```sh
  mkdir -p ~/.claude/secrets && read -rs "k?Paste your ElevenLabs key: " && printf 'ELEVENLABS_API_KEY=%s\n' "$k" > ~/.claude/secrets/elevenlabs.env && chmod 600 ~/.claude/secrets/elevenlabs.env; unset k; echo
  ```
- **Windows** (PowerShell):
  ```powershell
  $s = Read-Host 'Paste your ElevenLabs key' -AsSecureString
  $k = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
  New-Item -ItemType Directory -Force "$HOME\.claude\secrets" | Out-Null
  Set-Content -Path "$HOME\.claude\secrets\elevenlabs.env" -Value "ELEVENLABS_API_KEY=$k" -Encoding ascii
  Remove-Variable k, s
  ```

**Plan:** the free plan is fine for testing, but it doesn't allow commercial use, requires crediting ElevenLabs and
doesn't give API access to the voice library. To publish a product video, the cheapest paid plan (Starter) already
includes a commercial license. A 30 s narration uses about 200 credits.

The skill shows how much it will spend before generating, and keeps every approved line: redoing the video doesn't
spend again.

### What your machine needs

Node.js 18 or newer, Python 3, ffmpeg and Playwright's Chromium. On the first run the skill checks what's missing and
shows the right command for your system.

- **Mac** (with Homebrew): `brew install node python ffmpeg`
- **Windows** (PowerShell): `winget install OpenJS.NodeJS.LTS`, `winget install Python.Python.3.12`,
  `winget install --id Gyan.FFmpeg -e`

### How it works

1. Reads your project, recommends a style with the reason and asks which one you want; then runs that style's briefing.
2. Writes the voice-over script and you approve it in a table, before spending any credit. Hard names (brand,
   proper names, English terms) go into a pronunciation dictionary.
3. Three voices read the first real line of the script; you pick by listening.
4. Generates the voice and **transcribes** every line: if a hard name came out wrong, it's redone before editing.
5. Builds from the style's template. Chapters: one full chapter as the template, then the rest in parallel, joined
   with the voice in place. Tutorial: records the real screen, holding each step for as long as the line lasts.
6. An original soundtrack dips under the voice; loudness, sync and voice-over-music are measured.
7. Looks at a frame sheet of each format (nothing empty, nothing illegible, nothing cropped) before delivering.

A real person's voice (clone) only with that person's written authorization, kept in the video's folder.

The full documentation (in Portuguese) is in [`SKILL.md`](SKILL.md) and [`references/`](references/).

### License

[MIT](LICENSE).
