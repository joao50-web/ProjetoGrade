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
  borderColor: "#e5e7eb", // Borda cinza clara profissional
  separatorColor: "#cbd5e1", // Cor para separar blocos (um pouco mais escura)
};

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "13px", // Aumentado para melhor leitura
  textAlign: "center",
  padding: "12px 4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const horarioCellStyle = {
  backgroundColor: "#f9fafb",
  color: THEME.primary,
  fontWeight: "700",
  textAlign: "center",
  fontSize: "14px", // Aumentado para melhor leitura
  padding: "8px 4px",
  borderRight: `2px solid ${THEME.separatorColor}`, // Separador de bloco na coluna fixa
  borderBottom: `1px solid ${THEME.separatorColor}`, // Linha horizontal de destaque
};

const filtroContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const filtroLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: THEME.primary,
  marginBottom: "1px",
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
        (a, b) => a.id - b.id,
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

  const disciplinasMap = useMemo(() => {
    const map = {};

    disciplinas.forEach((d) => {
      map[d.id] = d;
    });

    return map;
  }, [disciplinas]);

  /* =========================================
     UPDATE SLOT
  ========================================= */

  const updateSlot = (horarioId, diaId, field, value) => {
    setGrade((prev) => {
      const exists = prev.find(
        (g) => g.horario_id === horarioId && g.dia_semana_id === diaId,
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
          : g,
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
      (h) => h.id === oldHorarioId,
    );

    const newIndex = horariosAtualizados.findIndex(
      (h) => h.id === newHorarioId,
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

    const horariosResetados = JSON.parse(JSON.stringify(horariosOriginais));

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
      width: 130,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: { ...headerStyle, borderRight: `2px solid ${THEME.separatorColor}` } }),
      onCell: () => ({ style: horarioCellStyle }),

      render: (_, record) => (
        <Select
          size="middle"
          variant="borderless"
          value={record.id}
          style={{ width: "100%", fontSize: "14px", fontWeight: "700" }}
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
      width: 300,
      align: "center",
      onHeaderCell: () => ({ style: { ...headerStyle, borderRight: `1px solid ${THEME.separatorColor}` } }),

      render: (_, record) => {
        const item = gradeMap[`${record.id}-${dia.id}`] || {
          horario_id: record.id,
          dia_semana_id: dia.id,
        };

        return (
          <div
            style={{
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              minHeight: 130,
              backgroundColor: item.disciplina_id ? "#fff" : "transparent",
              borderRight: `1px solid ${THEME.separatorColor}`, // Linha vertical de separação
              borderBottom: `1px solid ${THEME.separatorColor}`, // Linha horizontal de destaque
            }}
          >
            <Select
              size="middle"
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Disciplina"
              value={item.disciplina_id}
              onChange={(v) =>
                updateSlot(record.id, dia.id, "disciplina_id", v)
              }
              style={{ width: "100%", fontSize: "14px" }}
              options={disciplinas.map((d) => ({
                value: d.id,
                label: `${d.codigo} - ${d.nome}`,
              }))}
            />

            {item.disciplina_id && (
              <>
                {/* Carga Horária estilizada como os outros selects */}
                <div
                  style={{
                    height: 32,
                    width: "100%",
                    border: `1px solid ${THEME.borderColor}`,
                    borderRadius: 4,
                    backgroundColor: "#f9fafb",
                    padding: "0 11px",
                    display: "flex",
                    alignItems: "center",
                    boxSizing: "border-box",
                    fontSize: "13px",
                    color: "rgba(0,0,0,0.88)",
                  }}
                >
                  <span style={{ color: "rgba(0,0,0,0.45)", marginRight: 4 }}>Carga Horária:</span>
                  <span style={{ fontWeight: 600 }}>{disciplinasMap[item.disciplina_id]?.carga_horaria ?? 0}h</span>
                </div>

                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Professor"
                  value={item.professor_id}
                  onChange={(v) =>
                    updateSlot(record.id, dia.id, "professor_id", v)
                  }
                  style={{ width: "100%", fontSize: "13px" }}
                  options={professores.map((p) => ({
                    value: p.id,
                    label: p.nome,
                  }))}
                />

                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Departamento"
                  value={item.departamento_id}
                  onChange={(v) =>
                    updateSlot(record.id, dia.id, "departamento_id", v)
                  }
                  style={{ width: "100%", fontSize: "13px" }}
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
    <ConfigProvider 
      theme={{ 
        token: { 
          colorPrimary: THEME.primary, 
          borderRadius: 6,
          colorBorder: THEME.borderColor,
        },
        components: {
          Table: {
            headerBg: THEME.bgHeader,
            headerColor: THEME.textWhite,
            borderColor: THEME.borderColor,
            cellPaddingInline: 0,
            cellPaddingBlock: 0,
          },
          Select: {
            fontSize: 14,
          }
        }
      }}
    >
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#f3f4f6",
          padding: "16px",
          gap: "16px"
        }}
      >
        {/* BARRA DE FILTROS E AÇÕES */}
        <div
          style={{ 
            padding: "16px 20px", 
            display: "flex", 
            flexDirection: "column",
            gap: 16,
            background: "#fff",
            borderRadius: "8px",
            border: `1px solid ${THEME.borderColor}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>CURSO</span>
                <Select
                  size="middle"
                  value={cursoId}
                  onChange={setCursoId}
                  style={{ width: 220 }}
                  options={cursos.map((c) => ({ value: c.id, label: c.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>CURRÍCULO</span>
                <Select
                  size="middle"
                  value={curriculoId}
                  onChange={setCurriculoId}
                  style={{ width: 220 }}
                  options={curriculos.map((c) => ({
                    value: c.id,
                    label: c.descricao,
                  }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>ANO</span>
                <Select
                  size="middle"
                  value={anoId}
                  onChange={setAnoId}
                  style={{ width: 100 }}
                  options={anos.map((a) => ({ value: a.id, label: a.descricao }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>SEMESTRE</span>
                <Select
                  size="middle"
                  value={semestreId}
                  onChange={setSemestreId}
                  placeholder="Selecione"
                  style={{ width: 200 }}
                  options={semestres.map((s) => ({
                    value: s.id,
                    label: s.descricao,
                  }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>COORDENADOR</span>
                <Select
                  size="middle"
                  allowClear
                  showSearch
                  value={coordenadorId}
                  onChange={setCoordenadorId}
                  placeholder="Selecione o Coordenador"
                  style={{ width: 240 }}
                  options={coordenadores.map((c) => ({ value: c.id, label: c.nome }))}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Button
                size="middle"
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
                style={{ fontWeight: 600 }}
              >
                Salvar
              </Button>
              <Button size="middle" icon={<FilePdfOutlined />} onClick={handlePDF}>
                PDF
              </Button>
              <Button 
                size="middle" 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                Redefinir
              </Button>
              <Button size="middle" danger onClick={handleDeleteGrade}>
                Excluir
              </Button>
            </div>
          </div>
        </div>

        {/* ÁREA DA TABELA */}
        <div 
          style={{ 
            flex: 1, 
            background: "#fff", 
            borderRadius: "8px", 
            border: `1px solid ${THEME.borderColor}`,
            overflow: "hidden",
          }}
        >
          <Table
            rowKey={(record) => record.id}
            dataSource={horarios}
            columns={columns}
            pagination={false}
            bordered
            size="middle"
            sticky
            scroll={{ x: 1600, y: "calc(100vh - 200px)" }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
}