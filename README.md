# /fazervideocomvoz

A mesma ideia da [/fazervideo](https://github.com/svcrashh/fazervideo), com uma voz narrando por cima,
gerada pela ElevenLabs. Ninguém aparece na tela: são as telas do seu produto mostrando como funciona, e a
voz em off explica. A legenda mostra o que a voz diz, palavra por palavra, e a música abaixa quando a voz
fala.

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

1. Lê o seu projeto e faz o briefing, como a /fazervideo.
2. Escreve o roteiro de locução e você aprova numa tabela, antes de gastar qualquer crédito.
3. Três vozes leem a primeira frase real do roteiro; você escolhe ouvindo.
4. Grava a tela real, segurando cada passo pelo tempo da fala: primeiro a voz diz, depois a mão faz.
5. Legenda igual à fala, com a palavra falada em destaque; trilha original que abaixa sob a voz.
6. Prova a sincronia (cada palavra a ±80 ms de onde a legenda acende) antes de entregar.

Voz de uma pessoa real (clone) só com autorização por escrito dessa pessoa, guardada na pasta do vídeo.

A documentação completa está em [`SKILL.md`](SKILL.md) e em [`references/`](references/).

## Licença

[MIT](LICENSE).
