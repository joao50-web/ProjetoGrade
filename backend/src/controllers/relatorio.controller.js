const {
  Disciplina,
  Curso,
  Departamento,
  Pessoa,
  GradeHoraria,
  Ano,
  Semestre,
  Curriculo,
} = require("../models");

/* =========================================================
   RELATÓRIO ESTRUTURA ACADÊMICA
========================================================= */

const relatorioProfessor = async (req, res) => {
  try {
    const {
      departamento_id,
      curso_id,
      professor_id,
      disciplina_id,
      ano_id,
      semestre_id,
      curriculo_id,
      coordenador_id,
      carga_horaria, 
    } = req.query;

    const where = {};

    if (disciplina_id && disciplina_id !== "null") {
      where.disciplina_id = disciplina_id;
    }

    if (curso_id && curso_id !== "null") {
      where.curso_id = curso_id;
    }

    if (professor_id && professor_id !== "null") {
      where.professor_id = professor_id;
    }

    if (departamento_id && departamento_id !== "null") {
      where.departamento_id = departamento_id;
    }

    if (ano_id && ano_id !== "null") {
      where.ano_id = ano_id;
    }

    if (semestre_id && semestre_id !== "null") {
      where.semestre_id = semestre_id;
    }

    if (curriculo_id && curriculo_id !== "null") {
      where.curriculo_id = curriculo_id;
    }

    if (coordenador_id && coordenador_id !== "null") {
      where.coordenador_id = coordenador_id;
    }

    const includeDisciplina = {
      model: Disciplina,
      as: "disciplina",
      required: false,
      attributes: ["id", "nome", "codigo", "carga_horaria"],
    };

    if (carga_horaria && carga_horaria !== "null") {
      includeDisciplina.where = { carga_horaria: Number(carga_horaria) };
      includeDisciplina.required = true; 
    }

    const registros = await GradeHoraria.findAll({
      where,
      distinct: true,
      include: [
        includeDisciplina,
        {
          model: Curso,
          as: "curso",
          required: false,
        },
        {
          model: Departamento,
          as: "departamento",
          required: false,
        },
        {
          model: Pessoa,
          as: "professor",
          required: false,
        },
        {
          model: Pessoa,
          as: "coordenador",
          required: false,
        },
        {
          model: Ano,
          as: "ano",
          required: false,
        },
        {
          model: Semestre,
          as: "semestre",
          required: false,
        },
        {
          model: Curriculo,
          as: "curriculo",
          required: false,
        },
      ],
    });

    /* =====================================================
       AGRUPAMENTO
    ===================================================== */

    const mapa = new Map();

    registros.forEach((r) => {
      const chave =
        `${r.disciplina_id}-${r.curso_id}-${r.professor_id}-${r.ano_id}-${r.semestre_id}-${r.curriculo_id}-${r.coordenador_id}`;

      if (!mapa.has(chave)) {
        mapa.set(chave, {
          id: chave,

          nome: r.disciplina?.nome || "-",
          codigo: r.disciplina?.codigo || "-",
          carga_horaria: r.disciplina?.carga_horaria || 0,

          cursos: [],
          professores: [],
          coordenador: r.coordenador?.nome || "-",

          departamento: r.departamento?.nome || "-",

          ano: r.ano?.descricao || r.ano?.ano || "-",
          semestre: r.semestre?.descricao || r.semestre?.nome || "-",
          curriculo: r.curriculo?.descricao || r.curriculo?.nome || "-",
        });
      }

      const item = mapa.get(chave);

      if (r.curso?.nome && !item.cursos.includes(r.curso.nome)) {
        item.cursos.push(r.curso.nome);
      }

      if (r.professor?.nome && !item.professores.includes(r.professor.nome)) {
        item.professores.push(r.professor.nome);
      }
    });

    const resultado = Array.from(mapa.values());

    return res.json(resultado);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Erro relatório professor",
    });
  }
};

module.exports = {
  relatorioProfessor,
};