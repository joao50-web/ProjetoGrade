const { Op } = require("sequelize");
const {
  Curso,
  GradeHoraria,
  Disciplina,
  DisciplinaCurso,
  Pessoa,
  Horario,
  DiaSemana,
  Departamento,
  Ano,
  Curriculo,
  Semestre,
  sequelize,
} = require("../models");

const renderGradeHTML = require("../templates/grade-horaria.template.js");
const { generatePDF } = require("../services/pdf.service.js");

class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isEmpty = (value) => (
  value === undefined || value === null ||
  (typeof value === "string" && value.trim() === "")
);

const parsePositiveId = (value, label, { optional = false } = {}) => {
  if (optional && (isEmpty(value) || ["null", "undefined"].includes(String(value).trim().toLowerCase()))) {
    return null;
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new ApiError(`${label} inválido. Informe um número inteiro positivo.`);
  }
  return id;
};

const parseFilterId = (value, label) => parsePositiveId(value, label, { optional: true });

const normalizeText = (value, label, { optional = true, maxLength = 255, uppercase = true } = {}) => {
  if (isEmpty(value)) {
    if (optional) return null;
    throw new ApiError(`${label} é obrigatório.`);
  }
  if (typeof value !== "string") {
    throw new ApiError(`${label} deve ser texto.`);
  }
  const text = value.trim();
  if (text.length > maxLength) {
    throw new ApiError(`${label} deve ter no máximo ${maxLength} caracteres.`);
  }
  return text ? (uppercase ? text.toUpperCase() : text) : null;
};

const validarIdsExistentes = async (Model, ids, label, transaction) => {
  const esperados = [...new Set((ids || []).filter((id) => id !== null && id !== undefined))];
  if (esperados.length === 0) return;

  const existentes = await Model.findAll({
    where: { id: { [Op.in]: esperados } },
    attributes: ["id"],
    transaction,
  });
  const encontrados = new Set(existentes.map((registro) => Number(registro.id)));
  if (esperados.some((id) => !encontrados.has(Number(id)))) {
    throw new ApiError(`Um ou mais IDs de ${label} não existem.`);
  }
};

const validarContextoExistente = async (contexto, transaction) => {
  await Promise.all([
    validarIdsExistentes(Curso, [contexto.curso_id], "curso", transaction),
    validarIdsExistentes(Ano, [contexto.ano_id], "ano", transaction),
    validarIdsExistentes(Semestre, [contexto.semestre_id], "semestre", transaction),
    validarIdsExistentes(Curriculo, [contexto.curriculo_id], "currículo", transaction),
  ]);
};

const responderErro = (res, error, mensagemPublica) => {
  if (error instanceof ApiError) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(mensagemPublica, error);
  return res.status(500).json({ error: mensagemPublica });
};

const parseGradeScope = (rawMode, rawTurmaGrade) => {
  let mode = rawMode;
  if (mode === undefined || mode === null || String(mode).trim() === '') {
    mode = isEmpty(rawTurmaGrade) ? 'legacy' : 'existing';
  }
  mode = String(mode).trim().toLowerCase();

  if (!['legacy', 'existing', 'new', 'migrate', 'single'].includes(mode)) {
    throw new ApiError('Modo de turma_grade inválido.');
  }
  if (mode === 'legacy' || mode === 'single') {
    if (!isEmpty(rawTurmaGrade)) {
      throw new ApiError('Para uma grade sem rótulo, turma_grade deve ficar vazio.');
    }
    return { mode, value: null };
  }

  const value = normalizeText(rawTurmaGrade, 'turma_grade', {
    optional: false,
    maxLength: 100,
  });
  return { mode, value };
};

const gradeScopeWhere = (context, scope) => {
  if (scope.mode === 'legacy' || scope.mode === 'single' || scope.mode === 'migrate') {
    // Registros antigos podem estar em NULL ou string vazia; ambos permanecem acessíveis.
    return {
      ...context,
      [Op.or]: [{ turma_grade: null }, { turma_grade: '' }],
    };
  }
  return { ...context, turma_grade: scope.value };
};

const parseLegacyQueryFlag = (value) => (
  ['true', '1', 'yes', 'sim'].includes(String(value || '').trim().toLowerCase())
);



/* ======================================================
   FUNÇÃO AUXILIAR: MONTA E AGRUPA A ESTRUTURA PARA O PDF
====================================================== */
const montarDadosParaPDF = (registros, meta = {}) => {
  const primeiro = registros && registros.length > 0 ? registros[0] : {};

  const cursoNome = meta.curso || primeiro.curso?.nome || (typeof primeiro.curso === "string" ? primeiro.curso : "-");
  const curriculoNome = meta.curriculo || primeiro.curriculo?.descricao || primeiro.curriculo?.nome || (typeof primeiro.curriculo === "string" ? primeiro.curriculo : "-");
  const anoNome = meta.anoLetivo || primeiro.ano?.descricao || primeiro.ano?.ano || (typeof primeiro.ano === "string" ? primeiro.ano : "-");
  const coordNome = meta.coordenador || primeiro.coordenador?.nome || (typeof primeiro.coordenador === "string" ? primeiro.coordenador : "-");
  const semestreNome = meta.semestre || primeiro.semestre?.descricao || primeiro.semestre?.nome || (typeof primeiro.semestre === "string" ? primeiro.semestre : "-");
  const turmaNome = meta.turma || primeiro.turma_grade || "";

  const DIAS_SEMANA = [
    { id: 1, nome: "2ª feira", nomesValidos: ["1", "2ª feira", "segunda", "segunda-feira"] },
    { id: 2, nome: "3ª feira", nomesValidos: ["2", "3ª feira", "terça", "terça-feira"] },
    { id: 3, nome: "4ª feira", nomesValidos: ["3", "4ª feira", "quarta", "quarta-feira"] },
    { id: 4, nome: "5ª feira", nomesValidos: ["4", "5ª feira", "quinta", "quinta-feira"] },
    { id: 5, nome: "6ª feira", nomesValidos: ["5", "6ª feira", "sexta", "sexta-feira"] },
    { id: 6, nome: "Sábado", nomesValidos: ["6", "sábado", "sabado"] },
  ];

  const HORARIOS_PADRAO = [
    "08:00-08:50", "08:50-09:40", "09:40-10:30", "10:30-11:20", "11:20-12:10","12:30-13:20",
    "13:20-14:10", "14:10-15:00", "15:00-15:50", "15:50-16:40", "16:40-17:30",
    "17:30-18:20", "18:20-19:10", "19:10-20:00", "20:00-20:50", "20:50-21:40", "21:40-22:30"
  ];

  const normalizarHorario = (str) => (str || "").replace(/\s+/g, "").toLowerCase();

  const slotsMap = new Map();

  if (registros && registros.length > 0) {
    registros.forEach((r) => {
      const horarioRaw = r.horario?.descricao || (typeof r.horario === "string" ? r.horario : "");
      const horarioNorm = normalizarHorario(horarioRaw);
      const diaIdNum = Number(r.dia_semana_id);
      const diaNomeStr = String(r.diaSemana?.nome || r.diaSemana || "").toLowerCase();

      const diaObj = DIAS_SEMANA.find((d) =>
        d.id === diaIdNum || d.nomesValidos.includes(diaNomeStr)
      );

      if (diaObj && horarioNorm && r.disciplina) {
        const chave = `${diaObj.id}_${horarioNorm}`;

        const discObj = {
          codigo: r.disciplina?.codigo || "",
          nome: r.disciplina?.nome || "",
          cargaHoraria: r.disciplina?.carga_horaria || "",
          turma: r.turma || "",
          professor: r.professor?.nome || (typeof r.professor === "string" ? r.professor : ""),
          departamento: r.departamento?.sigla || r.departamento?.nome || (typeof r.departamento === "string" ? r.departamento : ""),
        };

        if (!slotsMap.has(chave)) {
          slotsMap.set(chave, []);
        }

        slotsMap.get(chave).push(discObj);
      }
    });
  }

  const linhas = HORARIOS_PADRAO.map((horarioStr) => {
    const horarioNorm = normalizarHorario(horarioStr);

    const celulas = DIAS_SEMANA.map((diaObj) => {
      const chave = `${diaObj.id}_${horarioNorm}`;
      return slotsMap.get(chave) || [];
    });

    return {
      horario: horarioStr,
      celulas,
    };
  });

  return {
    universidade: "UNIVERSIDADE FEDERAL DE CIÊNCIAS DA SAÚDE DE PORTO ALEGRE",
    curso: cursoNome,
    curriculo: curriculoNome,
    coordenador: coordNome,
    anoLetivo: anoNome,
    turmaGrade: turmaNome,
    semestres: [
      {
        descricao: semestreNome,
        dias: DIAS_SEMANA.map((d) => d.nome),
        linhas,
      },
    ],
  };
};

const normalizarPapel = (valor) => String(valor || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/\(a\)/g, "a")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .toLowerCase();


const PAPEIS_ADMINISTRADOR = new Set([
  "admin",
  "administrador",
  "administradora",
  "admin do sistema",
  "administrador do sistema",
  "administradora do sistema",
]);

const PAPEIS_COORDENADOR = new Set([
  "coordenador",
  "coordenadora",
  "coordenador de curso",
  "coordenadora de curso",
  "coordenador do curso",
  "coordenadora do curso",
]);

/* ======================================================
   AUTORIZAÇÃO: ADMINISTRADOR, EDICAO OU COORDENADOR DO CURSO
====================================================== */
const verificarPermissaoEdicao = async (usuario, curso_id, cursoExistente = null) => {
  if (!usuario) return false;

  const papelOriginal = String(usuario.role || "").toLowerCase();
  const papel = normalizarPapel(usuario.role);
  if (papelOriginal.includes("admin") || papel === "edicao") return true;
  if (!PAPEIS_COORDENADOR.has(papel)) return false;

  const curso = cursoExistente || await Curso.findByPk(curso_id);
  if (!curso) return false;

  const pessoaId = Number(usuario.pessoa_id || usuario.id);
  const coordenadorCursoId = Number(curso.coordenador_id);
  return Number.isSafeInteger(pessoaId) && pessoaId > 0 &&
    Number.isSafeInteger(coordenadorCursoId) && coordenadorCursoId > 0 &&
    pessoaId === coordenadorCursoId;
};

const podeCriarGrupoDeGrade = (usuario, curso) => {
  if (!usuario || !curso) return false;

  const papel = normalizarPapel(usuario.role);
  if (PAPEIS_ADMINISTRADOR.has(papel) || papel === "edicao") return true;
  if (!PAPEIS_COORDENADOR.has(papel)) return false;

  const pessoaId = Number(usuario.pessoa_id || usuario.id);
  const coordenadorCursoId = Number(curso.coordenador_id);
  return Number.isSafeInteger(pessoaId) && pessoaId > 0 &&
    Number.isSafeInteger(coordenadorCursoId) && coordenadorCursoId > 0 &&
    pessoaId === coordenadorCursoId;
};


/* ======================================================
   BUSCAR DISCIPLINAS VÁLIDAS PARA O CONTEXTO ACADÊMICO
====================================================== */
const buscarDisciplinasDoContexto = async ({ curso_id, curriculo_id, semestre_id }, options = {}) => {
  const cursoId = Number(curso_id);
  const curriculoId = Number(curriculo_id);
  const semestreId = Number(semestre_id);

  if (![cursoId, curriculoId, semestreId].every(Number.isInteger) ||
      cursoId <= 0 || curriculoId <= 0 || semestreId <= 0) {
    return [];
  }

  const vinculos = await DisciplinaCurso.findAll({
    where: { curso_id: cursoId, curriculo_id: curriculoId, semestre_id: semestreId },
    attributes: ['disciplina_id'],
    transaction: options.transaction
  });

  return [...new Set(vinculos.map((vinculo) => Number(vinculo.disciplina_id)))];
};

/* ======================================================
   GERAR E EXPORTAR PDF DA GRADE
====================================================== */
exports.gerarPdf = async (req, res) => {
  try {
    const curso_id = parsePositiveId(req.query.curso_id, 'curso_id');
    const ano_id = parsePositiveId(req.query.ano_id, 'ano_id');
    const semestre_id = parsePositiveId(req.query.semestre_id, 'semestre_id');
    const curriculo_id = parsePositiveId(req.query.curriculo_id, 'curriculo_id');
    const turma = normalizeText(req.query.turma, 'turma', { maxLength: 255 });
    const contexto = { curso_id, ano_id, semestre_id, curriculo_id };
    const where = { ...contexto };

    if (parseLegacyQueryFlag(req.query.turma_grade_legada)) {
      Object.assign(where, gradeScopeWhere(contexto, parseGradeScope('legacy', null)));
    } else if (!isEmpty(req.query.turma_grade)) {
      Object.assign(where, gradeScopeWhere(contexto, parseGradeScope('existing', req.query.turma_grade)));
    }

    const grade = await GradeHoraria.findAll({
      where,
      include: [
        { model: Disciplina, as: 'disciplina', required: false },
        { model: Pessoa, as: 'professor', required: false },
        { model: Departamento, as: 'departamento', required: false },
        { model: Horario, as: 'horario', required: false },
        { model: DiaSemana, as: 'diaSemana', required: false },
        { model: Curso, as: 'curso', required: false },
        { model: Ano, as: 'ano', required: false },
        { model: Semestre, as: 'semestre', required: false },
        { model: Curriculo, as: 'curriculo', required: false },
      ],
      order: [[{ model: Horario, as: 'horario' }, 'id', 'ASC'], ['dia_semana_id', 'ASC']],
    });

    if (grade.length === 0) {
      return res.status(404).json({ error: 'Nenhuma grade encontrada para os filtros selecionados.' });
    }

    // O coordenador oficial pertence ao curso. A coluna coordenador_id da grade
    // pode conter um valor antigo, então não deve definir o cabeçalho do PDF.
    const cursoOficial = await Curso.findByPk(curso_id, {
      attributes: ['id', 'nome', 'coordenador_id'],
    });
    if (!cursoOficial) {
      return res.status(404).json({ error: 'Curso não encontrado para a grade selecionada.' });
    }

    const coordenadorCursoId = parsePositiveId(
      cursoOficial.coordenador_id,
      'coordenador_id do curso',
      { optional: true },
    );
    const coordenadorOficial = coordenadorCursoId
      ? await Pessoa.findByPk(coordenadorCursoId, { attributes: ['id', 'nome'] })
      : null;

    const primeiro = grade[0];
    const dadosParaPDF = montarDadosParaPDF(grade, {
      curso: cursoOficial.nome || primeiro.curso?.nome,
      curriculo: primeiro.curriculo?.descricao || primeiro.curriculo?.nome,
      anoLetivo: primeiro.ano?.descricao || primeiro.ano?.ano,
      coordenador: coordenadorOficial?.nome || '-',
      semestre: primeiro.semestre?.descricao || primeiro.semestre?.nome,
      turma: turma || primeiro.turma_grade || '',
    });
    const pdfBuffer = await generatePDF(renderGradeHTML(dadosParaPDF));
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="grade-horaria.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    console.error('Erro interno ao gerar PDF:', error);
    if (!res.headersSent) return res.status(500).json({ error: 'Erro interno ao gerar o PDF.' });
  }
};

/* ======================================================
   BUSCAR GRADE (VISUALIZAÇÃO LIBERADA PARA TODOS OS CURSOS)
====================================================== */
exports.findByContext = async (req, res) => {
  try {
    let {
      curso_id, ano_id, semestre_id, curriculo_id,
      coordenador_id, professor_id, departamento_id,
    } = req.query;

    const usuario = req.user;
    if (usuario && (!curso_id || ['null', 'undefined'].includes(String(curso_id).trim().toLowerCase()))) {
      const role = String(usuario.role || '').toLowerCase();
      const pessoaId = Number(usuario.pessoa_id || usuario.id);
      if (role.includes('coordenador') && !role.includes('admin')) {
        const cursosDoCoordenador = await Curso.findAll({ where: { coordenador_id: pessoaId }, attributes: ['id'] });
        if (cursosDoCoordenador.length > 0) curso_id = cursosDoCoordenador[0].id;
      }
    }

    const where = {};
    const filtros = {
      curso_id: parseFilterId(curso_id, 'curso_id'),
      ano_id: parseFilterId(ano_id, 'ano_id'),
      semestre_id: parseFilterId(semestre_id, 'semestre_id'),
      curriculo_id: parseFilterId(curriculo_id, 'curriculo_id'),
      coordenador_id: parseFilterId(coordenador_id, 'coordenador_id'),
      professor_id: parseFilterId(professor_id, 'professor_id'),
      departamento_id: parseFilterId(departamento_id, 'departamento_id'),
    };
    Object.entries(filtros).forEach(([key, value]) => { if (value !== null) where[key] = value; });


    const filtrarLegada = parseLegacyQueryFlag(req.query.turma_grade_legada);
    if (filtrarLegada && !isEmpty(req.query.turma_grade)) {
      throw new ApiError('Informe turma_grade ou turma_grade_legada, não ambos.');
    }
    if (filtrarLegada) {
      where[Op.or] = [{ turma_grade: null }, { turma_grade: '' }];
    } else if (!isEmpty(req.query.turma_grade)) {
      where.turma_grade = normalizeText(req.query.turma_grade, 'turma_grade', { optional: false, maxLength: 100 });
    }

    const possuiContextoCompleto = Boolean(where.curso_id && where.curriculo_id && where.semestre_id);
    const disciplinasValidas = possuiContextoCompleto
      ? await buscarDisciplinasDoContexto({ curso_id: where.curso_id, curriculo_id: where.curriculo_id, semestre_id: where.semestre_id })
      : [];

    const registros = await GradeHoraria.findAll({
      where,
      distinct: true,
      include: [
        { model: Disciplina, as: 'disciplina', required: false, attributes: ['id', 'nome', 'codigo', 'carga_horaria', 'departamento_id'] },
        { model: Departamento, as: 'departamento', required: false },
        { model: Curso, as: 'curso', required: false },
        { model: Pessoa, as: 'professor', required: false },
        { model: Pessoa, as: 'coordenador', required: false },
        { model: Horario, as: 'horario', required: false },
        { model: DiaSemana, as: 'diaSemana', required: false },
        { model: Ano, as: 'ano', required: false },
        { model: Curriculo, as: 'curriculo', required: false },
        { model: Semestre, as: 'semestre', required: false },
      ],
      order: [['dia_semana_id', 'ASC'], ['horario_id', 'ASC'], ['id', 'ASC']],
    });

    const mapaMulticurso = new Map();
    registros.forEach((r) => {
      const key = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      mapaMulticurso.set(key, (mapaMulticurso.get(key) || 0) + 1);
    });

    const resultado = registros.map((r) => {
      const key = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      const multicurso = (mapaMulticurso.get(key) || 0) > 1;
      const isDeptFilterOnly = Boolean(where.departamento_id && !where.curso_id);
      const disciplinaValida = isDeptFilterOnly || !where.curso_id || !possuiContextoCompleto ||
        (r.disciplina && disciplinasValidas.includes(Number(r.disciplina.id)));

      return {
        id: r.id,
        curso_id: r.curso_id,
        ano_id: r.ano_id,
        semestre_id: r.semestre_id,
        curriculo_id: r.curriculo_id,
        coordenador_id: r.coordenador_id,
        professor_id: r.professor_id,
        departamento_id: r.departamento_id || r.disciplina?.departamento_id || null,
        disciplina_id: r.disciplina_id,
        horario_id: r.horario_id,
        dia_semana_id: r.dia_semana_id,
        turma: r.turma || '',
        turma_grade: r.turma_grade || '',
        curso: r.curso?.nome || '-',
        ano: r.ano?.descricao || r.ano?.ano || '-',
        semestre: r.semestre?.descricao || r.semestre?.nome || '-',
        curriculo: r.curriculo?.descricao || r.curriculo?.nome || '-',
        horario: r.horario?.descricao || '-',
        diaSemana: r.diaSemana?.nome || '-',
        disciplina: r.disciplina ? {
          id: r.disciplina.id,
          nome: r.disciplina.nome,
          codigo: r.disciplina.codigo,
          carga_horaria: r.disciplina.carga_horaria,
          departamento_id: r.disciplina.departamento_id || null,
        } : null,
        professor: r.professor ? { id: r.professor.id, nome: r.professor.nome } : null,
        coordenador: r.coordenador ? { id: r.coordenador.id, nome: r.coordenador.nome } : null,
        departamento: r.departamento ? { id: r.departamento.id, nome: r.departamento.nome, sigla: r.departamento.sigla } : null,
        disciplinaInvalida: Boolean(r.disciplina && !disciplinaValida),
        multicurso,
      };
    });
    return res.json(resultado);
  } catch (error) {
    return responderErro(res, error, 'Erro ao buscar grade.');
  }
};

/* ======================================================
   SALVAR GRADE (ADMINISTRADOR, EDICAO OU COORDENADOR DO CURSO)
====================================================== */
exports.saveGrade = async (req, res) => {
  try {
    const { contexto, slots } = req.body || {};
    if (!contexto || typeof contexto !== 'object' || Array.isArray(contexto) || !Array.isArray(slots)) {
      throw new ApiError('Dados inválidos. Envie contexto e uma lista de slots.');
    }
    if (slots.length > 2000) throw new ApiError('A grade excede o limite de slots permitido.');

    const contextoIds = {
      curso_id: parsePositiveId(contexto.curso_id, 'curso_id'),
      ano_id: parsePositiveId(contexto.ano_id, 'ano_id'),
      semestre_id: parsePositiveId(contexto.semestre_id, 'semestre_id'),
      curriculo_id: parsePositiveId(contexto.curriculo_id, 'curriculo_id'),
    };
    const scope = parseGradeScope(contexto.turma_grade_mode, contexto.turma_grade);

    const slotsValidos = [];
    for (const [index, slot] of slots.entries()) {
      if (!slot || typeof slot !== 'object' || Array.isArray(slot)) throw new ApiError(`Slot ${index + 1} inválido.`);
      if (isEmpty(slot.disciplina_id)) continue;
      slotsValidos.push({
        disciplina_id: parsePositiveId(slot.disciplina_id, `disciplina_id do slot ${index + 1}`),
        horario_id: parsePositiveId(slot.horario_id, `horario_id do slot ${index + 1}`),
        dia_semana_id: parsePositiveId(slot.dia_semana_id, `dia_semana_id do slot ${index + 1}`),
        professor_id: parsePositiveId(slot.professor_id, `professor_id do slot ${index + 1}`, { optional: true }),
        departamento_id: parsePositiveId(slot.departamento_id, `departamento_id do slot ${index + 1}`, { optional: true }),
        turma: normalizeText(slot.turma, `turma do slot ${index + 1}`, { maxLength: 255 }),
      });
    }

    if (slotsValidos.length === 0) {
      throw new ApiError('A grade não pode ser salva vazia. Use Excluir para remover somente essa turma da grade.');
    }

    const resultado = await sequelize.transaction(async (transaction) => {
      await validarContextoExistente(contextoIds, transaction);
      const curso = await Curso.findByPk(contextoIds.curso_id, { transaction });
      if (!(await verificarPermissaoEdicao(req.user, contextoIds.curso_id, curso))) {
        throw new ApiError('Acesso negado: você não pode editar a grade deste curso.', 403);
      }
      // Fonte de verdade para a grade: não copiar um coordenador_id antigo enviado pelo cliente.
      const coordenadorIdOficial = parsePositiveId(
        curso.coordenador_id,
        'coordenador_id do curso',
        { optional: true },
      );
      if (['new', 'migrate'].includes(scope.mode) && !podeCriarGrupoDeGrade(req.user, curso)) {
        throw new ApiError('Apenas administradores, usuários com papel edicao e o coordenador deste curso podem criar uma turma da grade.', 403);
      }
      const disciplinasValidas = await buscarDisciplinasDoContexto(contextoIds, { transaction });
      const validasSet = new Set(disciplinasValidas);
      if (slotsValidos.some((slot) => !validasSet.has(slot.disciplina_id))) {
        throw new ApiError('Existem disciplinas fora do curso, currículo e semestre selecionados.');
      }
      await validarIdsExistentes(Horario, slotsValidos.map((slot) => slot.horario_id), 'horário', transaction);
      await validarIdsExistentes(DiaSemana, slotsValidos.map((slot) => slot.dia_semana_id), 'dia da semana', transaction);
      await validarIdsExistentes(Pessoa, [coordenadorIdOficial, ...slotsValidos.map((slot) => slot.professor_id)], 'pessoa/professor', transaction);
      await validarIdsExistentes(Departamento, slotsValidos.map((slot) => slot.departamento_id), 'departamento', transaction);

      const whereGrupo = gradeScopeWhere(contextoIds, scope);
      if (scope.mode === 'new' || scope.mode === 'migrate') {
        const destinoExiste = await GradeHoraria.findOne({ where: { ...contextoIds, turma_grade: scope.value }, transaction });
        if (destinoExiste) throw new ApiError('Já existe uma grade com esse nome. Selecione-a para editar.', 409);
        if (scope.mode === 'migrate') {
          const origemExiste = await GradeHoraria.findOne({ where: whereGrupo, transaction });
          if (!origemExiste) throw new ApiError('Não há registros legados para migrar nesse contexto.', 409);
          await GradeHoraria.destroy({ where: whereGrupo, transaction });
        }
      } else if (scope.mode === 'single' || scope.mode === 'legacy') {
        // Modo sem rótulo: atualiza apenas as linhas NULL/vazias. Se ainda não houver
        // linhas, cria a grade única sem tocar em nenhuma grade nomeada.
        const existe = await GradeHoraria.findOne({ where: whereGrupo, transaction });
        if (existe) await GradeHoraria.destroy({ where: whereGrupo, transaction });
      } else {
        const existe = await GradeHoraria.findOne({ where: whereGrupo, transaction });
        if (!existe) throw new ApiError('Essa turma da grade deixou de existir. Atualize a lista antes de salvar.', 409);
        await GradeHoraria.destroy({ where: whereGrupo, transaction });
      }

      const registros = slotsValidos.map((slot) => ({
        ...contextoIds,
        coordenador_id: coordenadorIdOficial,
        professor_id: slot.professor_id,
        departamento_id: slot.departamento_id,
        horario_id: slot.horario_id,
        dia_semana_id: slot.dia_semana_id,
        disciplina_id: slot.disciplina_id,
        turma: slot.turma,
        turma_grade: ['legacy', 'single'].includes(scope.mode) ? null : scope.value,
      }));
      if (registros.length) await GradeHoraria.bulkCreate(registros, { transaction });
      return { inseridos: registros.length };
    });

    return res.json({ message: 'Grade salva com sucesso', inseridos: resultado.inseridos });
  } catch (error) {
    return responderErro(res, error, 'Erro ao salvar grade.');
  }
};

/* ======================================================
   SALVAR SLOT ISOLADO
====================================================== */
exports.saveSlot = async (req, res) => {
  try {
    const body = req.body || {};
    const ids = {
      curso_id: parsePositiveId(body.curso_id, 'curso_id'),
      ano_id: parsePositiveId(body.ano_id, 'ano_id'),
      semestre_id: parsePositiveId(body.semestre_id, 'semestre_id'),
      curriculo_id: parsePositiveId(body.curriculo_id, 'curriculo_id'),
      disciplina_id: parsePositiveId(body.disciplina_id, 'disciplina_id'),
      horario_id: parsePositiveId(body.horario_id, 'horario_id'),
      dia_semana_id: parsePositiveId(body.dia_semana_id, 'dia_semana_id'),
      professor_id: parsePositiveId(body.professor_id, 'professor_id', { optional: true }),
      departamento_id: parsePositiveId(body.departamento_id, 'departamento_id', { optional: true }),
    };
    const turma = normalizeText(body.turma, 'turma', { maxLength: 255 });
    const scope = parseGradeScope(body.turma_grade_mode, body.turma_grade);
    if (scope.mode === 'new' || scope.mode === 'migrate') throw new ApiError('Selecione uma grade existente para salvar slots isolados.');

    const resultado = await sequelize.transaction(async (transaction) => {
      await validarContextoExistente(ids, transaction);
      const curso = await Curso.findByPk(ids.curso_id, { transaction });
      if (!(await verificarPermissaoEdicao(req.user, ids.curso_id, curso))) throw new ApiError('Acesso negado para editar esta grade.', 403);
      const disciplinasValidas = await buscarDisciplinasDoContexto(ids, { transaction });
      if (!disciplinasValidas.includes(ids.disciplina_id)) throw new ApiError('A disciplina não pertence ao curso, currículo e semestre selecionados.');
      await validarIdsExistentes(Horario, [ids.horario_id], 'horário', transaction);
      await validarIdsExistentes(DiaSemana, [ids.dia_semana_id], 'dia da semana', transaction);
      await validarIdsExistentes(Pessoa, [ids.professor_id], 'professor', transaction);
      await validarIdsExistentes(Departamento, [ids.departamento_id], 'departamento', transaction);

      const groupWhere = ['legacy', 'single'].includes(scope.mode)
        ? { [Op.or]: [{ turma_grade: null }, { turma_grade: '' }] }
        : { turma_grade: scope.value };
      const where = {
        curso_id: ids.curso_id,
        ano_id: ids.ano_id,
        semestre_id: ids.semestre_id,
        curriculo_id: ids.curriculo_id,
        horario_id: ids.horario_id,
        dia_semana_id: ids.dia_semana_id,
        disciplina_id: ids.disciplina_id,
        turma,
        ...groupWhere,
      };
      const [slotRegistro, created] = await GradeHoraria.findOrCreate({
        where,
        defaults: {
          ...ids,
          turma,
          turma_grade: ['legacy', 'single'].includes(scope.mode) ? null : scope.value,
        },
        transaction,
      });
      if (!created) {
        await slotRegistro.update({
          professor_id: ids.professor_id,
          departamento_id: ids.departamento_id,
        }, { transaction });
      }
      return { slot: slotRegistro, created };
    });
    return res.json({ message: 'Slot salvo com sucesso', slot: resultado.slot, created: resultado.created });
  } catch (error) {
    return responderErro(res, error, 'Erro ao salvar slot.');
  }
};

/* ======================================================
   DELETE GRADE (ADMINISTRADOR, EDICAO OU COORDENADOR DO CURSO)
====================================================== */
exports.deleteGrade = async (req, res) => {
  try {
    const body = req.body || {};
    const contextoIds = {
      curso_id: parsePositiveId(body.curso_id, 'curso_id'),
      ano_id: parsePositiveId(body.ano_id, 'ano_id'),
      semestre_id: parsePositiveId(body.semestre_id, 'semestre_id'),
      curriculo_id: parsePositiveId(body.curriculo_id, 'curriculo_id'),
    };
    const scope = parseGradeScope(body.turma_grade_mode, body.turma_grade);
    if (scope.mode === 'new' || scope.mode === 'migrate') throw new ApiError('Selecione uma turma da grade existente para excluir.');

    const deletados = await sequelize.transaction(async (transaction) => {
      await validarContextoExistente(contextoIds, transaction);
      const curso = await Curso.findByPk(contextoIds.curso_id, { transaction });
      if (!(await verificarPermissaoEdicao(req.user, contextoIds.curso_id, curso))) throw new ApiError('Acesso negado para excluir a grade deste curso.', 403);
      return GradeHoraria.destroy({ where: gradeScopeWhere(contextoIds, scope), transaction });
    });
    return res.json({ message: 'Grade excluída com sucesso', deletados });
  } catch (error) {
    return responderErro(res, error, 'Erro ao excluir grade.');
  }
};
