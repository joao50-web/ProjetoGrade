const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fs = require('fs');
const sequelize = require('../src/config/database');

// Importa os models centralizados
const {
  Departamento,
  Cargo,
  Pessoa,
  Usuario,
  Curso,
  Disciplina,
  Ano,
  Semestre,
  Horario,
  DiaSemana,
  Turma,
  Hierarquia,
  Curriculo,
  DisciplinaCurso,
  DisciplinaPessoa,
  GradeHoraria
} = require('../src/models');

/**
 * Função inteligente para carregar os arquivos JSON salvos pelo DBeaver
 */
function carregarJson(nomeArquivo) {
  const caminho = path.join(__dirname, 'data', nomeArquivo);

  if (!fs.existsSync(caminho)) {
    console.warn(`⚠️ Arquivo "scripts/data/${nomeArquivo}" não encontrado. Pulando...`);
    return null;
  }

  const conteudo = fs.readFileSync(caminho, 'utf-8');
  const parseado = JSON.parse(conteudo);

  // 1. Se já for um Array direto [...]
  if (Array.isArray(parseado)) return parseado;

  // 2. Se o DBeaver envelopou os dados dentro de alguma propriedade (ex: data, RESULTS, records)
  const chaveComArray = Object.keys(parseado).find(key => Array.isArray(parseado[key]));
  if (chaveComArray) {
    return parseado[chaveComArray];
  }

  return null;
}

async function executarImportacao() {
  try {
    console.log("🔌 Conectando ao banco de dados...");
    await sequelize.authenticate();
    console.log("✅ Conexão realizada com sucesso!\n");

    // 1. Tabelas Base (sem chaves estrangeiras dependentes)
    const departamentos = carregarJson('tb_departamento.json');
    if (departamentos) {
      await Departamento.bulkCreate(departamentos, { ignoreDuplicates: true });
      console.log(`✅ ${departamentos.length} Departamentos importados.`);
    }

    const cargos = carregarJson('tb_cargo.json');
    if (cargos) {
      await Cargo.bulkCreate(cargos, { ignoreDuplicates: true });
      console.log(`✅ ${cargos.length} Cargos importados.`);
    }

    const anos = carregarJson('tb_ano.json');
    if (anos) {
      await Ano.bulkCreate(anos, { ignoreDuplicates: true });
      console.log(`✅ ${anos.length} Anos importados.`);
    }

    const semestres = carregarJson('tb_semestre.json');
    if (semestres) {
      await Semestre.bulkCreate(semestres, { ignoreDuplicates: true });
      console.log(`✅ ${semestres.length} Semestres importados.`);
    }

    const horarios = carregarJson('tb_horario.json');
    if (horarios) {
      await Horario.bulkCreate(horarios, { ignoreDuplicates: true });
      console.log(`✅ ${horarios.length} Horários importados.`);
    }

    const diasSemana = carregarJson('tb_dia_semana.json');
    if (diasSemana) {
      await DiaSemana.bulkCreate(diasSemana, { ignoreDuplicates: true });
      console.log(`✅ ${diasSemana.length} Dias da Semana importados.`);
    }

    // 2. Pessoas, Usuários e Hierarquia
    const pessoas = carregarJson('tb_pessoa.json');
    if (pessoas) {
      await Pessoa.bulkCreate(pessoas, { ignoreDuplicates: true });
      console.log(`✅ ${pessoas.length} Pessoas importadas.`);
    }

    const usuarios = carregarJson('tb_usuario.json');
    if (usuarios) {
      await Usuario.bulkCreate(usuarios, { ignoreDuplicates: true });
      console.log(`✅ ${usuarios.length} Usuários importados.`);
    }

    const hierarquias = carregarJson('tb_hierarquia.json');
    if (hierarquias) {
      await Hierarquia.bulkCreate(hierarquias, { ignoreDuplicates: true });
      console.log(`✅ ${hierarquias.length} Hierarquias importadas.`);
    }

    // 3. Cursos e Disciplinas
    const cursos = carregarJson('tb_curso.json');
    if (cursos) {
      await Curso.bulkCreate(cursos, { ignoreDuplicates: true });
      console.log(`✅ ${cursos.length} Cursos importados.`);
    }

    const disciplinas = carregarJson('tb_disciplina.json');
    if (disciplinas) {
      await Disciplina.bulkCreate(disciplinas, { ignoreDuplicates: true });
      console.log(`✅ ${disciplinas.length} Disciplinas importadas.`);
    }

    // 4. Relações e Grade Horária
    const turmas = carregarJson('tb_turma.json');
    if (turmas) {
      await Turma.bulkCreate(turmas, { ignoreDuplicates: true });
      console.log(`✅ ${turmas.length} Turmas importadas.`);
    }

    const curriculos = carregarJson('tb_curriculo.json');
    if (curriculos) {
      await Curriculo.bulkCreate(curriculos, { ignoreDuplicates: true });
      console.log(`✅ ${curriculos.length} Currículos importados.`);
    }

    const disciplinaCursos = carregarJson('tb_disciplina_curso.json');
    if (disciplinaCursos) {
      await DisciplinaCurso.bulkCreate(disciplinaCursos, { ignoreDuplicates: true });
      console.log(`✅ ${disciplinaCursos.length} Relações Curso-Disciplina importadas.`);
    }

    const disciplinaPessoas = carregarJson('tb_disciplina_pessoa.json');
    if (disciplinaPessoas) {
      await DisciplinaPessoa.bulkCreate(disciplinaPessoas, { ignoreDuplicates: true });
      console.log(`✅ ${disciplinaPessoas.length} Relações Pessoa-Disciplina importadas.`);
    }

    const grades = carregarJson('tb_grade_horaria.json');
    if (grades) {
      await GradeHoraria.bulkCreate(grades, { ignoreDuplicates: true });
      console.log(`✅ ${grades.length} Registros de Grade Horária importados.`);
    }

    console.log("\n🚀 Carga de dados concluída com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro durante a importação dos dados:", error);
    process.exit(1);
  }
}

executarImportacao();