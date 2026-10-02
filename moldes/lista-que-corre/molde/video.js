// Configuração do vídeo, tirada dos parâmetros (params.js, escrito pelo render.mjs a partir do exemplo.json).
const PLANO = planejar(PARAMS)
const VIDEO = {
  titulo: `${PARAMS.marca.nome} · lista que corre`,
  duracao: PLANO.dur,
  bpm: 120,
  formatos: ['16x9', '9x16', '1x1', '4x5'],
  plataforma: null,
  fontes: [...new Set(Object.values(PARAMS.marca.fontes))],
  fundo: PARAMS.marca.cores.fundo,
  grao: PARAMS.marca.grao != null ? PARAMS.marca.grao : 0.05,
  impactos: [],
  selo: null,
  audio: 'audio/final.wav',
}
