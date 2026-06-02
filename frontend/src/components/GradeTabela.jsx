import { useEffect, useMemo, useState } from "react";

import {
  Table,
  Select,
  Button,
  message,
  ConfigProvider,
  Typography,
} from "antd";

import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { api } from "../services/api";

const { Text } = Typography;

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
};

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "10px 6px",
};

const horarioCellStyle = {
  backgroundColor: THEME.primary,
  color: "#fff",
  fontWeight: "700",
  textAlign: "center",
  fontSize: "12px",
};

const filtroContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const filtroLabelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#0b3d5c",
};

export default function GradeTabela() {
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);

  const [horarios, setHorarios] = useState([]);
  const [horariosOriginais, setHorariosOriginais] = useState([]);

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

  /* =========================================
     LOAD INICIAL
  ========================================= */

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
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
      setSemestres(semestresRes.data || []);
      setCurriculos(curriculosRes.data || []);

      setProfessores(professoresRes.data || []);
      setCoordenadores(coordenadoresRes.data || []);
      setDepartamentos(departamentosRes.data || []);

      const horariosOrdenados = (horariosRes.data || []).sort(
        (a, b) => a.id - b.id
      );

      setHorarios(horariosOrdenados);
      setHorariosOriginais(JSON.parse(JSON.stringify(horariosOrdenados)));
    } catch {
      message.error("Erro ao carregar dados");
    }
  };

  /* =========================================
     DISCIPLINAS
  ========================================= */

  useEffect(() => {
    if (!cursoId) {
      setDisciplinas([]);
      return;
    }

    api
      .get(`/cursos/${cursoId}/disciplinas`)
      .then((res) => setDisciplinas(res.data || []))
      .catch(() => setDisciplinas([]));
  }, [cursoId]);

  /* =========================================
     LOAD GRADE
  ========================================= */

  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      setGrade([]);
      return;
    }

    loadGrade();
  }, [cursoId, anoId, semestreId, curriculoId]);

  const loadGrade = async () => {
    try {
      const response = await api.get("/grade-horaria", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
      });

      setGrade(response.data || []);

      if (response.data?.length > 0) {
        setCoordenadorId(response.data[0].coordenador_id);
      }
    } catch {
      setGrade([]);
      message.error("Erro ao carregar grade");
    }
  };

  /* =========================================
     MAPA DA GRADE
  ========================================= */

  const gradeMap = useMemo(() => {
    const map = {};

    grade.forEach((g) => {
      map[`${g.horario_id}-${g.dia_semana_id}`] = g;
    });

    return map;
  }, [grade]);

  /* =========================================
     UPDATE SLOT
  ========================================= */

  const updateSlot = (horarioId, diaId, field, value) => {
    setGrade((prev) => {
      const exists = prev.find(
        (g) => g.horario_id === horarioId && g.dia_semana_id === diaId
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
        g.horario_id === horarioId && g.dia_semana_id === diaId
          ? { ...g, [field]: value }
          : g
      );
    });
  };

  /* =========================================
     ALTERAR HORÁRIO
  ========================================= */

  const updateHorario = (oldHorarioId, newHorarioId) => {
    if (oldHorarioId === newHorarioId) return;

    const horariosAtualizados = [...horarios];

    const oldIndex = horariosAtualizados.findIndex(
      (h) => h.id === oldHorarioId
    );

    const newIndex = horariosAtualizados.findIndex(
      (h) => h.id === newHorarioId
    );

    if (oldIndex === -1 || newIndex === -1) return;

    const temp = horariosAtualizados[oldIndex];
    horariosAtualizados[oldIndex] = horariosAtualizados[newIndex];
    horariosAtualizados[newIndex] = temp;

    setHorarios(horariosAtualizados);
  };

  /* =========================================
     RESET
  ========================================= */

  const handleReset = () => {
    setCursoId(null);
    setAnoId(null);
    setSemestreId(null);
    setCurriculoId(null);
    setCoordenadorId(null);

    setGrade([]);
    setDisciplinas([]);

    const horariosResetados = JSON.parse(
      JSON.stringify(horariosOriginais)
    );

    horariosResetados.sort((a, b) => a.id - b.id);

    setHorarios(horariosResetados);

    message.success("Página redefinida");
  };

  /* =========================================
     SAVE
  ========================================= */

  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      return message.warning("Selecione os filtros");
    }

    const slots = grade.filter((g) => g.disciplina_id);

    if (!slots.length) {
      return message.warning("Nenhuma disciplina selecionada");
    }

    setSaving(true);

    try {
      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId,
        },
        slots,
      });

      message.success("Grade salva com sucesso");
      loadGrade();
    } catch {
      message.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE
  ========================================= */

  const handleDeleteGrade = async () => {
    try {
      await api.delete("/grade-horaria/delete", {
        data: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
      });

      setGrade([]);
      message.success("Grade excluída");
    } catch {
      message.error("Erro ao excluir");
    }
  };

  /* =========================================
     PDF
  ========================================= */

  const handlePDF = async () => {
    try {
      const response = await api.get("/api/relatorio-grade/pdf", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
        responseType: "blob",
      });

      const file = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(file);
      window.open(url);
    } catch {
      message.error("Erro ao gerar PDF");
    }
  };

  /* =========================================
     COLUMNS
  ========================================= */

  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 150,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      onCell: () => ({ style: horarioCellStyle }),

      render: (_, record) => (
        <Select
          value={record.id}
          style={{ width: "100%" }}
          onChange={(v) => updateHorario(record.id, v)}
          options={horarios.map((h) => ({
            value: h.id,
            label: h.descricao,
          }))}
        />
      ),
    },

    ...diasFixos.map((dia) => ({
      title: dia.nome,
      width: 340,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),

      render: (_, record) => {
        const item =
          gradeMap[`${record.id}-${dia.id}`] || {
            horario_id: record.id,
            dia_semana_id: dia.id,
          };

        return (
          <div
            style={{
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 145,
            }}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Disciplina"
              value={item.disciplina_id}
              onChange={(v) =>
                updateSlot(record.id, dia.id, "disciplina_id", v)
              }
              style={{ width: "100%" }}
              options={disciplinas.map((d) => ({
                value: d.id,
                label: `${d.codigo} - ${d.nome} (${d.carga_horaria ?? 0}h)`,
              }))}
            />

            {/* 🔥 CARGA HORÁRIA (AJUSTE PRINCIPAL) */}
            {item.disciplina_id && item.disciplina && (
              <Text style={{ fontSize: 11 }}>
                Carga horária: {item.disciplina.carga_horaria ?? 0}h
              </Text>
            )}

            {item.disciplina_id && (
              <>
                <Select
                  allowClear
                  showSearch
                  placeholder="Professor"
                  value={item.professor_id}
                  onChange={(v) =>
                    updateSlot(record.id, dia.id, "professor_id", v)
                  }
                  options={professores.map((p) => ({
                    value: p.id,
                    label: p.nome,
                  }))}
                />

                <Select
                  allowClear
                  showSearch
                  placeholder="Departamento"
                  value={item.departamento_id}
                  onChange={(v) =>
                    updateSlot(record.id, dia.id, "departamento_id", v)
                  }
                  options={departamentos.map((d) => ({
                    value: d.id,
                    label: `${d.sigla} - ${d.nome}`,
                  }))}
                />
              </>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: THEME.primary } }}>
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#f5f7fa",
        }}
      >
        {/* FILTROS */}
        <div style={{ padding: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Select value={cursoId} onChange={setCursoId} placeholder="Curso" style={{ width: 200 }} options={cursos.map(c => ({ value: c.id, label: c.nome }))} />
          <Select value={curriculoId} onChange={setCurriculoId} placeholder="Currículo" style={{ width: 200 }} options={curriculos.map(c => ({ value: c.id, label: c.descricao }))} />
          <Select value={anoId} onChange={setAnoId} placeholder="Ano" style={{ width: 150 }} options={anos.map(a => ({ value: a.id, label: a.descricao }))} />
          <Select value={semestreId} onChange={setSemestreId} placeholder="Semestre" style={{ width: 150 }} options={semestres.map(s => ({ value: s.id, label: s.descricao }))} />
        </div>

        {/* BOTÕES */}
        <div style={{ padding: 12, display: "flex", gap: 10 }}>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Salvar
          </Button>

          <Button icon={<FilePdfOutlined />} onClick={handlePDF}>
            PDF
          </Button>

          <Button danger onClick={handleDeleteGrade}>
            Excluir Grade
          </Button>

          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            Redefinir
          </Button>
        </div>

        {/* TABELA */}
        <Table
          rowKey={(record) => record.id}
          dataSource={horarios}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          sticky
          scroll={{ x: 1850, y: "calc(100vh - 200px)" }}
        />
      </div>
    </ConfigProvider>
  );
}