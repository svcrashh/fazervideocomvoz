# Trilha

## Sumário
1. Pesquisa musical na hora: primeiro, o que esse público ouve
2. Papel da música: de fundo ou protagonista (papel não é gênero)
   2.1 O limite honesto da síntese, por gênero
3. Catálogo de estilos (e como sintetizar cada um)
4. Prompt do subagente compositor
5. `folha.json`, o contrato com a imagem
6. Referência ou música pronta do usuário
7. Mudou a imagem? Retimar a trilha
8. Sons de efeito
9. Trilha em série

---

## 1. Pesquisa musical na hora

A música de cada vídeo é decidida para aquele produto, aquele público e aquela plataforma. Não existe estilo padrão.

1. **Primeiro: o que esse público ouve.** Antes de pensar em papel, clima ou BPM, responda com evidência (a
   `leitura.md` do projeto, seção "O som do público"; o site, as redes, os artistas e os eventos que o produto cita):
   - que gêneros esse público ouve, e quais ele despreza;
   - as convenções desses gêneros: andamento, groove, timbre do bumbo, padrão do baixo, o que é clichê;
   - o que envergonharia a marca diante dele.

   O gênero sai daqui, e não do tipo de vídeo. Uma padaria de bairro, uma clínica de fisioterapia, um jogo de
   corrida, uma transportadora e um escritório de contabilidade têm públicos que ouvem coisas diferentes, e a
   trilha de cada um é outra, mesmo que os cinco vídeos sejam tutoriais.

   **Quando a música faz parte do mundo do público** (uma casa noturna, uma escola de música, uma loja de
   instrumentos, um estúdio, um festival), a trilha faz parte da credibilidade. Ela tem de estar no gênero que esse
   público vive, com as convenções que ele reconhece. Trocar o gênero por uma cama "neutra" para não arriscar é o
   erro oposto ao que parece: quem vive de uma música nota a ausência dela antes de notar a qualidade. Nesse caso,
   leia já o §2.1: a primeira opção a oferecer costuma ser uma música do próprio usuário.
2. **Classifique o resto:**
   - categoria do produto;
   - público (idade, B2B ou B2C, país e cultura);
   - onde o vídeo passa (feed com som desligado? evento com telão? site?);
   - emoção-alvo em 3 palavras;
   - quanto texto o vídeo tem. Isso decide o **papel** (§2), não o gênero.
3. **Pesquise, se houver WebSearch/WebFetch.** Por exemplo: "‹gênero do público› ‹ano› tracks", "trilha vídeo lançamento ‹categoria›", "‹concorrente› launch video music", "tendências de áudio ‹plataforma› ‹público› ‹ano›". Veja também os vídeos e redes da própria marca: ela já tem jingle, assinatura sonora, uma playlist, artistas parceiros? Pesquisa serve pra entender *gênero, andamento, groove e clima*. Nunca é pra copiar uma música.
4. **Sem web**, use o que você sabe do público e da categoria, e diga isso ao usuário.
5. **Formule 3 direções**, diferentes de propósito, todas dentro do que o público reconhece:
   - **segura:** o gênero que o público espera, com as convenções dele, bem feito;
   - **ousada:** um vizinho do gênero (house → garage; techno → electro), pra destacar sem soar estranho a ele;
   - **da marca:** sai da personalidade específica deste produto.

   Cada direção leva gênero, papel (fundo ou protagonista), BPM, tom ou modo, groove e bumbo (§3), 3 timbres e o clima em palavras ("pulsante e limpo, como um painel ganhando vida"). Se a síntese não dá conta do gênero para esse público (§2.1), diga na própria opção.
6. **Pergunte no briefing** (`AskUserQuestion`) com essas 3 direções como opções. Quando o público é de música, a 1ª opção é "usar uma faixa sua ou de um artista do produto (com autorização)". A resposta pode vir como texto livre, uma referência ("tipo a música X", "um eletrônico no fundo") ou uma música pronta. Veja §6 pra esses casos.

Varie de um vídeo pro outro: tom, BPM e timbres diferentes. Trilha repetida entre produtos diferentes é sinal de que a pesquisa não aconteceu.

## 2. Papel da música: de fundo ou protagonista

**Papel e gênero são duas decisões.** O gênero vem do público (§1). O papel vem da leitura: quanto texto há na tela e onde o vídeo passa. O papel diz quão alto, quão cheio e quanto espaço a música deixa. Ele **não** proíbe gênero. Um house de fundo continua tendo bumbo em todo tempo e chimbal no contratempo: só perde camadas e volume.

| | De fundo | Protagonista |
|---|---|---|
| Quando | muito texto na tela, B2B, tutorial, tom sóbrio | showreel, lançamento, anúncio curto, vinheta |
| Nível | −18 LUFS | −14 LUFS |
| Densidade | só o que define o gênero: o bumbo, a marcação, o contratempo e o baixo ficam; saem as semicolcheias da condução, as caixas fracas e a maior parte da melodia | tudo que o gênero pede, com build, drop, breaks, silêncio antes do impacto |
| Espaço para a leitura | médios (1,2–4 kHz) abertos na harmonia e na melodia; transientes que não disputam com os sons de efeito | tudo pode brilhar |
| Sincronia | acentos suaves nos cortes (um pluck, um shaker, um swell) | cada evento importante com som dedicado e forte |
| Dinâmica | quase constante, ondas lentas | contraste grande entre seções |

O que o papel muda dentro de cada gênero, na série (`arranjo_serie.py`, identidade v2):

| Família | Fundo | Protagonista |
|---|---|---|
| Pista (house, techno) | bumbo em todos os tempos e acima do baixo, palma baixa no 2 e no 4, chimbal aberto no contratempo, condução em colcheias, baixo do gênero, a cama cede ao bumbo, uma frase de melodia a cada 8 compassos | condução em semicolcheias, palma e contratempo mais altos, melodia a cada 4 compassos |
| Quebrado (garage, break) | o desenho do bumbo e da caixa fica (é o gênero), as caixas fracas saem, condução em colcheias | caixas fracas e semicolcheias entram |
| Leve (acústico, lo-fi, pop calmo) | bumbo discreto (às vezes só no 1), harmonia na frente | percussão e melodia sobem |

Os dois papéis seguem o mesmo contrato: marcos na amostra exata, silêncio digital onde a folha pede e masterização no loudness da folha. Mesmo de fundo, um vídeo sem sincronia parece desleixado.

### 2.1 O limite honesto da síntese

A síntese da skill (numpy, sem samples) tem teto. Ela acerta grade, andamento, groove, harmonia e mixagem. Ela não chega ao timbre de uma faixa produzida com samples, sintetizadores analógicos e horas de mix. Para um público que não ouve aquele gênero com atenção, isso quase nunca pesa. Para um público que vive dele, pesa.

| Gênero | O que a síntese faz bem | O que ela não faz | O público nota? |
|---|---|---|---|---|
| House / deep house | 4×4 no tempo, bumbo redondo, chimbal aberto no contratempo, palma, baixo no contratempo, stabs de órgão e epiano em m7/m9, sidechain | samples de disco e vocais, o balanço humano de uma MPC, piano de verdade em acordes densos, saturação analógica | DJ e produtor de house: sim |
| Techno | bumbo duro e saturado, rumble curto, chimbais, baixo de nota repetida, acorde dub com delay | texturas de sintetizador modular, filtros que evoluem por minutos, o rumble de um reverb de bumbo de verdade, a escala de uma faixa (build de 64 compassos não cabe num tutorial de 30 s) | DJ de techno: sim |
| UK garage / 2-step | o desenho do bumbo 2-step, swing de semicolcheia, caixas fracas | vocal picotado e reafinado (é metade do gênero), baixo reese | sim | `"genero": "garage"` → `garage` · `garage` · swing 0,14–0,22 |
| Break / drum & bass | o padrão do break e a caixa fraca | o som de um break sampleado (Amen, Think): o `break` sintético é uma aproximação | sim |
| Acústico / MPB / pop acústico | violão dedilhado (Karplus-Strong), piano simples, shaker, aro | voz, violão de perto com dinâmica de dedo, piano solo exposto | músico: às vezes |
| Lo-fi / hip hop | epiano, vinil, fita, swing | samples de jazz recortados, boom bap com bateria sampleada | produtor: sim |
| Orquestral / cinemático | cama de cordas, impacto, riser | orquestra exposta e crível | compositor: sim |
| Brasil (samba, forró, funk) | a célula rítmica estilizada | o balanço de uma roda, sanfona real, o tamborzão com a voz do MC | público brasileiro do gênero: sim |

**Quando o público vai perceber a diferença, a primeira opção a oferecer é a música do próprio usuário, ou de um artista do produto, com autorização** (o caminho "Tenho a música", §6). Quem vive de música costuma ter faixas: a casa noturna tem os residentes, a escola tem os alunos e os professores, o festival tem o line-up. A síntese no gênero certo vem como segunda opção, com o limite dito numa linha ("é um ‹gênero› sintetizado, no andamento e no groove certos, mas não tem o timbre de uma faixa produzida"). Para todo o resto, a síntese é o caminho normal. Nunca proponha, para esse público, uma trilha fora do gênero dele só porque a síntese daquele gênero é limitada.

## 3. Catálogo de estilos

As funções de timbre estão em `assets/audio/synth.py` (lista completa em `API.md`). "Criar no arranjo" quer dizer montar o som com as primitivas (`saw`, `tone`, `noise`, filtros, envelopes) dentro do `arranjo.py` quando não houver função pronta.

A última coluna diz o que a identidade de uma série declara (`"versao": 2`, §9) para soar como o gênero: o `groove` e o `bumbo` (e, onde importa, o baixo, o swing e o quanto a cama cede). "Arranjo próprio" quer dizer que a série não tem esse groove pronto: para esse estilo, componha cada peça com o prompt do §4, ou prefira a música do usuário (§2.1). Os BPMs são convenção do gênero: ponha a faixa deles em `bpm`.

**Eletrônico**

| Estilo | BPM | Clima / uso | Timbres e receita | Na série v2: groove · bumbo |
|---|---|---|---|---|
| Eletrônico de fundo (bed) | 95–110 | B2B, SaaS, tutorial, muito texto | `pad_note` longo, baixo em colcheias com `bass_note` escuro, `hat` e `shaker` leves, `pluck` raro nos cortes; sem drop, sidechain sutil | `reto` ou `house` · `eletronico` · `cede_db` 2–3 |
| Ambient | 60–90 | premium, bem-estar, arquitetura | `pad_coral`, `bell`, `piano` esparso, sub, `fita` e `vinil` como textura; o silêncio é instrumento | sem bumbo (percussão só `shaker`) · `cede_db` 0 |
| Deep house | 118–124 | moda, lifestyle, fintech elegante | kick 4/4 redondo em todo tempo, chimbal aberto no contratempo, palma no 2 e no 4, baixo redondo no contratempo, acordes m7/m9 em `orgao` ou `epiano`, `shaker`, a cama cede ao bumbo | `"genero": "house"` → `house` · `house` · baixo `contratempo` |
| Tech / minimal house | 124–128 | tech, eventos, produto "esperto" | kick seco, baixo curto repetido, `tick`/`pop`/`aro` como percussão, pouca harmonia | `house` · `garage` (seco) · baixo `rolante` |
| Pop eletrônico / future bass | 120–128 ou 140–150 (meio-tempo) | apps de consumo, lançamento alegre | `supersaw_note`, `pluck`, `pling`, chops vocais com `pad_coral` curto, drop | `house` · `house` · `cede_db` 6–8 (o bombeado é do gênero) |
| Synthwave | 100–118 | games, nostalgia, tech | `supersaw_note`, arpejo em semicolcheia, baixo em oitavas, caixa com muito reverb | `reto` · `eletronico` |
| Lo-fi / chillwave | 75–90 com swing | criativo, estudo, café | `epiano`, `vinil`, `fita`, `baixo808` suave, kick e caixa macios | `meio_tempo` ou `leve` · `acustico` · swing 0,1–0,2 |
| Drum & bass líquido | 170–174 | esporte, velocidade, tech fluida | breaks rápidos (kick, caixa, `hat`), pad largo, sub; dá pra dividir em meio-tempo nas partes calmas | `"genero": "break"` → `break` · `break` (bpm 170–174) |
| UK garage / 2-step | 130–134 | jovem, urbano, moda | swing de semicolcheia, kick fora do tempo forte, baixo e `pad_coral` picado |
| Glitch / IDM | 90–140 | IA, dev tools, dados | grade firme com micro-eventos (`tick`, `pop`, rajadas de `noise` filtrado), pads frios | arranjo próprio (sem groove pronto) |
| Techno escuro | 125–135 | gaming, noite, fintech agressiva, casa noturna | kick pesado em todo tempo, rumble (cauda grave depois do golpe), chimbal aberto no contratempo e fechado em semicolcheias, baixo curto de nota repetida (`baixo_serra`), um acorde dub com delay | `"genero": "techno"` → `techno` · `techno` · baixo `rolante` |
| Trap / phonk | 130–145 (meio-tempo) | gaming, streetwear, esporte | `baixo808` com glide, hats em tercinas e rolls, `palma_seca`; phonk: cowbell (criar no arranjo: 2 quadradas desafinadas, 540 e 800 Hz, com decaimento curto) | arranjo próprio (tercinas e rolls não estão na série) |
| Chiptune / 8-bit | 120–160 | games indie, humor, nostalgia | onda quadrada (criar no arranjo: `saw(f) - saw(f, fase+0,5)`), arpejos rápidos, ruído curto como percussão | arranjo próprio |

**Orgânico e instrumental**

| Estilo | BPM | Clima / uso | Timbres e receita | Na série v2: groove · bumbo |
|---|---|---|---|---|
| Acústico caloroso | 90–110 | família, saúde, ONG, artesanal | `corda` dedilhada (violão), `piano`, palmas, `shaker`, `bell` | `"genero": "acustico"` → `leve` · `acustico` |
| Piano emocional | 60–90 | homenagem, causa, saúde | `piano` + `cordas_orq` entrando devagar, pausa antes do final | sem bumbo |
| Cinemático / épico | 80–100 (ou meio-tempo) | lançamento grande, luxo, esporte | `cordas_orq` em ostinato, `metais`, `impacto_cinema`, `tom` grave tipo taiko, `riser` | arranjo próprio |
| Jazz / lounge | 90–130 com swing | gastronomia, hotel, luxo casual | `epiano` ou `piano` com acordes de 9ª/13ª, baixo andando (`bass_note` escuro), `prato_ride` com swing, `shaker` como escovinha | `leve` · `acustico` · condução `prato_ride` |
| Rock / indie | 110–150 | bebida, esporte, energia | guitarra (criar no arranjo: `corda` + saturação `tanh` forte + passa-baixa), kick, caixa, `crash`, baixo em colcheias | `reto` · `acustico` · marcação `snare` |
| Funk / disco / nu-disco | 110–122 | moda, varejo, festa | baixo em oitavas, guitarra abafada (`corda` curtíssima), `metais`, palmas, hi-hat aberto no contratempo | `house` · `house` · baixo `contratempo_oitava` |

**Brasil e mundo**

| Estilo | BPM | Clima / uso | Timbres e receita | Na série v2: groove · bumbo |
|---|---|---|---|---|
| Bossa nova | 120–140 (sentido em 2) | premium brasileiro, café, turismo | `corda` com acordes de 7ª/9ª em batida de bossa, `shaker`, `aro`, baixo nos tempos 1 e 3 | `contratempo` · `acustico` |
| Samba / pagode (estilizado) | 90–100 (ou dobrado) | marca popular, festa, comida | `tamborim`, surdo (`tom` grave no tempo 2), pandeiro (`shaker` + `aro`), cavaquinho (`corda` aguda e brilhante) | arranjo próprio |
| Forró / baião | 110–130 | Nordeste, São João, regional | zabumba (`tom` grave + `aro`), triângulo (criar: `bell` agudo curto, abafado no tempo), sanfona (`orgao` com vibrato) | arranjo próprio |
| Funk brasileiro (estilizado) | 125–130 ou 150 | público jovem BR | padrão tamborzão com kick e `palma_seca`, `baixo808`; só se a marca combinar com esse universo | arranjo próprio (tamborzão não está na série) |
| MPB / pop acústico | 80–110 | marcas brasileiras calorosas | `corda`, `piano`, percussão leve, melodia cantável no `pluck` ou `bell` | `"genero": "acustico"` |
| Amapiano | 110–115 | moda, música, jovem | log drum (criar: seno com queda de pitch 1 oitava em 80 ms + passa-baixa ressonante), `shaker` constante, `piano` jazzy | arranjo próprio (log drum) |
| Afrobeats | 100–110 | lifestyle, jovem, global | `conga`, `shaker`, `aro`, baixo sincopado, `corda` em riff curto | arranjo próprio |
| Reggaeton / dembow | 90–100 | América Latina, festa | padrão dembow (kick em todo tempo, `aro` ou `palma_seca` em 3+3+2), `baixo808`, pad | arranjo próprio (dembow não está na série) |
| Lo-fi hip hop / boom bap | 85–95 com swing | criativo, rua, podcast | kick e caixa pesados com swing, `epiano` ou `piano` em loop, `vinil` | `sincopado` ou `meio_tempo` · `break` · swing 0,1–0,2 |

Misturar é permitido e costuma dar identidade ("bossa com pulso eletrônico de fundo", "cinemático que vira house no drop"). Anote a mistura na direção musical.

## 4. Prompt do subagente compositor

Dispare em segundo plano (Agent, `run_in_background: true`) quando a música e o roteiro estiverem definidos. Preencha o que está entre ‹›:

- **Série** (vários vídeos do mesmo produto): não use este prompt a cada peça. Decida a identidade uma vez e gere cada peça com `arranjo_serie.py` (§9).
- **Sons de efeito** (toque, clique, digitação, virada, whoosh, sucesso, riser, impacto) vêm do `sons.py` (§8). O compositor não os recria.

```
Você vai compor e sintetizar DO ZERO a trilha original de um vídeo de ‹duração› s para ‹produto› (‹o que é, em uma linha›),
público ‹público›, plataforma ‹onde passa›.
O que esse público ouve: ‹gênero(s)› — convenções que ele reconhece: ‹andamento, groove, bumbo, baixo›; o que soaria
falso para ele: ‹…›. O gênero não é negociável pelo papel: de fundo, o arranjo perde camadas e volume, não o gênero.
Direção musical escolhida pelo usuário: ‹papel: de fundo | protagonista› · ‹estilo/mistura› · ‹BPM› · ‹tom/modo› ·
timbres ‹3-5 timbres› · clima ‹palavras›. ‹Se houver referência do usuário: "o usuário citou ‹referência› — capture
o estilo (andamento, timbres, groove), sem copiar melodia, letra nem gancho">
Esta música é só deste vídeo: não reaproveite harmonia, melodia, estrutura nem timbres de exemplos
(exemplo_api.py mostra só a API, não um estilo).

Pasta: ‹projeto›/audio (já tem synth.py, sons.py, verifica.py e folha.json). Não toque em repositório git.
Sons de efeito dos marcos (toque, clique, digitação, virada, whoosh, sucesso, riser, impacto) vêm de sons.py:
sons.colocar(itens) depois de nivelar a cama. Não recrie esses sons; componha a música em volta deles.
Leia ‹$SKILL›/assets/audio/API.md e a linha do estilo em ‹$SKILL›/references/trilha.md §3 antes de escrever.
Python: crie o venv em ‹projeto›/audio/.venv e instale numpy + scipy
(‹macOS/Linux: python3 -m venv .venv && .venv/bin/pip install numpy scipy | Windows: py -3 -m venv .venv; .venv\Scripts\pip install numpy scipy›).

Escreva audio/arranjo.py (import synth; synth.configurar('folha.json'); from synth import *), com harmonia, melodia,
padrões de bateria, automações, alvos de loudness por bus e mixdown próprios. Crie no arranjo os instrumentos que o
estilo pedir e a biblioteca não tiver. Tudo que está em folha.json é contrato: duração exata, silêncios digitais, fade,
e um som dedicado começando na amostra exata de cada marco (place(..., event=True)). Se a trilha for "de fundo",
os sons dos marcos são acentos discretos, e o arranjo deixa espaço para a leitura.

Estrutura (seções da folha): ‹seções com energia e descrição›
Marcos: ‹tabela: tempo · evento na tela · som pedido›

Qualidade: sem aliasing (use os osciladores da biblioteca), ataques e releases sem clique (rampa ≥ 1 ms começando em
zero), grave < 120 Hz em mono, reverb e delay pelos sends, sidechain só quando o estilo pedir.

Verifique de verdade antes de reportar:
1. .venv/bin/python arranjo.py → gera o wav de "saida".
2. .venv/bin/python verifica.py folha.json ‹saida›: tem que sair com código 0.
3. Espectrograma (ffmpeg -i ‹saida› -lavfi showspectrumpic=s=1920x1080 espectro.png): OLHE procurando aliasing,
   clique ou seção sem a energia prevista.
4. Rode duas vezes e confirme o mesmo hash (determinismo).
Relatório curto no idioma do usuário: caminho do wav, LUFS e true peak medidos, marcos com desvio, instrumentação por
seção e limitações honestas (você não ouve — não diga que "soa ótimo"; diga o que foi medido e o que só um ouvido julga,
e o que a síntese não alcança nesse gênero, references/trilha.md §2.1).
```

Enquanto o subagente trabalha, você faz as cenas. Quando ele terminar, rode você mesmo o `verifica.py` e olhe o espectrograma antes do rascunho.

## 5. `folha.json`, o contrato com a imagem

Mora em `<projeto>/audio/folha.json`, criado pelo `novo-projeto.mjs`. Preencha junto com o roteiro:

```json
{
  "titulo": "Nome do vídeo", "duracao": 30.0, "bpm": 100, "compasso": 4, "taxa": 48000,
  "saida": "trilha.wav", "loudness_lufs": -14.0, "teto_dbtp": -1.5, "semente": 4242,
  "silencios": [[14.2, 14.4]],
  "fade": [28.0, 30.0],
  "secoes": [{ "nome": "gancho", "de": 0, "ate": 2.4, "energia": "baixa", "descricao": "logo se desenha em traço" }],
  "marcos": [
    { "t": 0.6, "evento": "primeiro traço do logo", "som": "pluck grave", "opcional": false },
    { "t": 14.4, "evento": "tela inteira muda de cor", "som": "kick + crash + sub", "opcional": false }
  ]
}
```

- Os tempos caem na grade: múltiplos de 60/BPM, ou frações disso.
- `silencios` vira silêncio digital exato, e o `finalizar.mjs` confere que ele sobreviveu ao AAC.
- Na trilha de fundo, deixe `silencios` vazio ou curtíssimo, e marque como `opcional` os acentos que ficam por baixo.
- Marco com `"efeito": "toque"` (e `nivel`, `dur`, parâmetros opcionais) recebe um som do `sons.py` na amostra exata (§8). Esquema completo em `API.md`.

## 6. Referência ou música pronta do usuário

- **"Quero algo tipo a música X":** descreva o que caracteriza X (andamento, gênero, timbres, groove, clima) e componha algo **original** com essas qualidades. Não reproduza melodia, letra, gancho nem sample. Diga isso ao usuário numa linha.
- **"Tenho a música":** os direitos são do usuário. Não baixe música da internet.
  - Descubra o BPM e o primeiro tempo forte: pergunte ou meça (fluxo espectral em numpy e autocorrelação entre 60 e 180 BPM).
  - Monte as cenas na grade dela. O `folha.json` passa a *descrever* os tempos da música.
  - Corte na duração com fade: `ffmpeg -t ‹dur› -af afade=t=out:st=‹dur-2›:d=2`.
  - O `finalizar.mjs` continua mixando e verificando.

## 7. Mudou a imagem? Retimar a trilha

- Mudou um tempo em `cenas.js`? Atualize o `folha.json` na mesma hora.
- Subagente rodando: mande os marcos novos com SendMessage ("MUDANÇA NA FOLHA: … antes X, agora Y") e peça que ele refaça a verificação.
- Subagente já terminou: ajuste os tempos em `arranjo.py`, rode e verifique.

## 8. Sons de efeito

`assets/audio/sons.py` gera os sons de interface e transição na hora, sobre o `synth.py`. É determinístico pela semente, e cada repetição varia um pouco: dez toques nunca soam idênticos.

| som | quando | âncora | nível padrão |
|---|---|---|---|---|
| `toque` | dedo na tela | começa em t | −6 dB |
| `clique` | mouse (apertar e soltar) | começa em t | −6 dB |
| `digitacao` | texto sendo digitado (`dur` ou `teclas`; notebook, mecânico ou tela) | 1ª tecla em t | −10 dB |
| `virada` | página ou cartão virando | começa em t | −4 dB |
| `whoosh` | transição, corte | pico em t | −3 dB |
| `sucesso` | salvou, confirmou (afinado no tom) | começa em t | −2 dB |
| `riser` | subida até um momento | termina em t | −4 dB |
| `impacto` | logo, fechamento | começa em t | 0 dB |

- **Nível** é em dB relativo à cama musical, não absoluto. Os padrões servem a trilha de fundo de tutorial: presentes e por baixo da música. Numa trilha protagonista, suba 2 a 4 dB.
- **Na folha:** ponha `"efeito": "<som>"` no marco. Com `arranjo_serie.py`, isso basta. Num arranjo próprio, monte a lista e chame `sons.colocar(itens)` depois de nivelar a cama e antes do `retornos`.
- **Marco obrigatório só com som de ataque seco.** Whoosh (pico) e riser (fim) vão com `"opcional": true`, ou dividem o instante com um impacto ou toque.
- **A cama abre espaço sozinha.** Se o efeito não vai sobressair ao que toca naquele instante, `colocar` faz a cama ceder de 2 a 10 dB com antecipação (sidechain com lookahead) e registra isso no log.
- **Verifique:** `python sons.py --verificar --saida <pasta>` e olhe o `catalogo-espectro.png`.

## 9. Trilha em série

Série é o caso de 12 tutoriais do mesmo app, ou de uma campanha com várias peças. A identidade é da série. A música é de cada peça.

1. **Identidade, uma vez:** pesquise e pergunte como em §1–2, começando pelo que o público ouve. Depois grave `identidade.json` na raiz da série. Esquema completo em `API.md`. Série nova usa `"versao": 2`, porque só ela consegue declarar gênero:
   - `genero` (`acustico`, `break`, `garage`, `house`, `techno`) preenche o que o gênero pede; ou declare campo a campo;
   - `groove`: os grooves que a série aceita (a semente escolhe só entre eles), e `bumbo`: o timbre do bumbo;
   - `padrao_baixo` e `padrao_harmonia`: os padrões aceitos (o contratempo do house, a nota repetida do techno, o stab);
   - `cede_db`: quanto a cama cede ao bumbo (0 no acústico, 3 no break, 4 no garage, 4–6 no house, 5–8 no techno);
   - `papel`: fundo ou protagonista, que agora muda nível, densidade e espaço **dentro** do gênero (§2);
   - `bpm`: a faixa do gênero (um acústico calmo 80–96, house 120–126, drum & bass 170–174…). O andamento ajustado de cada peça fica dentro dela.

   Uma identidade sem `"versao"` continua valendo e compõe amostra por amostra como antes. Mas ela escolhe o groove pela densidade e só tem um bumbo, e por isso não consegue pedir um gênero de pista.
2. **Uma semente por peça.** Pode ser o número do episódio. Sementes vizinhas nunca repetem o tom; o `serie.py --testar identidade.json` mostra a janela garantida. `serie.py --mostrar identidade.json 1` mostra o que a semente escolheu (groove, bumbo, baixo, harmonia).
3. **Cada peça:** `folha.json` com seções (abertura, tela, fechamento), marcos com `efeito`, `"identidade": "../identidade.json"` e `loudness_lufs` −18 no fundo. Rode `python arranjo_serie.py identidade.json folha.json`.
   - A semente decide tom, BPM, progressão, ritmo harmônico, motivo, groove, voicings e timbres, dentro da identidade.
   - O BPM da folha é ignorado.
   - Os eventos do vídeo podem cair fora da grade: os efeitos vão na amostra exata e a música segue a grade dela. O quatro por quatro não perde tempo por causa de um evento.
4. **Verifique cada peça:** `verifica.py` (código 0) e espectrograma. Num gênero de pista, olhe no espectrograma se o bumbo marca cada tempo no grave e se o chimbal aparece nos contratempos. Diga ao usuário que ninguém ouviu: medir que há bumbo no tempo não prova que o bumbo é bom.
5. **Prove que as peças diferem:** `python serie.py --comparar pecaA/folha.json pecaB/folha.json`. Tem que passar: tom ou BPM diferentes, progressão e motivo diferentes, e similaridade de croma < 0,85.

Nunca estique a mesma trilha para outra duração. Mesma semente em folhas diferentes é esse defeito, e o `--comparar` reprova.
