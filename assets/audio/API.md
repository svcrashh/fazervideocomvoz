# synth · API da trilha sintetizada

`synth.py` dá **instrumentos, mesa de mixagem e masterização**. A música não vem da biblioteca: cada vídeo
compõe a sua (gênero, tom, BPM, timbres). `exemplo_api.py` (com `folha_exemplo_api.json`, 8 s de uma padaria inventada)
mostra o encanamento da **API** num esboço de 3 compassos; não é um estilo para copiar.
Requisito: Python 3 com numpy e scipy. Tudo em segundos. Sinais são `(n,)` mono ou `(2, n)` estéreo.

## Arranjo novo, passo a passo
1. Copie `synth.py` e `verifica.py` para a pasta do vídeo: assim a trilha continua reprodutível mesmo que a biblioteca mude.
2. Escreva `folha.json` a partir da decupagem (esquema no fim). Cada marco que tem som próprio vira `event=True`.
3. Escreva `arranjo.py`: `configurar` → `from synth import *` → `place(...)` → processar buses → `salvar(mix)`.
4. Rode `python arranjo.py` e depois `python verifica.py folha.json`. Código 0 significa que tudo passou; senão, a saída diz o que falhou.
5. Mesma `semente` = mesmo WAV, bit a bit. Mude a semente para outra variação de ruídos e fases.

Exemplo mínimo (lo-fi 85 BPM, 8 s, marcos em 0, 4·60/85 e 8·60/85 s; testado, passa no `verifica.py`):
```python
import sys
from pathlib import Path
AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI))                     # synth.py copiado para a pasta do vídeo
import synth
synth.configurar(AQUI / 'folha.json')
from synth import *                               # depois do configurar

b = BATIDA                                        # 60/85 s
ACORDES = [(50, 53, 57, 60, 64), (43, 53, 57, 59, 64)]   # Rém9 · Sol13
for c in range(3):                                # 3 compassos; o que passar de 8 s é ignorado
    t0 = 4 * b * c
    for m in ACORDES[c % 2]:
        place(epiano(M(m), 3.6 * b, vel=0.6), t0, 'keys', gain=0.25, rev=0.3)
    place(baixo808(M(ACORDES[c % 2][0] - 12), 2 * b), t0, 'bass', gain=0.8, event=True)
    for k in range(4):
        tb = t0 + k * b
        if k % 2 == 0:
            place(kick(), tb, 'drums', gain=0.7, event=(k == 0))
        else:
            place(palma_seca(), tb, 'drums', gain=0.5, rev=0.1)
        place(shaker(), tb + b / 2, 'drums', gain=0.3, pan=0.3)
place(vinil(DURACAO), 0.0, 'fx', gain=0.4)

bus['keys'] = fita(bus['keys'], profundidade=0.7)
bus['keys'] *= sidechain([4 * b * c + 2 * b * k for c in range(3) for k in range(2)], 0.3)
ganhos = ganho_por_alvo({'drums': ((0, 8), -17), 'keys': ((0, 8), -20), 'bass': ((0, 8), -19)})
rev, dly = retornos(ganhos)
salvar(soma_buses() + 0.4 * rev + 0.6 * dly)
```
Marco com tempo musical: grave na folha o valor com todas as casas (`2.823529411764706`). O `verifica.py` exige
que o som marcado comece **na amostra exata** do marco.

## A mesa
- `configurar(folha, buses=...)` lê a folha e zera tudo: `SR`, `N`, `DURACAO`, `BPM`, `BATIDA` (s por tempo), `COMPASSO`,
  `SILENCIOS`, `SEGMENTS` (trechos contínuos), `FADE`, `TARGET_LUFS`, `CEILING_DBTP`, `SAIDA`, `rng` (da `semente`), `FOLHA`.
  **Chame antes do `from synth import *`**: o import copia os valores daquele instante.
- `bus[nome]` é um array `(2, N)`. `place` num bus que não existe cria o bus. `BUSES` define a ordem da soma.
- `place(sig, t0, to, gain, pan, rev, dly, event)` soma o som a partir de `t0`. Um som mono é panoramizado por `pan` (-1…1).
  O som é cortado (fade de 12 ms) no próximo silêncio da folha, e começar dentro de um silêncio é erro. O que começa depois do fim é ignorado.
  `rev`/`dly` são envios para reverb/delay. `event=True` guarda o ataque para o `verifica.py` conferir o marco.
- Processamento de bus: filtros (`sosfilt(sos_hp(140), bus['x'], axis=1)`), automação (`tv_filter(bus['x'], curve(T(N), pts))`)
  e sidechain (`bus['x'] *= sidechain(tempos_do_kick, 0.4)`).
- `ganho_por_alvo({bus: ((de, ate), lufs)})` nivela cada bus por loudness numa janela e devolve os ganhos
  (passe-os a `retornos`, que aplica o mesmo ganho aos envios daquele bus).
- `retornos(ganhos)` → `(rev_out, dly_out)`: delay pingue-pongue (padrão: colcheia pontuada do BPM) e reverb por convolução,
  processados **trecho a trecho**, para que nenhuma cauda atravesse um silêncio.
- `salvar(soma_buses() + a * rev_out + b * dly_out)` roda o `master` (grave em mono, DC fora, fade da folha,
  loudness no alvo com limiter de true peak, silêncios em zero digital, última amostra 0) e grava o WAV 24 bits,
  `stems/eventos.npz` ao lado e o resumo. `salvar(mix, stats=True)` também imprime a curva de LUFS por segundo.
  Uma trilha por pasta: `stems/eventos.npz` é da última trilha salva ali. O `verifica.py` percebe quando é de outra trilha, avisa e confere só pelo envelope.

## Funções públicas
**Utilitários**: `S(t)` s→amostras · `T(n)` vetor de tempo · `M(m)` MIDI→Hz · `nota('F#3')`→MIDI · `norm(x)` pico 1 ·
`noise(n, ch=None)` gaussiano do `rng` · `edges(n, a, r)` rampas cosseno · `tail_fade(x, r)` · `curve(t, [(t, v), …])` automação
exponencial · `to_stereo(y, pan)` · `adsr(dur, a, d, s, r)` envelope de dur+r · `sos_lp/sos_hp(f, o=2)`, `sos_bp(f1, f2, o=2)`
Butterworth para `sosfilt` · `rbj(kind, fc, q)` biquad · `tv_filter(x, fc, q, kind='lp'|'hp'|'bp', block)` filtro com corte variável.
**Osciladores**: `saw(freq, n, ph0)` serra PolyBLEP (freq pode ser vetor) · `tone(f0, dur, [(razão, amp, tau)], …)` aditivo.

**Paleta original** (sai com pico 1,0):
- `pluck(f0, dur, bright, tau)`: pluck aditivo · `pling(f0, dur, bell, decay)`: marimba+sino · `bell(f0, dur, bright, decay)`: sino.
- `glint(f, dur)`: faísca aguda · `shimmer_pad(f0, dur)`: cama senoidal com tremolo.
- `pad_note(f0, dur, attack, release, amp, det, pitch)`: pad estéreo (devolve dur+release; `pitch(t)` multiplica a frequência).
  **Atenção:** `pad_note`, `supersaw_note` e `riser` deixam ar acima de 18 kHz (medido: −30 a −35 dB), e o `verifica.py` reprova acima de −40. Filtre os buses deles no arranjo: `bus['pad'] = sosfilt(sos_lp(13000, 4), bus['pad'], axis=1)`. O `arranjo_serie.py` já faz isso.
- `supersaw_note(f0, dur, attack, release, amp, det, pitch, decay)`: 7 serras (EDM) · `lead_note(f0, dur, rel)`: lead com vibrato.
- `bass_note(f0, dur, bright, amp, sub, pitch, release, decay)`: baixo aditivo mono.
- Bateria: `kick(dur, f_hi, f_lo, p_tau, a_tau, click, drive)` · `bumbo(tipo)`: o bumbo de cada gênero, pico 1,0
  (`'eletronico'` o de sempre · `'house'` redondo, grave em ~13 ms · `'techno'` duro, saturado, com rumble depois do
  golpe · `'garage'` seco e curto · `'acustico'` pele, casco e feltro · `'break'` acústico comprimido) ·
  `subboom(dur, …)` · `crash(dur, tau, lp)` (`[:, ::-1]` = reverso) ·
  `hat(dur, tau)` · `clap(dur)` · `snare(dur, f)` · `tom(f0, dur)`.
- Efeitos de sincronia: `thud()` baque · `woodclick(f)` encaixe · `tick(f)` letra/UI · `tap()` toque na tela ·
  `pop(f_start, f_end, …)` bolha · `tumble()` coisas caindo · `scribble(dur)` caneta · `flip_snap()` cartão virando ·
  `morph(dur)` transformação · `whoosh(dur, tp, f0, f1, f2, q, pan, up, down, hard_end)` · `riser(dur, m0, m1, …)` ·
  `powerdown(dur)` desligando.

**Paleta ampliada** (sai com pico = `amp`, padrão 0,5 ≈ -6 dBFS; DC zerado; começa e termina em 0):
- `corda(f0, dur, brilho, decaimento, posicao)`: Karplus-Strong. Violão com brilho ~0,5; harpa com brilho baixo e decaimento longo; koto com brilho alto e posicao ~0,08.
- `epiano(f0, dur, vel, brilho, release, tremolo)`: Rhodes FM, para neo-soul e lo-fi (dur+release).
- `piano(f0, dur, vel, release)`: piano aditivo inarmônico com martelo, para balada e trilha emotiva (dur+release).
- `orgao(f0, dur, drawbars='888000000', leslie, clique, release)`: Hammond, para soul, gospel e reggae (dur+release).
- `baixo808(f0, dur, glide, de, drive, decay, release)`: sub 808 com punch, glide de `de` Hz e saturação.
- `baixo_serra(f0, dur, corte, q, env, decay, sub, amp)`: serra com passa-baixa ressonante que abre no ataque e fecha
  em `decay`; o baixo curto e repetido do techno (com `env` alto e `decay` longo, um acid discreto). Mono.
- `pad_coral(f0, dur, vogal='a'|'e'|'i'|'o'|'u', ataque, release, vozes)`: coro em formantes, estéreo (dur+release).
- `metais(f0, dur, brilho, release)`: stab de brass para funk e fanfarra (dur+release). Soa melhor até ~Dó6.
- `cordas_orq(f0, dur, ataque, release, brilho)`: naipe de cordas lento para cinema, estéreo (dur+release).
- Percussão: `shaker(dur, brilho)` · `aro(dur)` rimshot/cross-stick · `conga(f0, dur, tapa)` · `tamborim(dur, f0)` ·
  `palma_seca(dur)` · `prato_ride(dur, sino)` (estéreo).
- Textura: `vinil(dur, chiado, estalos)` estéreo, lo-fi · `fita(sinal, profundidade, wow_hz, flutter_hz)` wow/flutter +
  saturação, mantém o pico · `impacto_cinema(dur)` boom + soco + ar + cauda, estéreo.

**Mesa e master**: `configurar`, `place`, `seg_end(t0)` fim do trecho de t0 · `sidechain(times, depth, attack, hold, release)`
curva `(N,)` · `ganho_por_alvo(alvos)` · `somar_sends('rev'|'dly', ganhos)` · `retornos(ganhos, ir, dly_para_rev, rev_hp, rev_lp, **ping_pong)` ·
`make_ir(dur, predelay)` IR sintética · `ping_pong(x, d, fb, taps)` · `per_segment(x, fn)` efeito trecho a trecho ·
`soma_buses()` · `relatorio([(nome, sinal)])` LUFS por seção · `kw(x)` ponderação K · `loud(y_kw, a, b)` LUFS sem gate ·
`lufs_integrated(x)` BS.1770 · `true_peak_env(x)` 4x · `limiter(x, ceiling_db)` · `master(mix, fase_zero=False)` · `write_wav24(path, x)` ·
`salvar(mix, stats, fase_zero=False)` (`fase_zero=True`: passa-altas do master sem atraso de fase; o grave do bumbo fica no tempo).

## Esquema da folha.json
```json
{
  "titulo": "texto", "duracao": 40.0, "bpm": 120, "compasso": 4, "taxa": 48000,
  "saida": "trilha.wav", "loudness_lufs": -14.0, "teto_dbtp": -1.5, "semente": 20260926,
  "silencios": [[11.75, 12.0], [33.875, 34.0]],
  "fade": [38.0, 40.0],
  "secoes": [{"nome": "intro", "de": 0.0, "ate": 4.0, "energia": "baixa", "descricao": "texto"}],
  "marcos": [{"t": 1.0, "evento": "o que acontece na tela", "som": "o que deve soar", "opcional": false}]
}
```
- O código usa: `duracao` e `taxa` (N = round(duracao·taxa), conferido na amostra), `saida` (relativo à pasta da folha),
  `loudness_lufs`, `teto_dbtp`, `semente`, `silencios` (zero digital exato; os trechos entre eles são os `SEGMENTS`),
  `fade` (cosseno até zero; `null` = só 12 ms no fim), `bpm` (`BATIDA` e o delay) e `marcos`.
- `secoes`, `titulo` e os textos são para humanos; `secoes` também organizam o `relatorio` e o loudness por seção do `verifica.py`.
- Marco obrigatório (`opcional: false`): o `verifica.py` exige onset em ±10 ms. Com `stems/eventos.npz`, exige também um som
  `event=True` começando na amostra do marco. Use `opcional: true` para marcos de ataque lento (pad, cordas) ou só informativos.
- O `verifica.py` também confere: formato (taxa da folha, 24 bits, estéreo, amostras exatas), cliques nas bordas dos silêncios e no fim, pico, DC,
  grave <120 Hz em mono, energia >18 kHz, loudness integrado (±0,5 LU) e true peak (≤ teto + 0,1 dB).

## Sons de efeito (sons.py)
Toque, clique, digitação, virada, whoosh, sucesso, riser, impacto e acento, gerados na hora sobre o `synth.py`.
Copie `sons.py` para a pasta do vídeo junto do `synth.py` (o `novo-projeto.mjs` já copia).

```python
import sons                                        # depois do synth.configurar e do from synth import *
y = sons.som(nome, semente=0, indice=0, **params)  # mono (n,) ou estéreo (2, n); começa e termina em 0;
                                                   # loudness curta de -26 LUFS (máx. K ponderada em 200 ms)
y, ancora = sons.som_ancorado(nome, semente=0, indice=0, **params)   # âncora em amostras desde o início
sons.CATALOGO[nome]  # {'descricao', 'nivel_db', 'dur', 'ancora', 'ataque_seco', 'rev', 'parametros'}
postos = sons.colocar(itens, bus='sfx', ref_lufs=None, semente=None, verbose=True, abrir=True)
sons.ref_cama(excluir=('sfx',))                    # LUFS integrados da soma dos outros buses (pré-master)
sons.colocar(itens, proteger=('bumbo',))           # buses que nunca cedem ao abrir espaço (além de sfx e acento)
sons.loud_curta(y)                                 # a medida de nível usada acima
```
- `itens`: `[{'t': s, 'som': nome, 'nivel': dB (opcional), 'pan', 'rev', 'dly', 'event' (opcionais), + parâmetros do som}]`.
  `semente=None` usa a da folha. O `indice` sobe sozinho a cada repetição do mesmo som: dez toques nunca são idênticos.
- **Âncora:** `inicio` (o som começa em t, `event=True`) · `pico` (whoosh: começa em t − dur/2, pico em t, sem evento) ·
  `fim` (riser: termina exatamente em t, sem evento). Marco com whoosh ou riser vai com `"opcional": true`, ou divide o
  instante com um som de ataque (riser + impacto no mesmo t).
- **Nível:** `nivel` é dB relativo à cama. `ref_lufs=None` mede a soma dos buses já na mesa: chame `colocar` depois de
  compor e nivelar (`ganho_por_alvo`) a cama e antes do `retornos`.
- **`abrir=True`:** para cada som de ataque seco, `colocar` prevê a subida do onset como o `verifica.py` mede (RMS 5 ms,
  banda cheia e >1 kHz). Abaixo de 12 dB previstos, a cama cede com antecipação (desce de −60 a −30 ms, segura até
  +100 ms, volta em 300 ms), de 2 a 10 dB, e só em último caso o efeito sobe até +4 dB. Os buses `sfx` e `acento` nunca
  cedem. O que foi feito sai no log e na lista `postos` (`cama_cede_db`, `subida_prevista_db`).
- Som começando antes de 0 ou dentro de um silêncio da folha perde a cabeça, com rampa de 5 ms.

| som | âncora | nível padrão (dB rel.) | dur. típica | parâmetros |
|---|---|---|---|---|
| `toque` | início | −6 | 0,075 s | `variante` 'macio' \| 'firme' |
| `clique` | início | −6 | 0,2 s | `variante` 'mouse' \| 'trackpad', `soltar` (s entre apertar e soltar; 0 = só apertar) |
| `digitacao` | início (1ª tecla) | −10 | dur | `dur` ou `teclas`, `teclado` 'notebook' \| 'mecanico' \| 'tela', `enter` |
| `virada` | início | −4 | 0,36 s | `variante` 'pagina' \| 'cartao' (0,22 s), `direcao` ±1 |
| `whoosh` | pico | −3 | 0,5 s | `dur` ou `variante` 'curto' (0,3) \| 'medio' \| 'longo' (0,9), `direcao` |
| `sucesso` | início | −2 | 0,85 s | `tonica` (MIDI), `modo` 'maior' \| 'menor', `notas` 2 \| 3 |
| `riser` | fim | −4 | 1,5 s | `dur`, `tonica`, `ticks` |
| `impacto` | início | 0 | 1,2 s | `dur`, `tonica` |
| `acento` | início | −5 | 0,6 s | `nota` (MIDI) — acento musical de marco sem efeito |

Os níveis são para trilha de fundo de tutorial: os sons ficam presentes e por baixo da música. Numa trilha
protagonista, suba 2 a 4 dB no item (`'nivel'`).

Verificação: `python sons.py --verificar [--saida DIR]` gera cada som e variante e confere bordas em zero, NaN, DC,
pico, energia >18 kHz, ataque em até 2 ms, ataque agudo suficiente, determinismo e variação por índice. Com `--saida`,
grava `catalogo.wav` e `catalogo-espectro.png`. Sai com código ≠ 0 se algo falhar.

## Trilha em série (serie.py, arranjo_serie.py)
Numa série, a identidade é decidida uma vez e cada peça ganha a sua trilha: `variacao(identidade, semente)`.
**Uma semente por peça.** A mesma semente em folhas diferentes é a mesma música esticada.

```python
import serie
ident = serie.carregar_identidade('identidade.json')     # valida e completa os padrões
v = serie.variacao(ident, semente)    # dict determinístico, JSON-serializável: tom, tonica_pc, modo, escala, bpm,
                                      # progressao{graus, batidas, antecipacao, cadencia, acordes, cadencia_nomes},
                                      # motivo{notas, resposta}, groove{nome, bumbo, marcacao, tempo, kit, swing},
                                      # baixo{instrumento, padrao}, harmonia{instrumento, padrao, extensao, abertura,
                                      # registro}, melodia{instrumento, registro}, textura, brilho, densidade, papel
serie.janela_garantida(ident)          # nº de sementes consecutivas sem repetir (tom, BPM) nem progressão
```
CLI:
```
python arranjo_serie.py identidade.json folha.json [--stats]    # compõe, mixa e salva (WAV + stems/eventos.npz
                                                                 # + <saida>.variacao.json)
python serie.py --comparar folhaA.json folhaB.json [wavA wavB]  # diferenças + similaridade de croma; código 0 = ok
python serie.py --testar identidade.json [N]                    # regras de distinção nas sementes 1..N
python serie.py --mostrar identidade.json SEMENTE               # a variação, em JSON
```
- **Garantias:** (tom, BPM) vem de uma bijeção da semente. Sementes vizinhas nunca repetem o tom, e dentro de
  `janela_garantida` sementes (tons × BPMs, ou as 288–384 progressões do modo, o que for menor) nada se repete. A
  progressão é um laço de 4 graus (com rotações, sem duplicatas) × 6 ritmos harmônicos × antecipação. O motivo é
  gerado (células rítmicas + passeio na escala) e a resposta muda o fim.
- **`--comparar`:** croma (12 classes, FFT) por compasso, cada peça na sua grade (lida do `.variacao.json`). Critério:
  melhor transposição < 0,85. Mesma semente e mesma folha: exige hash idêntico. Mesma semente em folhas diferentes:
  reprova. Referência medida: duas peças diferentes da série de exemplo dão 0,57, e a mesma música esticada dá 0,95.
- **Forma no `arranjo_serie.py`:** 1ª seção = abertura (cama entrando + anacruse), última = fechamento (cadência →
  tônica). A resolução encosta no marco obrigatório que estiver de −0,3 a +0,6 s do início do fechamento. O BPM é
  ajustado em até meio tempo no corpo inteiro para caber um nº inteiro de tempos. O `bpm` da folha é ignorado.
- **Eventos fora da grade:** efeitos e acentos caem na amostra exata. Nota da cama com ataque que cairia até 45 ms
  antes de um evento vai para o evento (tonal) ou sai (percussão). Na v2, o bumbo e o baixo curto têm regra própria
  (abaixo, em `groove` e `padrao_baixo`).

Esquema da `identidade.json` (série nova: `"versao": 2`, o contrato C). Nenhum gênero é o padrão: o exemplo
abaixo declara todos os campos para uma casa noturna inventada, cujo público vive de house; logo depois, outras duas
identidades inventadas, de públicos diferentes, pedem outros gêneros.
```json
{
  "versao": 2,
  "nome": "Porão 9 · como usar o app", "papel": "fundo",
  "estilo": "deep house: 4x4 redondo, chimbal aberto no contratempo, baixo no contratempo, órgão em m7/m9",
  "genero": "house",
  "bpm": [120, 126], "modos": ["dorico", "menor"], "tons": ["C", "D", "Eb", "F", "G", "A"],
  "instrumentos": {"harmonia": ["orgao", "epiano", "piano"], "baixo": ["bass_note"],
                   "percussao": ["kick", "clap", "hat", "hat_aberto", "shaker"], "melodia": ["pluck", "epiano"],
                   "textura": ["pad_note"]},
  "groove": ["house"], "bumbo": "house", "padrao_baixo": ["contratempo", "contratempo_oitava"],
  "padrao_harmonia": ["stab", "stab_sincopado"], "cede_db": 5,
  "densidade": "baixa", "loudness_lufs": -18.0
}
```
Outros públicos, outras identidades (só o que muda):
- clínica de fisioterapia, pacientes adultos: `"genero": "acustico"`, `"bpm": [80, 92]`, harmonia `corda` e `piano`,
  percussão `kick`, `shaker`, `aro`;
- jogo de corrida, público jovem: `"genero": "break"`, `"bpm": [170, 174]`, `"papel": "protagonista"`, baixo
  `baixo808`, percussão `kick`, `snare`, `hat`.

Por que existe: na identidade antiga o groove sai da densidade e o bumbo tem um timbre só, então nenhuma identidade
conseguia pedir um quatro por quatro de house. Aqui o **gênero** (o que o público ouve) e o **papel** (quão alto e
quão cheio, para quem lê) são duas decisões separadas.

- **`genero`** (atalho, opcional): `acustico`, `break`, `garage`, `house` ou `techno`. Preenche `groove`, `bumbo`,
  `padrao_baixo`, `padrao_harmonia`, `cede_db` e `swing` que a identidade não declarou. O que ela declara vale
  sempre. `--mostrar` imprime o que foi resolvido.
- **`groove`**: lista dos grooves aceitos. A semente escolhe entre eles, e só entre eles. Sem `groove` (e sem
  `genero`), vale a lista da densidade, como na versão 1.
  | groove | família | bumbo (semicolcheias 0–15) | marcação | contratempo (`aberto`) | caixa fraca (`fantasma`) | o que a semente varia |
  |---|---|---|---|---|---|---|
  | `house` | pista | 0 4 8 12, fixo | 4 12 | 2 6 10 14 (chimbal aberto) | — | condução |
  | `techno` | pista | 0 4 8 12, fixo | 4 12, ou 12, ou 4 12 14 | 2 6 10 14 | — | condução, marcação |
  | `garage` | quebrado | 2-step: 0 10 · 0 7 10 · 0 10 11 · 0 3 10 | 4 12 | — | 7 15 | bumbo, condução |
  | `break` | quebrado | 0 2 10 · 0 10 11 · 0 3 10 · 0 2 7 10 | 4 12 | — | 7 9 15 | bumbo, condução |
  | `reto`, `meio_tempo`, `quebrado`, `contratempo`, `sincopado`, `leve` | leve | os da versão 1 | | — | — | bumbo, condução |
  Na pista o quatro por quatro começa no 1º tempo do corpo e nenhum tempo some por causa de um evento do vídeo.
  Um bumbo a menos de 26 ms antes de um evento (onde o estalo dele adiantaria o onset que o `verifica.py` mede) vai
  para o lado mais perto: o evento, ou 26 ms antes dele. Nunca sai mais de 13 ms do tempo.
  Mix da pista: o bumbo é dono do sub. O baixo passa por um passa-alta de 60 Hz, os efeitos (`sfx`) por um de
  100 Hz (o "thunk" do clique de mouse brigava com o bumbo), e o bumbo não cede quando `sons.colocar` abre espaço
  para um efeito (`proteger=('bumbo',)`).
- **`bumbo`**: timbre do bumbo (texto ou lista): `eletronico` (o da versão 1), `acustico`, `break`, `garage`,
  `house`, `techno`. Ver `synth.bumbo`. Na v2 o bumbo tem bus próprio (`bumbo`).
- **`padrao_baixo`**: lista dos padrões aceitos. Novos: `contratempo` e `contratempo_oitava` (house: o baixo entre
  os bumbos), `rolante` e `rolante_quinta` (techno: nota repetida em semicolcheias, fora do bumbo), `garage`,
  `quebrado`; mais os da versão 1 (`semibreve`, `raiz_quinta`, `pulso`, `sincopado`, `colcheias`, `ancora`). Nota
  curta de baixo que cairia até 90 ms antes de um evento sai: o RMS de uma nota grave ondula, e o `verifica.py`
  leria o onset do evento adiantado.
- **`padrao_harmonia`**: lista dos padrões aceitos. Novos: `stab` (acorde no contratempo), `stab_sincopado`, `dub`
  (um acorde por compasso com delay). Mais os da versão 1 (`sustentado`, `pulsado`, `seminimas`, `respiro`,
  `arpejo`). Instrumento sustentado (`pad_note`, `pad_coral`, `cordas_orq`, `shimmer_pad`) é sempre `sustentado`.
- **`cede_db`** (0–12): quanto a harmonia, o baixo e a textura cedem a cada bumbo (sidechain; a melodia cede a
  metade, em dB). 0 = não cede. House 4–6, techno 5–8, acústico 0.
- **Instrumentos novos na v2:** percussão `hat_aberto` (o contratempo; groove com contratempo sem `hat_aberto` nem
  `hat` é erro) · baixo `baixo_serra`.
- **O andamento fica na faixa.** Na v2 o ajuste de BPM (para caber um nº inteiro de tempos no corpo) escolhe, entre
  os vizinhos, o que cai dentro de `bpm`. Andamento é convenção de gênero: house fora de 118–128 já não é house.
- **`papel` dentro do gênero** (`serie.PAPEL_V2` e `serie.ALVOS_V2`). O papel não tira o gênero, tira camadas e volume:
  | | fundo | protagonista |
  |---|---|---|
  | bumbo, marcação, contratempo, baixo | ficam (são o gênero) | ficam |
  | condução (chimbal fechado, shaker) | só colcheias | como o groove pede (semicolcheias) |
  | caixa fraca (`fantasma`) | sai | entra |
  | marcação / contratempo (ganho) | 0,45 / 0,5 | 0,65 / 0,6 |
  | melodia | uma frase a cada 8 compassos | a cada 4 (e respostas, se a densidade não é baixa) |
  | médios 1,2–4 kHz na harmonia e na melodia | −5 dB (espaço para quem lê) | intactos |
  | loudness | −18 LUFS | −14 LUFS |
  Alvos por bus (LUFS sem gate no corpo, pré-master): na pista o bumbo fica acima do baixo (fundo: bumbo −20,5,
  baixo −26,5, harmonia −23); no leve, a harmonia manda (−21) e o bumbo fica em −29.
- **Master sem atraso no grave (v2):** o `arranjo_serie.py` salva com `salvar(..., fase_zero=True)`: os passa-altas
  do master (22 Hz e o do lado em 120 Hz) rodam para frente e para trás. O causal atrasava ~6 ms o grave de todo
  bumbo. Sem `fase_zero` (o padrão), o master é o de sempre.
- `variacao()` de uma identidade v2 devolve também `versao`, `genero`, `bpm_faixa`, `cede_db` e, em `groove`,
  `familia`, `fantasma`, `aberto` e `timbre_bumbo`.

Esquema da identidade antiga (sem `"versao"`). **Continua valendo, e compõe amostra por amostra como antes**:
```json
{
  "nome": "Agenda Clara · tutoriais", "papel": "fundo",
  "estilo": "texto livre para humanos",
  "bpm": [88, 104], "modos": ["maior", "lidio"], "tons": ["C", "D", "Eb", "E", "G", "A", "Bb"],
  "instrumentos": {"harmonia": ["epiano", "pad_note"], "baixo": ["bass_note"],
                   "percussao": ["kick", "shaker", "hat", "aro"], "melodia": ["pling", "bell"],
                   "textura": ["shimmer_pad"]},
  "densidade": "baixa", "loudness_lufs": -18.0,
  "swing": [0.0, 0.08], "brilho": [0.35, 0.55], "registro_harmonia": [57, 65], "registro_melodia": [72, 79],
  "efeitos": {"nivel": {"toque": -6, "digitacao": -10}}
}
```
- Obrigatórios (nas duas versões): `nome`, `papel` (fundo | protagonista), `bpm` [min, max], `modos` (maior, lidio,
  mixolidio, dorico, menor), `tons` (C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B), `instrumentos`.
- `instrumentos`: cada função lista os permitidos, e a semente escolhe um por peça. Aceitos — harmonia: epiano, piano,
  pad_note, orgao, corda, pad_coral, cordas_orq, pluck · baixo: bass_note, baixo808, corda (+ baixo_serra na v2) ·
  percussao: kick, conga, aro, palma_seca, clap, snare, tamborim, shaker, hat, prato_ride (+ hat_aberto na v2; papéis:
  bumbo, marcação, condução, e na v2 contratempo e caixa fraca) · melodia: pling, pluck, bell, corda, epiano, piano,
  lead_note, metais · textura (opcional): shimmer_pad, vinil, pad_note, pad_coral.
- Opcionais, com padrão: `densidade` baixa | media | alta (grooves quando não há `groove`, baixo, células do motivo),
  `loudness_lufs` (−18 fundo, −14 protagonista; vale o da folha), `swing` e `brilho` [min, max],
  `registro_harmonia` e `registro_melodia` [MIDI min, max], `efeitos.nivel` (nível padrão por som na série).
- Na identidade antiga, `densidade` escolhe o groove e o papel "fundo" baixa percussão e melodia. Ela não consegue
  pedir gênero de pista. Para uma série nova, use `"versao": 2`.

## Campo `efeito` nos marcos da folha
```json
{"t": 3.47, "evento": "toque em Salvar", "som": "toque", "efeito": "toque", "nivel": -6, "opcional": false}
{"t": 5.12, "evento": "digita o nome", "som": "digitação", "efeito": "digitacao", "dur": 1.8, "opcional": false}
{"t": 10.9, "evento": "troca de tela", "som": "whoosh", "efeito": "whoosh", "dur": 0.5, "opcional": true}
{"t": 22.0, "evento": "riser até o logo", "som": "riser", "efeito": "riser", "dur": 1.4, "opcional": true}
{"t": 22.0, "evento": "logo", "som": "impacto", "efeito": "impacto", "opcional": false}
```
- `efeito`: um nome do `sons.CATALOGO`. `nivel` (dB relativo à cama) e os parâmetros do som (`dur`, `variante`,
  `direcao`, `teclas`, `teclado`, `enter`, `soltar`, `notas`, `ticks`, `pan`, `rev`) são opcionais. O `arranjo_serie.py`
  afina `sucesso`, `riser` e `impacto` no tom da peça.
- `t` é o instante da âncora: início, pico do whoosh ou fim do riser.
- Marco sem `efeito` vira acento musical discreto (`acento`, nota do acorde acima da melodia).
- `opcional: false` só com som de ataque seco (toque, clique, digitacao, virada, sucesso, impacto, acento).
