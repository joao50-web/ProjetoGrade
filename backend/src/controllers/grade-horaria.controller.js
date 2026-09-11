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

/* ======================================================
   FUNÇÃO AUXILIAR DE PERMISSÃO DE EDIÇÃO
====================================================== */
const verificarPermissaoEdicao = async (usuario, curso_id) => {
  if (!usuario) return false;

  const role = (usuario.role || "").toLowerCase();

  // Admin pode editar qualquer curso
  if (role.includes("admin")) return true;

  // Se for coordenador, verifica se é o coordenador deste curso específico
  if (role.includes("coordenador")) {
    const curso = await Curso.findByPk(curso_id);
    if (!curso) return false;
    
    const pessoaId = Number(usuario.pessoa_id || usuario.id);
    return Number(curso.coordenador_id) === pessoaId;
  }

  return false;
};

/* ======================================================
   BUSCAR GRADE (Livre para visualização de Coordenadores)
====================================================== */
exports.findByContext = async (req, res) => {
  try {
    let {
      curso_id, ano_id, semestre_id, curriculo_id,
      coordenador_id, professor_id, departamento_id,
    } = req.query;

    const where = {};
    const usuario = req.user;

    // Se for coordenador (e não admin), garantimos que se ele não mandou curso ou mandou um inválido, 
    // pegamos o curso dele para evitar tela vazia ou erro.
    if (usuario) {
      const role = (usuario.role || "").toLowerCase();
      const pessoaId = Number(usuario.pessoa_id || usuario.id);

      if (role.includes("coordenador") && !role.includes("admin")) {
        const cursosDoCoordenador = await Curso.findAll({
          where: { coordenador_id: pessoaId },
          attributes: ["id"],
        });
        const idsCursosCoordenador = cursosDoCoordenador.map((c) => c.id);

        // Se o curso solicitado não foi passado ou não pertence a ele, ajusta para o primeiro curso dele (se houver)
        if ((!curso_id || curso_id === "null" || curso_id === "undefined" || !idsCursosCoordenador.includes(Number(curso_id))) && idsCursosCoordenador.length > 0) {
          curso_id = idsCursosCoordenador[0];
        }
      }
    }

    if (curso_id && curso_id !== "null" && curso_id !== "undefined") {
      where.curso_id = curso_id;
    }
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
        { model: Disciplina, as: "disciplina", required: false, attributes: ["id", "nome", "codigo", "carga_horaria"] },
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
        id: r.id, curso_id: r.curso_id, ano_id: r.ano_id, semestre_id: r.semestre_id,
        curriculo_id: r.curriculo_id, coordenador_id: r.coordenador_id, professor_id: r.professor_id,
        departamento_id: r.departamento_id, disciplina_id: r.disciplina_id, horario_id: r.horario_id,
        dia_semana_id: r.dia_semana_id, turma: r.turma || "",
        curso: r.curso?.nome || "-", ano: r.ano?.descricao || r.ano?.ano || "-",
        semestre: r.semestre?.descricao || r.semestre?.nome || "-",
        curriculo: r.curriculo?.descricao || r.curriculo?.nome || "-",
        horario: r.horario?.descricao || "-", diaSemana: r.diaSemana?.nome || "-",
        disciplina: r.disciplina ? { id: r.disciplina.id, nome: r.disciplina.nome, codigo: r.disciplina.codigo, carga_horaria: r.disciplina.carga_horaria } : null,
        professor: r.professor ? { id: r.professor.id, nome: r.professor.nome } : null,
        coordenador: r.coordenador ? { id: r.coordenador.id, nome: r.coordenador.nome } : null,
        departamento: r.departamento ? { id: r.departamento.id, nome: r.departamento.nome, sigla: r.departamento.sigla } : null,
        disciplinaInvalida: !!r.disciplina && !disciplinaValida, multicurso,
      };
    });

    return res.json(resultado);
  } catch (err) {
    console.error("Erro ao buscar grade:", err);
    return res.status(500).json({ error: "Erro ao buscar grade" });
  }
};

/* ======================================================
   SALVAR GRADE (Protegido por permissão de edição)
====================================================== */
exports.saveGrade = async (req, res) => {
  const { contexto, slots } = req.body;

  if (!contexto || !Array.isArray(slots)) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const { curso_id, ano_id, semestre_id, curriculo_id, coordenador_id } = contexto;
  if (!curso_id || !ano_id || !semestre_id || !curriculo_id) {
    return res.status(400).json({ error: "Preencha os filtros principais" });
  }

  const podeEditar = await verificarPermissaoEdicao(req.user, curso_id);
  if (!podeEditar) {
    return res.status(403).json({ error: "Acesso negado: Você só pode editar a grade do seu próprio curso." });
  }

  const mapa = new Map();
  slots.forEach((slot) => {
    if (slot.disciplina_id && slot.horario_id && slot.dia_semana_id) {
      const chave = `${slot.horario_id}-${slot.dia_semana_id}`;
      mapa.set(chave, slot);
    }
  });

  const slotsValidos = Array.from(mapa.values());
  const transaction = await sequelize.transaction();

  try {
    await GradeHoraria.destroy({
      where: { curso_id, ano_id, semestre_id, curriculo_id },
      transaction,
    });

    const registros = slotsValidos.map((slot) => ({
      curso_id, ano_id, semestre_id, curriculo_id,
      coordenador_id: coordenador_id || null, professor_id: slot.professor_id || null,
      departamento_id: slot.departamento_id || null, horario_id: slot.horario_id,
      dia_semana_id: slot.dia_semana_id, disciplina_id: slot.disciplina_id, turma: slot.turma || null,
    }));

    if (registros.length > 0) {
      await GradeHoraria.bulkCreate(registros, { transaction });
    }

    await transaction.commit();
    return res.json({ message: "Grade salva com sucesso", inseridos: registros.length });
  } catch (err) {
    await transaction.rollback();
    console.error("Erro ao salvar grade:", err);
    return res.status(500).json({ error: "Erro ao salvar grade" });
  }
};

/* ======================================================
   SALVAR SLOT (Protegido por permissão de edição)
====================================================== */
exports.saveSlot = async (req, res) => {
  try {
    const {
      curso_id, coordenador_id, professor_id, departamento_id,
      ano_id, semestre_id, curriculo_id, horario_id, dia_semana_id, disciplina_id, turma,
    } = req.body;

    if (!curso_id || !ano_id || !semestre_id || !curriculo_id || !horario_id || !dia_semana_id) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const podeEditar = await verificarPermissaoEdicao(req.user, curso_id);
    if (!podeEditar) {
      return res.status(403).json({ error: "Acesso negado para este curso." });
    }

    const registro = await GradeHoraria.create({
      curso_id, coordenador_id: coordenador_id || null, professor_id: professor_id || null,
      departamento_id: departamento_id || null, ano_id, semestre_id, curriculo_id, 
      horario_id, dia_semana_id, disciplina_id: disciplina_id || null, turma: turma || null,
    });

    return res.json(registro);
  } catch (err) {
    console.error("Erro ao salvar slot:", err);
    return res.status(500).json({ error: "Erro ao salvar slot" });
  }
};

/* ======================================================
   DELETE GRADE (Protegido por permissão de edição)
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
      where: { curso_id, ano_id, semestre_id, curriculo_id },
    });

    return res.json({ message: "Grade excluída com sucesso", deletados: deleted });
  } catch (err) {
    console.error("Erro ao deletar grade:", err);
    return res.status(500).json({ error: "Erro ao deletar grade" });
  }
};