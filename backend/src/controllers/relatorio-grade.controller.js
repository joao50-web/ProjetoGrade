const renderTemplate = require("../templates/grade-horaria.template");
const { generatePDF } = require("../services/pdf.service");

const {
  Curso,
  Ano,
  Curriculo,
  Semestre,
  Horario,
  DiaSemana,
  GradeHoraria,
  Disciplina,
  Pessoa,
  Departamento,
} = require("../models");

// Função utilitária para limpar parâmetros de query string inválidos vindos do front-end
const parseQueryParam = (param) => {
  if (!param || param === "null" || param === "undefined") return null;
  return param;
};

exports.gerarPDF = async (req, res) => {
  try {
    const {
      curso_id,
      ano_id,
      curriculo_id,
      semestre_id,
      professor_id,
      coordenador_id,
      todos,
    } = req.query;

    /* ======================================================
        VALIDAÇÕES INICIAIS
       ====================================================== */
    if (!curso_id || !ano_id || !curriculo_id) {
      return res.status(400).json({
        error: "curso_id, ano_id e curriculo_id são obrigatórios",
      });
    }

    /* ======================================================
        BUSCA PARALELA DE DADOS BASE (Otimização de Performance)
       ====================================================== */
    const [cursoCompleto, ano, curriculo, horarios, dias] = await Promise.all([
      Curso.findByPk(curso_id, {
        include: [
          {
            model: Disciplina,
            as: "disciplinas",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      }),
      Ano.findByPk(ano_id),
      Curriculo.findByPk(curriculo_id),
      Horario.findAll({ order: [["id", "ASC"]] }),
      DiaSemana.findAll({ order: [["id", "ASC"]] }),
    ]);

    if (!cursoCompleto || !ano || !curriculo) {
      return res.status(404).json({
        error: "Curso, ano ou currículo não encontrado",
      });
    }

    // Mapeia as disciplinas válidas vinculadas ao curso
    const disciplinasValidas = (cursoCompleto.disciplinas || []).map((d) =>
      Number(d.id),
    );

    /* ======================================================
        COORDENADOR (Busca dedicada)
       ====================================================== */
    let coordenadorNome = "Não informado";
    const gradeCoordenador = await GradeHoraria.findOne({
      where: { curso_id, ano_id, curriculo_id },
      include: [
        {
          model: Pessoa,
          as: "coordenador",
          required: false,
          attributes: ["id", "nome"],
        },
      ],
    });

    if (gradeCoordenador && gradeCoordenador.coordenador) {
      coordenadorNome = gradeCoordenador.coordenador.nome;
    }

    /* ======================================================
        CONSTRUÇÃO DO FILTRO DA GRADE
       ====================================================== */
    const whereGrade = {
      curso_id,
      ano_id,
      curriculo_id,
      disciplina_id: disciplinasValidas, // Otimização: Filtro direto no Banco de Dados
    };

    const pId = parseQueryParam(professor_id);
    if (pId) whereGrade.professor_id = pId;

    const cId = parseQueryParam(coordenador_id);
    if (cId) whereGrade.coordenador_id = cId;

    const sId = parseQueryParam(semestre_id);
    if (sId && todos !== "true") {
      whereGrade.semestre_id = sId;
    }

    /* ======================================================
        BUSCA DAS GRADES HORÁRIAS
       ====================================================== */
    const grades = await GradeHoraria.findAll({
      where: whereGrade,
      include: [
        {
          model: Disciplina,
          as: "disciplina",
          required: true, // Garante que traga apenas se a relação existir de fato
          attributes: ["id", "codigo", "nome", "carga_horaria"],
        },
        {
          model: Departamento,
          as: "departamento",
          required: false,
          attributes: ["id", "nome", "sigla"],
        },
        {
          model: Horario,
          as: "horario",
          required: false,
          attributes: ["id", "descricao"],
        },
        {
          model: DiaSemana,
          as: "diaSemana",
          required: false,
          attributes: ["id", "descricao"],
        },
        {
          model: Semestre,
          as: "semestre",
          required: false,
          attributes: ["id", "descricao"],
        },
        {
          model: Pessoa,
          as: "professor",
          required: false,
          attributes: ["id", "nome"],
        },
      ],
      order: [
        [{ model: DiaSemana, as: "diaSemana" }, "id", "ASC"],
        [{ model: Horario, as: "horario" }, "id", "ASC"],
      ],
    });

    /* ======================================================
        IDENTIFICAÇÃO DOS SEMESTRES ALVO
       ====================================================== */
    let semestresBanco = [];
    if (todos === "true") {
      semestresBanco = await Semestre.findAll({ order: [["id", "ASC"]] });
    } else {
      const semestre = sId ? await Semestre.findByPk(sId) : null;
      if (semestre) semestresBanco.push(semestre);
    }

    if (semestresBanco.length === 0) {
      return res.status(404).json({
        error: "Nenhum semestre encontrado",
      });
    }

    /* ======================================================
        MONTAGEM DO MAPA PARA O TEMPLATE (Otimização O(1))
       ====================================================== */
    const semestresRender = semestresBanco.map((sem) => {
      const registrosSemestre = grades.filter(
        (g) => g.semestre && Number(g.semestre.id) === Number(sem.id)
      );

      // Criação de um dicionário (chave/valor) para busca instantânea por célula
      const slotMap = new Map();
      for (const slot of registrosSemestre) {
        const key = `${slot.horario_id}_${slot.dia_semana_id}`;
        slotMap.set(key, slot);
      }

      const linhas = horarios.map((horario) => {
        const celulas = dias.map((dia) => {
          const slot = slotMap.get(`${horario.id}_${dia.id}`);

          // Célula vazia
          if (!slot || !slot.disciplina) {
            return {};
          }

          // Célula preenchida
          return {
            codigo: slot.disciplina.codigo || "",
            nome: slot.disciplina.nome || "",
            cargaHoraria:
              slot.disciplina.carga_horaria ||
              slot.disciplina.cargaHoraria ||
              "",
            professor: slot.professor?.nome || "",
            departamento:
              slot.departamento?.sigla || slot.departamento?.nome || "",
          };
        });

        return {
          horario: horario.descricao,
          celulas,
        };
      });

      return {
        descricao: sem.descricao || `Semestre ${sem.id}`,
        dias: dias.map((d) => d.descricao),
        linhas,
      };
    });

    /* ======================================================
        GERAÇÃO E RETORNO DO ARQUIVO PDF
       ====================================================== */
    const html = renderTemplate({
      universidade: "Universidade Federal de Ciências da Saúde de Porto Alegre",
      curso: cursoCompleto.nome,
      curriculo: curriculo.descricao || curriculo.nome,
      coordenador: coordenadorNome,
      anoLetivo: ano.descricao || ano.ano,
      semestres: semestresRender,
    });

    const pdf = await generatePDF(html);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=grade-${encodeURIComponent(cursoCompleto.nome)}.pdf`,
    );

    return res.end(pdf);
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    return res.status(500).json({
      error: "Erro interno: " + error.message,
    });
  }
};