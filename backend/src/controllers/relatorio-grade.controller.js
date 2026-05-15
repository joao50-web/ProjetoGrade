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
        VALIDAÇÕES
      ====================================================== */

      if (!curso_id || !ano_id || !curriculo_id) {
        return res.status(400).json({
          error:
            "curso_id, ano_id e curriculo_id são obrigatórios",
        });
      }

      /* ======================================================
        DADOS BASE
      ====================================================== */

      const curso = await Curso.findByPk(curso_id);

      const ano = await Ano.findByPk(ano_id);

      const curriculo = await Curriculo.findByPk(curriculo_id);

      if (!curso || !ano || !curriculo) {
        return res.status(404).json({
          error:
            "Curso, ano ou currículo não encontrado",
        });
      }

      /* ======================================================
        COORDENADOR
      ====================================================== */

      let coordenadorNome =
        "Não informado";

      const gradeCoordenador =
        await GradeHoraria.findOne({
          where: {
            curso_id,
            ano_id,
            curriculo_id,
          },

          include: [
            {
              model: Pessoa,
              as: "coordenador",
              required: false,
              attributes: [
                "id",
                "nome",
              ],
            },
          ],
        });

      if (
        gradeCoordenador &&
        gradeCoordenador.coordenador
      ) {
        coordenadorNome =
          gradeCoordenador.coordenador.nome;
      }

      /* ======================================================
        BUSCA DISCIPLINAS VÁLIDAS DO CURSO
        ISSO REMOVE DISCIPLINAS ÓRFÃS DO PDF
      ====================================================== */

      const cursoCompleto =
        await Curso.findByPk(curso_id, {
          include: [
            {
              model: Disciplina,
              as: "disciplinas",
              attributes: ["id"],
              through: {
                attributes: [],
              },
            },
          ],
        });

      const disciplinasValidas =
        (cursoCompleto?.disciplinas || []).map(
          (d) => Number(d.id)
        );

      console.log(
        "DISCIPLINAS VÁLIDAS:",
        disciplinasValidas
      );

      /* ======================================================
        FILTRO DA GRADE
      ====================================================== */

      const whereGrade = {
        curso_id,
        ano_id,
        curriculo_id,
      };

      if (
        professor_id &&
        professor_id !== "null" &&
        professor_id !== "undefined"
      ) {
        whereGrade.professor_id =
          professor_id;
      }

      if (
        coordenador_id &&
        coordenador_id !== "null" &&
        coordenador_id !== "undefined"
      ) {
        whereGrade.coordenador_id =
          coordenador_id;
      }

      if (
        semestre_id &&
        semestre_id !== "null" &&
        semestre_id !== "undefined" &&
        todos !== "true"
      ) {
        whereGrade.semestre_id =
          semestre_id;
      }

      /* ======================================================
        BUSCA GRADE
      ====================================================== */

      let grades =
        await GradeHoraria.findAll({
          where: whereGrade,

          include: [
            {
              model: Disciplina,
              as: "disciplina",
              required: false,
              attributes: [
                "id",
                "codigo",
                "nome",
              ],
            },

            {
              model: Departamento,
              as: "departamento",
              required: false,
              attributes: [
                "id",
                "nome",
                "sigla",
              ],
            },

            {
              model: Horario,
              as: "horario",
              required: false,
              attributes: [
                "id",
                "descricao",
              ],
            },

            {
              model: DiaSemana,
              as: "diaSemana",
              required: false,
              attributes: [
                "id",
                "descricao",
              ],
            },

            {
              model: Semestre,
              as: "semestre",
              required: false,
              attributes: [
                "id",
                "descricao",
              ],
            },

            {
              model: Pessoa,
              as: "professor",
              required: false,
              attributes: [
                "id",
                "nome",
              ],
            },
          ],

          order: [
            [
              {
                model: DiaSemana,
                as: "diaSemana",
              },
              "id",
              "ASC",
            ],

            [
              {
                model: Horario,
                as: "horario",
              },
              "id",
              "ASC",
            ],
          ],
        });

      /* ======================================================
        REMOVE DISCIPLINAS INVÁLIDAS
        NÃO EXISTE MAIS NO CURSO
      ====================================================== */

      grades = grades.filter((g) => {

        /* sem disciplina */
        if (!g.disciplina_id) {
          return false;
        }

        /* disciplina removida */
        if (
          !disciplinasValidas.includes(
            Number(g.disciplina_id)
          )
        ) {

          console.log(
            "DISCIPLINA REMOVIDA DO PDF:",
            g.disciplina_id
          );

          return false;
        }

        /* disciplina deletada */
        if (!g.disciplina) {

          console.log(
            "DISCIPLINA ÓRFÃ:",
            g.disciplina_id
          );

          return false;
        }

        return true;
      });

      console.log(
        "GRADES VÁLIDAS:",
        grades.length
      );

      /* ======================================================
        HORÁRIOS E DIAS
      ====================================================== */

      const horarios =
        await Horario.findAll({
          order: [["id", "ASC"]],
        });

      const dias =
        await DiaSemana.findAll({
          order: [["id", "ASC"]],
        });

      /* ======================================================
        SEMESTRES
      ====================================================== */

      let semestresBanco = [];

      if (todos === "true") {

        semestresBanco =
          await Semestre.findAll({
            order: [["id", "ASC"]],
          });

      } else {

        const semestre =
          await Semestre.findByPk(
            semestre_id
          );

        if (semestre) {
          semestresBanco.push(
            semestre
          );
        }
      }

      if (
        semestresBanco.length === 0
      ) {
        return res.status(404).json({
          error:
            "Nenhum semestre encontrado",
        });
      }

      /* ======================================================
        MONTA TEMPLATE
      ====================================================== */

      const semestresRender =
        semestresBanco.map((sem) => {

          const registrosSemestre =
            grades.filter((g) => {

              return (
                g.semestre &&
                Number(
                  g.semestre.id
                ) === Number(sem.id)
              );
            });

          const linhas =
            horarios.map((horario) => {

              const celulas =
                dias.map((dia) => {

                  const slot =
                    registrosSemestre.find(
                      (g) => {

                        return (
                          Number(
                            g.horario_id
                          ) ===
                            Number(
                              horario.id
                            ) &&
                          Number(
                            g.dia_semana_id
                          ) ===
                            Number(
                              dia.id
                            )
                        );
                      }
                    );

                  /* =========================================
                    CÉLULA VAZIA
                  ========================================= */

                  if (
                    !slot ||
                    !slot.disciplina
                  ) {
                    return {};
                  }

                  /* =========================================
                    CÉLULA
                  ========================================= */

                  return {
                    codigo:
                      slot.disciplina
                        ?.codigo || "",

                    nome:
                      slot.disciplina
                        ?.nome || "",

                    professor:
                      slot.professor
                        ?.nome || "",

                    departamento:
                      slot
                        ?.departamento
                        ?.sigla ||
                      slot
                        ?.departamento
                        ?.nome ||
                      "",
                  };
                });

              return {
                horario:
                  horario.descricao,

                celulas,
              };
            });

          return {
            descricao:
              sem.descricao ||
              `Semestre ${sem.id}`,

            dias: dias.map(
              (d) => d.descricao
            ),

            linhas,
          };
        });

      /* ======================================================
        HTML
      ====================================================== */

      const html = renderTemplate({
        universidade:
          "Universidade Federal de Ciências da Saúde de Porto Alegre",

        curso:
          curso.nome,

        curriculo:
          curriculo.descricao ||
          curriculo.nome,

        coordenador:
          coordenadorNome,

        anoLetivo:
          ano.descricao ||
          ano.ano,

        semestres:
          semestresRender,
      });

      /* ======================================================
        PDF
      ====================================================== */

      const pdf =
        await generatePDF(html);

      res.setHeader(
        "Content-Type",
        "application/pdf"
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename=grade-${curso.nome}.pdf`
      );

      return res.end(pdf);

    } catch (error) {

      console.error(
        "Erro ao gerar PDF:",
        error
      );

      return res.status(500).json({
        error:
          "Erro interno: " +
          error.message,
      });
    }
  };