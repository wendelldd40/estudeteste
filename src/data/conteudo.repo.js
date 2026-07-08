import { sb } from './client.js';

/**
 * Carregar livros disponíveis para uma matéria
 */
export async function livrosDaMateria(materia) {
  const { data, error } = await sb
    .from('conteudo_estudo')
    .select('livro, autor, edicao, capitulo, titulo, subtitulo, ordem')
    .eq('materia', materia)
    .eq('ativo', true)
    .order('capitulo')
    .order('ordem');

  if (error) return [];

  // Agrupar por livro
  const livros = {};
  for (const row of data) {
    if (!livros[row.livro]) {
      livros[row.livro] = {
        nome: row.livro,
        autor: row.autor,
        edicao: row.edicao,
        capitulos: [],
      };
    }
    const cap = livros[row.livro].capitulos;
    const existe = cap.find(c => c.numero === row.capitulo && c.titulo === row.titulo);
    if (!existe) {
      cap.push({
        numero: row.capitulo,
        titulo: row.titulo,
        secoes: [],
      });
    }
    const capObj = cap.find(c => c.numero === row.capitulo && c.titulo === row.titulo);
    capObj.secoes.push({
      subtitulo: row.subtitulo,
      ordem: row.ordem,
    });
  }

  return Object.values(livros);
}

/**
 * Carregar seções de um capítulo específico
 */
export async function secoesDoCapitulo(materia, livro, capitulo) {
  const { data, error } = await sb
    .from('conteudo_estudo')
    .select('id, subtitulo, tags, conteudo, ordem')
    .eq('materia', materia)
    .eq('livro', livro)
    .eq('capitulo', capitulo)
    .eq('ativo', true)
    .order('ordem');

  if (error) return [];
  return data;
}

/**
 * Salvar/atualizar conteúdo (usado pelo admin)
 */
export async function salvarConteudo(dados) {
  const { id, ...campos } = dados;
  if (id) {
    const { error } = await sb
      .from('conteudo_estudo')
      .update({ ...campos, updated_at: new Date().toISOString() })
      .eq('id', id);
    return !error;
  }
  const { error } = await sb.from('conteudo_estudo').insert(campos);
  return !error;
}

/**
 * Excluir conteúdo (soft delete)
 */
export async function excluirConteudo(id) {
  const { error } = await sb
    .from('conteudo_estudo')
    .update({ ativo: false })
    .eq('id', id);
  return !error;
}

/**
 * Listar todo conteúdo para o admin
 */
export async function listarConteudoAdmin() {
  const { data, error } = await sb
    .from('conteudo_estudo')
    .select('id, materia, livro, autor, capitulo, titulo, subtitulo, ordem, ativo, created_at')
    .order('materia')
    .order('livro')
    .order('capitulo')
    .order('ordem');
  if (error) return [];
  return data;
}
