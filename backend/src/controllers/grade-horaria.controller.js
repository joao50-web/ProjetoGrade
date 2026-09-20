const { Op } = require("sequelize");
const {
  Curso,
  GradeHoraria,
  Disciplina,
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
  const turmaNome = meta.turma || primeiro.turma_grade || ""; // NOVO: Capturando a turma

  const DIAS_SEMANA = [
    { id: 1, nome: "2ª feira", nomesValidos: ["1", "2ª feira", "segunda", "segunda-feira"] },
    { id: 2, nome: "3ª feira", nomesValidos: ["2", "3ª feira", "terça", "terça-feira"] },
    { id: 3, nome: "4ª feira", nomesValidos: ["3", "4ª feira", "quarta", "quarta-feira"] },
    { id: 4, nome: "5ª feira", nomesValidos: ["4", "5ª feira", "quinta", "quinta-feira"] },
    { id: 5, nome: "6ª feira", nomesValidos: ["5", "6ª feira", "sexta", "sexta-feira"] },
    { id: 6, nome: "Sábado", nomesValidos: ["6", "sábado", "sabado"] },
  ];

  const HORARIOS_PADRAO = [
    "08:00-08:50", "08:50-09:40", "09:40-10:30", "10:30-11:20", "11:20-12:10",
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
    turmaGrade: turmaNome, // NOVO: Passando para o template
    semestres: [
      {
        descricao: semestreNome,
        dias: DIAS_SEMANA.map((d) => d.nome),
        linhas,
      },
    ],
  };
};

/* ======================================================
   FUNÇÃO AUXILIAR DE PERMISSÃO DE EDIÇÃO
====================================================== */
const verificarPermissaoEdicao = async (usuario, curso_id) => {
  if (!usuario) return false;

  const role = (usuario.role || "").toLowerCase();

  if (role.includes("admin") || role.includes("edicao") || role.includes("editor")) {
    return true;
  }

  if (role.includes("coordenador")) {
    const curso = await Curso.findByPk(curso_id);
    if (!curso) return false;

    const pessoaId = Number(usuario.pessoa_id || usuario.id);
    return Number(curso.coordenador_id) === pessoaId;
  }

  return false;
};

/* ======================================================
   GERAR E EXPORTAR PDF DA GRADE
====================================================== */
exports.gerarPdf = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id, turma } = req.query; // NOVO: Capturando 'turma' do query

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({ error: "Parâmetros insuficientes para gerar o PDF." });
    }

    const grade = await GradeHoraria.findAll({
      where: {
        curso_id: Number(curso_id),
        ano_id: Number(ano_id),
        semestre_id: Number(semestre_id),
        curriculo_id: Number(curriculo_id),
      },
      include: [
        { model: Disciplina, as: "disciplina", required: false },
        { model: Pessoa, as: "professor", required: false },
        { model: Pessoa, as: "coordenador", required: false },
        { model: Departamento, as: "departamento", required: false },
        { model: Horario, as: "horario", required: false },
        { model: DiaSemana, as: "diaSemana", required: false },
        { model: Curso, as: "curso", required: false },
        { model: Ano, as: "ano", required: false },
        { model: Semestre, as: "semestre", required: false },
        { model: Curriculo, as: "curriculo", required: false }
      ],
      order: [
        [{ model: Horario, as: "horario" }, "id", "ASC"],
        ["dia_semana_id", "ASC"]
      ]
    });

    if (!grade || grade.length === 0) {
      return res.status(404).json({ error: "Nenhuma grade encontrada para os filtros selecionados." });
    }

    const primeiro = grade[0] || {};
    const dadosParaPDF = montarDadosParaPDF(grade, {
      curso: primeiro.curso?.nome,
      curriculo: primeiro.curriculo?.descricao || primeiro.curriculo?.nome,
      anoLetivo: primeiro.ano?.descricao || primeiro.ano?.ano,
      coordenador: primeiro.coordenador?.nome,
      semestre: primeiro.semestre?.descricao || primeiro.semestre?.nome,
      turma: turma, // NOVO: Passando a turma recebida pro gerador do PDF
    });
    const htmlContent = renderGradeHTML(dadosParaPDF);

    const pdfBuffer = await generatePDF(htmlContent);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="grade-horaria.pdf"');
    res.setHeader("Content-Length", pdfBuffer.length);
    return res.end(pdfBuffer);

  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Erro interno ao gerar o PDF.", details: error.message });
    }
  }
};

/* ======================================================
   BUSCAR GRADE
====================================================== */
exports.findByContext = async (req, res) => {
  try {
    let {
      curso_id, ano_id, semestre_id, curriculo_id,
      coordenador_id, professor_id, departamento_id,
    } = req.query;

    const where = {};
    const usuario = req.user;

    if (usuario) {
      const role = (usuario.role || "").toLowerCase();
      const pessoaId = Number(usuario.pessoa_id || usuario.id);

      if (role.includes("coordenador") && !role.includes("admin")) {
        const cursosDoCoordenador = await Curso.findAll({
          where: { coordenador_id: pessoaId },
          attributes: ["id"],
        });
        const idsCursosCoordenador = cursosDoCoordenador.map((c) => c.id);

        if ((!curso_id || curso_id === "null" || curso_id === "undefined" || !idsCursosCoordenador.includes(Number(curso_id))) && idsCursosCoordenador.length > 0) {
          curso_id = idsCursosCoordenador[0];
        }
      }
    }

    if (curso_id && curso_id !== "null" && curso_id !== "undefined") where.curso_id = curso_id;
    if (ano_id && ano_id !== "null" && ano_id !== "undefined") where.ano_id = ano_id;
    if (semestre_id && semestre_id !== "null" && semestre_id !== "undefined") where.semestre_id = semestre_id;
    if (curriculo_id && curriculo_id !== "null" && curriculo_id !== "undefined") where.curriculo_id = curriculo_id;
    if (coordenador_id && coordenador_id !== "null" && coordenador_id !== "undefined") where.coordenador_id = coordenador_id;
    if (professor_id && professor_id !== "null" && professor_id !== "undefined") where.professor_id = professor_id;
    if (departamento_id && departamento_id !== "null" && departamento_id !== "undefined") where.departamento_id = departamento_id;

    let disciplinasValidas = [];

    if (where.curso_id) {
      const curso = await Curso.findByPk(where.curso_id, {
        include: [{ model: Disciplina, as: "disciplinas", attributes: ["id"] }],
      });
      disciplinasValidas = curso?.disciplinas?.map((d) => d.id) || [];
    }

    const registros = await GradeHoraria.findAll({
      where,
      distinct: true,
      include: [
        { model: Disciplina, as: "disciplina", required: false, attributes: ["id", "nome", "codigo", "carga_horaria", "departamento_id"] },
        { model: Departamento, as: "departamento", required: false },
        { model: Curso, as: "curso", required: false },
        { model: Pessoa, as: "professor", required: false },
        { model: Pessoa, as: "coordenador", required: false },
        { model: Horario, as: "horario", required: false },
        { model: DiaSemana, as: "diaSemana", required: false },
        { model: Ano, as: "ano", required: false },
        { model: Curriculo, as: "curriculo", required: false },
        { model: Semestre, as: "semestre", required: false },
      ],
      order: [
        ["dia_semana_id", "ASC"],
        ["horario_id", "ASC"],
        ["id", "ASC"],
      ],
    });

    const mapaMulticurso = new Map();
    registros.forEach((r) => {
      const chave = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      mapaMulticurso.set(chave, (mapaMulticurso.get(chave) || 0) + 1);
    });

    const resultado = registros.map((r) => {
      const chave = `${r.disciplina_id}-${r.curso_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}`;
      const multicurso = (mapaMulticurso.get(chave) || 0) > 1;
      const isDeptFilterOnly = !!where.departamento_id && !where.curso_id;
      const disciplinaValida = isDeptFilterOnly || (r.disciplina && (!where.curso_id || disciplinasValidas.includes(r.disciplina.id)));

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
        turma: r.turma || "",
        turma_grade: r.turma_grade || "", // NOVO: Retorna a turma global da grade para o frontend
        curso: r.curso?.nome || "-",
        ano: r.ano?.descricao || r.ano?.ano || "-",
        semestre: r.semestre?.descricao || r.semestre?.nome || "-",
        curriculo: r.curriculo?.descricao || r.curriculo?.nome || "-",
        horario: r.horario?.descricao || "-",
        diaSemana: r.diaSemana?.nome || "-",
        disciplina: r.disciplina ? { id: r.disciplina.id, nome: r.disciplina.nome, codigo: r.disciplina.codigo, carga_horaria: r.disciplina.carga_horaria } : null,
        professor: r.professor ? { id: r.professor.id, nome: r.professor.nome } : null,
        coordenador: r.coordenador ? { id: r.coordenador.id, nome: r.coordenador.nome } : null,
        departamento: r.departamento ? { id: r.departamento.id, nome: r.departamento.nome, sigla: r.departamento.sigla } : null,
        disciplinaInvalida: !!r.disciplina && !disciplinaValida,
        multicurso,
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error("Erro ao buscar grade:", err);
    return res.status(500).json({ error: "Erro ao buscar grade" });
  }
};

/* ======================================================
   SALVAR GRADE
====================================================== */
exports.saveGrade = async (req, res) => {
  const { contexto, slots } = req.body;

  if (!contexto || !Array.isArray(slots)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  // NOVO: Pegando a turma do contexto
  const { curso_id, ano_id, semestre_id, curriculo_id, coordenador_id, turma } = contexto;
  if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
    return res.status(400).json({ error: "Preencha os filtros principais" });
  }

  const podeEditar = await verificarPermissaoEdicao(req.user, curso_id);
  if (!podeEditar) {
    return res.status(403).json({ error: "Acesso negado: Você só pode editar a grade do seu próprio curso." });
  }

  const slotsValidos = slots.filter(
    (slot) => slot && slot.disciplina_id && slot.horario_id && slot.dia_semana_id
  );

  const transaction = await sequelize.transaction();

  try {
    await GradeHoraria.destroy({
      where: {
        curso_id: Number(curso_id),
        ano_id: Number(ano_id),
        semestre_id: Number(semestre_id),
        curriculo_id: Number(curriculo_id),
      },
      transaction,
    });

    const registros = slotsValidos.map((slot) => ({
      curso_id: Number(curso_id),
      ano_id: Number(ano_id),
      semestre_id: Number(semestre_id),
      curriculo_id: Number(curriculo_id),
      coordenador_id: coordenador_id ? Number(coordenador_id) : null,
      professor_id: slot.professor_id ? Number(slot.professor_id) : null,
      departamento_id: slot.departamento_id ? Number(slot.departamento_id) : null,
      horario_id: Number(slot.horario_id),
      dia_semana_id: Number(slot.dia_semana_id),
      disciplina_id: Number(slot.disciplina_id),
      turma: slot.turma ? String(slot.turma).trim().toUpperCase() : null,
      turma_grade: turma ? String(turma).trim().toUpperCase() : null, // NOVO: Salvando a turma global da grade no banco
    }));

    if (registros.length > 0) {
      await GradeHoraria.bulkCreate(registros, { transaction });
    }

    await transaction.commit();
    return res.json({ message: "Grade salva com sucesso", inseridos: registros.length });
  } catch (err) {
    await transaction.rollback();
    console.error("Erro ao salvar grade:", err);
    return res.status(500).json({ error: "Erro ao salvar grade", details: err.message });
  }
};

/* ======================================================
   SALVAR SLOT INDIVIDUAL
====================================================== */
/* ======================================================
   SALVAR SLOT ISOLADO (Caso o frontend salve um a um)
====================================================== */
exports.saveSlot = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id, disciplina_id, horario_id, dia_semana_id, turma, professor_id, departamento_id } = req.body;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id || !disciplina_id || !horario_id || !dia_semana_id) {
      return res.status(400).json({ error: "Dados insuficientes para salvar o slot." });
    }

    const podeEditar = await verificarPermissaoEdicao(req.user, curso_id);
    if (!podeEditar) {
      return res.status(403).json({ error: "Acesso negado para editar esta grade." });
    }

    // Procura se já existe algo nesse mesmo dia/horário para sobrescrever, ou cria um novo
    const [slot, created] = await GradeHoraria.findOrCreate({
      where: {
        curso_id: Number(curso_id),
        ano_id: Number(ano_id),
        semestre_id: Number(semestre_id),
        curriculo_id: Number(curriculo_id),
        horario_id: Number(horario_id),
        dia_semana_id: Number(dia_semana_id)
      },
      defaults: {
        disciplina_id: Number(disciplina_id),
        turma: turma ? String(turma).trim().toUpperCase() : null,
        professor_id: professor_id ? Number(professor_id) : null,
        departamento_id: departamento_id ? Number(departamento_id) : null
      }
    });

    // Se já existia, a gente atualiza com os novos dados
    if (!created) {
      await slot.update({
        disciplina_id: Number(disciplina_id),
        turma: turma ? String(turma).trim().toUpperCase() : null,
        professor_id: professor_id ? Number(professor_id) : null,
        departamento_id: departamento_id ? Number(departamento_id) : null
      });
    }

    return res.json({ message: "Slot salvo com sucesso", slot });
  } catch (err) {
    console.error("Erro ao salvar slot:", err);
    return res.status(500).json({ error: "Erro ao salvar slot", details: err.message });
  }
};

/* ======================================================
   DELETE GRADE
====================================================== */
exports.deleteGrade = async (req, res) => {
  try {
    const { curso_id, ano_id, semestre_id, curriculo_id } = req.body;
    if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
      return res.status(400).json({ error: "Filtros obrigatórios" });
    }

    const podeEditar = await verificarPermissaoEdicao(req.user, curso_id);
    if (!podeEditar) {
      return res.status(403).json({ error: "Acesso negado para excluir grade deste curso." });
    }

    const deleted = await GradeHoraria.destroy({
      where: {
        curso_id: Number(curso_id),
        ano_id: Number(ano_id),
        semestre_id: Number(semestre_id),
        curriculo_id: Number(curriculo_id),
      },
    });

    return res.json({ message: "Grade excluída com sucesso", deletados: deleted });
  } catch (err) {
    console.error("Erro ao deletar grade:", err);
    return res.status(500).json({ error: "Erro ao deletar grade" });
  }
};