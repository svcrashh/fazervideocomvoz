// Configuração do vídeo. Os tempos das cenas (cenas.js) e da trilha (audio/folha.json) precisam bater.
const VIDEO = {
  titulo: 'Demonstração do motor',
  duracao: 8,
  bpm: 120,                     // 120 BPM → batida 0,5 s, compasso 2 s
  formatos: ['16x9', '9x16'],   // o primeiro é o padrão; os outros via index.html?f=9x16
  plataforma: null,             // 'reels'|'tiktok'|'shorts'|'stories'|'feed'|'youtube'|'app' ou { '9x16': 'stories', '16x9': 'youtube' } → área segura checada
  fontes: [],                   // famílias declaradas em fontes/fontes.css — o motor espera todas carregarem
  fundo: '#F4EFE6',
  grao: 0.14,                   // grão de papel/filme (0 desliga)
  impactos: [[5.5, 14]],        // [tempo, intensidade] → tremor de câmera nos impactos da trilha
  selo: null,                   // { de: 2, ate: 7, w: 40, h: 40, x: { '16x9': 64, '9x16': 520 }, y: { '16x9': 976, '9x16': 150 } }
  audio: 'audio/trilha.wav',    // usado só na prévia ao vivo (index.html?play)
}
