// O índice do vídeo: a abertura o preenche, cada capítulo abre com o cartão dele, o fecho o mostra inteiro.
// `pasta` é a pasta do capítulo em cenas/; a ordem aqui é a ordem do vídeo.
const MARCA_NOME = 'Marca'                  // o nome como o logo escreve
const ENDERECO = 'marca.exemplo'            // o que fica no fecho, embaixo do logo
const INDICE = [
  { n: 1, nome: 'Exemplo', secao: 'Painel', pasta: '01-exemplo' },
  { n: 2, nome: 'Segundo item', secao: 'Painel', pasta: '02-segundo' },
  { n: 3, nome: 'Terceiro item', secao: 'Conta', pasta: '03-terceiro' },
]
// Números do fecho: só os verdadeiros, tirados do que o vídeo mostrou.
const NUMEROS = [{ valor: 12, rotulo: 'modelos' }, { valor: 3, rotulo: 'idiomas' }]
