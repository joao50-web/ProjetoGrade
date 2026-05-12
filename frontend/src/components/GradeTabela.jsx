import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  ConfigProvider,
} from "antd";

import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { api } from "../services/api";

const THEME = {
  primary: "#0b3d5c",
  border: "#d9e2ec",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
};

const labelStyle = {
  fontSize: 11,
  color: "#0b3d5c",
  marginBottom: 4,
  fontWeight: 600,
};

const selectStyle = {
  width: 220,
};

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "10px 6px",
};

export default function GradeTabela() {
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [grade, setGrade] = useState([]);
  const [saving, setSaving] = useState(false);

  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);
  const [coordenadorId, setCoordenadorId] = useState(null);

  const diasFixos = [
    { id: 1, nome: "SEGUNDA" },
    { id: 2, nome: "TERÇA" },
    { id: 3, nome: "QUARTA" },
    { id: 4, nome: "QUINTA" },
    { id: 5, nome: "SEXTA" },
  ];

  /* =========================================================
     LOAD INICIAL
  ========================================================= */

  useEffect(() => {
    const load = async () => {
      try {
        const [
          cursosRes,
          anosRes,
          semestresRes,
          curriculosRes,
          horariosRes,
          professoresRes,
          coordenadoresRes,
          departamentosRes,
        ] = await Promise.all([
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/pessoas/professores"),
          api.get("/pessoas/coordenadores"),
          api.get("/departamentos"),
        ]);

        setCursos(cursosRes.data || []);

        setAnos(anosRes.data || []);

        setSemestres(
          semestresRes.data || [],
        );

        setCurriculos(
          curriculosRes.data || [],
        );

        setProfessores(
          professoresRes.data || [],
        );

        setCoordenadores(
          coordenadoresRes.data || [],
        );

        setDepartamentos(
          departamentosRes.data || [],
        );

        setHorarios(
          (horariosRes.data || []).sort(
            (a, b) => {
              const horaA =
                a.descricao.split("-")[0];

              const horaB =
                b.descricao.split("-")[0];

              return horaA.localeCompare(
                horaB,
              );
            },
          ),
        );
      } catch (err) {
        console.error(err);

        message.error(
          "Erro ao carregar dados",
        );
      }
    };

    load();
  }, []);

  /* =========================================================
     DISCIPLINAS DO CURSO
  ========================================================= */

  useEffect(() => {
    if (!cursoId) {
      setDisciplinas([]);
      return;
    }

    api
      .get(
        `/cursos/${cursoId}/disciplinas`,
      )
      .then((res) => {
        setDisciplinas(
          res.data || [],
        );
      })
      .catch(() => {
        setDisciplinas([]);
      });
  }, [cursoId]);

  /* =========================================================
     BUSCAR GRADE
  ========================================================= */

  useEffect(() => {
    if (
      !cursoId ||
      !anoId ||
      !semestreId ||
      !curriculoId
    ) {
      setGrade([]);
      return;
    }

    loadGrade();
  }, [
    cursoId,
    anoId,
    semestreId,
    curriculoId,
  ]);

  const loadGrade = async () => {
    try {
      const response = await api.get(
        "/grade-horaria",
        {
          params: {
            curso_id: cursoId,
            ano_id: anoId,
            semestre_id: semestreId,
            curriculo_id:
              curriculoId,
          },
        },
      );

      setGrade(response.data || []);

      /* ======================================
         AJUSTA COORDENADOR AUTOMATICAMENTE
      ====================================== */

      if (
        response.data &&
        response.data.length > 0
      ) {
        const primeiro =
          response.data[0];

        if (
          primeiro.coordenador_id
        ) {
          setCoordenadorId(
            primeiro.coordenador_id,
          );
        }
      }
    } catch (err) {
      console.error(err);

      setGrade([]);

      message.error(
        "Erro ao carregar grade",
      );
    }
  };

  /* =========================================================
     UPDATE SLOT
  ========================================================= */

  const updateSlot = (
    horarioId,
    diaId,
    field,
    value,
  ) => {
    setGrade((prev) => {
      const exists = prev.find(
        (g) =>
          g.horario_id ===
            horarioId &&
          g.dia_semana_id === diaId,
      );

      if (!exists) {
        return [
          ...prev,
          {
            horario_id: horarioId,
            dia_semana_id: diaId,
            disciplina_id: null,
            professor_id: null,
            departamento_id: null,
            [field]: value,
          },
        ];
      }

      return prev.map((g) =>
        g.horario_id ===
          horarioId &&
        g.dia_semana_id === diaId
          ? {
              ...g,
              [field]: value,
            }
          : g,
      );
    });
  };

  /* =========================================================
     SAVE
  ========================================================= */

  const handleSave = async () => {
    if (
      !cursoId ||
      !anoId ||
      !semestreId ||
      !curriculoId
    ) {
      return message.warning(
        "Selecione os filtros",
      );
    }

    const slots = grade.filter(
      (g) => g.disciplina_id,
    );

    if (!slots.length) {
      return message.warning(
        "Nenhuma disciplina selecionada",
      );
    }

    setSaving(true);

    try {
      await api.post(
        "/grade-horaria/save",
        {
          contexto: {
            curso_id: cursoId,
            ano_id: anoId,
            semestre_id:
              semestreId,
            curriculo_id:
              curriculoId,
            coordenador_id:
              coordenadorId ??
              null,
          },

          slots,
        },
      );

      message.success(
        "Grade salva com sucesso",
      );

      loadGrade();
    } catch (err) {
      console.error(err);

      message.error(
        err?.response?.data
          ?.error ||
          "Erro ao salvar",
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     PDF
  ========================================================= */

  const handlePDF = async () => {
    try {
      const response = await api.get(
        "/api/relatorio-grade/pdf",
        {
          params: {
            curso_id: cursoId,
            ano_id: anoId,
            semestre_id:
              semestreId,
            curriculo_id:
              curriculoId,
          },

          responseType: "blob",
        },
      );

      const file = new Blob(
        [response.data],
        {
          type: "application/pdf",
        },
      );

      const fileURL =
        URL.createObjectURL(file);

      window.open(fileURL);
    } catch (err) {
      console.error(err);

      message.error(
        "Erro ao gerar PDF",
      );
    }
  };

  /* =========================================================
     COLUMNS
  ========================================================= */

  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 100,
      fixed: "left",
      align: "center",

      onHeaderCell: () => ({
        style: headerStyle,
      }),

      render: (text) => (
        <div
          style={{
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {text}
        </div>
      ),
    },

    ...diasFixos.map((dia) => ({
      title: dia.nome,

      width: 320,

      align: "center",

      onHeaderCell: () => ({
        style: headerStyle,
      }),

      render: (_, record) => {
        const item =
          grade.find(
            (g) =>
              g.horario_id ===
                record.id &&
              g.dia_semana_id ===
                dia.id,
          ) || {
            horario_id: record.id,
            dia_semana_id: dia.id,
            disciplina_id: null,
            professor_id: null,
            departamento_id: null,
          };

        return (
          <div
            style={{
              padding: 6,
              display: "flex",
              flexDirection:
                "column",
              gap: 6,
              minHeight: 130,
            }}
          >
            {/* DISCIPLINA */}
            <Select
              allowClear
              showSearch
              size="small"
              placeholder="Disciplina"
              value={
                item.disciplina_id
              }
              optionFilterProp="label"
              style={{
                width: "100%",
              }}
              dropdownStyle={{
                width: 500,
              }}
              onChange={(value) =>
                updateSlot(
                  record.id,
                  dia.id,
                  "disciplina_id",
                  value,
                )
              }
              options={disciplinas.map(
                (d) => ({
                  value: d.id,

                  label: `${d.codigo} - ${d.nome}`,
                }),
              )}
            />

            {/* PROFESSOR */}
            {item.disciplina_id && (
              <>
                <Select
                  allowClear
                  showSearch
                  size="small"
                  placeholder="Professor"
                  value={
                    item.professor_id
                  }
                  optionFilterProp="label"
                  style={{
                    width: "100%",
                  }}
                  dropdownStyle={{
                    width: 350,
                  }}
                  onChange={(value) =>
                    updateSlot(
                      record.id,
                      dia.id,
                      "professor_id",
                      value,
                    )
                  }
                  options={professores.map(
                    (p) => ({
                      value: p.id,
                      label: p.nome,
                    }),
                  )}
                />

                {/* DEPARTAMENTO */}
                <Select
                  allowClear
                  showSearch
                  size="small"
                  placeholder="Departamento"
                  value={
                    item.departamento_id
                  }
                  optionFilterProp="label"
                  style={{
                    width: "100%",
                  }}
                  dropdownStyle={{
                    width: 350,
                  }}
                  onChange={(value) =>
                    updateSlot(
                      record.id,
                      dia.id,
                      "departamento_id",
                      value,
                    )
                  }
                  options={departamentos.map(
                    (d) => ({
                      value: d.id,

                      label: `${d.sigla} - ${d.nome}`,
                    }),
                  )}
                />
              </>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary:
            THEME.primary,
        },
      }}
    >
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent:
              "space-between",
            gap: 14,
            flexWrap: "wrap",
            background:
              "linear-gradient(180deg,#f8fbff 0%,#ffffff 100%)",
            borderBottom:
              "1px solid rgba(11,61,92,0.12)",
          }}
        >
          {/* FILTROS */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {/* CURSO */}
            <div>
              <div style={labelStyle}>
                Curso
              </div>

              <Select
                style={selectStyle}
                placeholder="Curso"
                value={cursoId}
                onChange={setCursoId}
                allowClear
                options={cursos.map(
                  (c) => ({
                    value: c.id,
                    label: c.nome,
                  }),
                )}
              />
            </div>

            {/* CURRICULO */}
            <div>
              <div style={labelStyle}>
                Currículo
              </div>

              <Select
                style={selectStyle}
                placeholder="Currículo"
                value={curriculoId}
                onChange={
                  setCurriculoId
                }
                allowClear
                options={curriculos.map(
                  (c) => ({
                    value: c.id,

                    label:
                      c.descricao ||
                      c.nome,
                  }),
                )}
              />
            </div>

            {/* ANO */}
            <div>
              <div style={labelStyle}>
                Ano
              </div>

              <Select
                style={{
                  width: 120,
                }}
                placeholder="Ano"
                value={anoId}
                onChange={setAnoId}
                allowClear
                options={anos.map(
                  (a) => ({
                    value: a.id,

                    label:
                      a.descricao ||
                      a.ano,
                  }),
                )}
              />
            </div>

            {/* SEMESTRE */}
            <div>
              <div style={labelStyle}>
                Semestre
              </div>

              <Select
                style={{
                  width: 140,
                }}
                placeholder="Semestre"
                value={semestreId}
                onChange={
                  setSemestreId
                }
                allowClear
                options={semestres.map(
                  (s) => ({
                    value: s.id,

                    label:
                      s.descricao ||
                      s.nome,
                  }),
                )}
              />
            </div>

            {/* COORDENADOR */}
            <div>
              <div style={labelStyle}>
                Coordenador
              </div>

              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                style={{
                  width: 220,
                }}
                placeholder="Coordenador"
                value={coordenadorId}
                onChange={
                  setCoordenadorId
                }
                options={coordenadores.map(
                  (c) => ({
                    value: c.id,
                    label: c.nome,
                  }),
                )}
              />
            </div>
          </div>

          {/* BOTOES */}
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
            >
              Salvar
            </Button>

            <Button
              icon={
                <FilePdfOutlined />
              }
              onClick={handlePDF}
            >
              PDF
            </Button>

            <Button
              icon={
                <ReloadOutlined />
              }
              onClick={() =>
                window.location.reload()
              }
            />
          </div>
        </div>

        {/* TABELA */}
        <Table
          rowKey="id"
          dataSource={horarios}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          tableLayout="fixed"
          sticky
          scroll={{
            x: 1800,
            y: "calc(100vh - 120px)",
          }}
        />
      </div>
    </ConfigProvider>
  );
}