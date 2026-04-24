import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  Tooltip,
  ConfigProvider,
  Alert,
} from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";

// Configuração de Cores Institucionais e Design Minimalista Limpo
const THEME = {
  primary: "#0b3d5c",
  accent: "#10b981",
  border: "#e5e7eb",
  bgHeader: "#0b3d5c",
  bgTimeColumn: "#ffffff", // Removido o cinza da coluna de tempo
  textWhite: "#ffffff",
};

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "12px 8px",
  borderRight: "1px solid rgba(255,255,255,0.1)",
};

export default function GradeTabela() {
  /* ================= STATES ================= */
  const [departamentos, setDepartamentos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [grade, setGrade] = useState([]);
  const [saving, setSaving] = useState(false);

  const [deptoId, setDeptoId] = useState(null);
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

  /* ================= LOAD INICIAL ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, a, s, cur, h, professoresRes, coordRes] =
          await Promise.all([
            api.get("/departamentos"),
            api.get("/cursos"),
            api.get("/anos"),
            api.get("/semestres"),
            api.get("/curriculos"),
            api.get("/horarios"),
            api.get("/pessoas/professores"), // ✔ AGORA CERTO
            api.get("/pessoas/coordenadores"),
          ]);
        setDepartamentos(d.data || []);
        setTodosCursos(c.data || []);
        setCursos(c.data || []);
        setAnos(a.data || []);
        setSemestres(s.data || []);
        setCurriculos(cur.data || []);
        setHorarios(h.data || []);
        setProfessores(professoresRes.data || []);
        setCoordenadores(coordRes.data || []);
      } catch (err) {
        console.error(err);
        message.error("Erro ao carregar dados");
      }
    };
    load();
  }, []);

  /* ================= FILTROS ================= */
  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
    setGrade([]);
    setDisciplinas([]);
    if (!id) {
      setCursos(todosCursos);
      return;
    }
    setCursos(
      todosCursos.filter(
        (c) => c.departamento_id === id || c.departamento?.id === id,
      ),
    );
  };

  useEffect(() => {
    if (!cursoId) return;
    api
      .get(`/cursos/${cursoId}/disciplinas`)
      .then((res) => setDisciplinas(res.data || []))
      .catch(() => setDisciplinas([]));
  }, [cursoId]);

  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;
    const params = {
      curso_id: cursoId,
      ano_id: anoId,
      semestre_id: semestreId,
      curriculo_id: curriculoId,
      coordenador_id: coordenadorId === null ? "null" : coordenadorId,
    };
    api
      .get("/grade-horaria", { params })
      .then((res) => setGrade(res.data || []))
      .catch((err) => {
        console.error(err);
        setGrade([]);
      });
  }, [cursoId, anoId, semestreId, curriculoId, coordenadorId]);

  /* ================= AÇÕES ================= */
  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      message.warning("Selecione os filtros obrigatórios.");
      return;
    }
    const mapaSlots = new Map();
    grade.forEach((slot) => {
      if (slot.disciplina_id != null) {
        const chave = `${slot.horario_id}-${slot.dia_semana_id}`;
        mapaSlots.set(chave, slot);
      }
    });
    const slotsToSave = Array.from(mapaSlots.values());
    if (slotsToSave.length === 0) {
      message.warning("Nenhuma disciplina atribuída.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId ?? null,
        },
        slots: slotsToSave,
      });
      message.success("Grade salva com sucesso!");
    } catch (err) {
      message.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const handlePDF = () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      message.warning("Selecione os filtros.");
      return;
    }
    const params = new URLSearchParams({
      curso_id: cursoId,
      ano_id: anoId,
      semestre_id: semestreId,
      curriculo_id: curriculoId,
      todos: "false",
    });
    if (coordenadorId) params.append("coordenador_id", coordenadorId);
    window.open(
      `http://localhost:3001/api/relatorio-grade/pdf?${params.toString()}`,
      "_blank",
    );
  };

  /* ================= COLUNAS ================= */
  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 100,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (text) => (
        <div
          style={{
            fontWeight: "700",
            color: THEME.primary,
            fontSize: "12px",
            backgroundColor: "#ffffff", // Removido cinza
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {text}
        </div>
      ),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome,
      width: 240,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const item = grade.find(
          (g) => g.horario_id === record.id && g.dia_semana_id === dia.id,
        );
        const disciplinaObj = disciplinas.find(
          (d) => d.id === item?.disciplina_id,
        );
        const professorObj = professores.find(
          (p) => p.id === item?.professor_id,
        );

        const disciplinaLabel = disciplinaObj
          ? `${disciplinaObj.codigo} - ${disciplinaObj.nome}`
          : "";
        const professorLabel = professorObj ? professorObj.nome : "";

        return (
          <div
            style={{
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              minHeight: "80px",
              justifyContent: "center",
              borderRight: `1px solid ${THEME.border}`,
            }}
          >
            <Tooltip
              title={disciplinaLabel || "Selecionar Disciplina"}
              placement="top"
            >
              <Select
                allowClear
                showSearch
                placeholder="Disciplina"
                variant="borderless" // Removido bordas e fundos
                style={{
                  width: "100%",
                  borderBottom: `1px solid ${THEME.border}`,
                }}
                size="small"
                value={item?.disciplina_id}
                onChange={(val) =>
                  setGrade((prev) => {
                    const filtered = prev.filter(
                      (g) =>
                        !(
                          g.horario_id === record.id &&
                          g.dia_semana_id === dia.id
                        ),
                    );
                    if (val)
                      filtered.push({
                        horario_id: record.id,
                        dia_semana_id: dia.id,
                        disciplina_id: val,
                        professor_id: null,
                        coordenador_id: coordenadorId ?? null,
                      });
                    return filtered;
                  })
                }
                options={disciplinas.map((d) => ({
                  value: d.id,
                  label: (
                    <span style={{ fontSize: "12px" }}>
                      {d.codigo} - {d.nome}
                    </span>
                  ),
                }))}
                dropdownMatchSelectWidth={350}
              />
            </Tooltip>

            {item?.disciplina_id && (
              <Tooltip
                title={professorLabel || "Atribuir Professor"}
                placement="bottom"
              >
                <Select
                  allowClear
                  showSearch
                  placeholder="Professor"
                  variant="borderless" // Removido bordas e fundos
                  style={{ width: "100%", fontSize: "11px", color: "#64748b" }}
                  size="small"
                  value={item?.professor_id}
                  onChange={(val) =>
                    setGrade((prev) =>
                      prev.map((g) =>
                        g.horario_id === record.id && g.dia_semana_id === dia.id
                          ? { ...g, professor_id: val ?? null }
                          : g,
                      ),
                    )
                  }
                  options={professores.map((p) => ({
                    value: p.id,
                    label: <span style={{ fontSize: "11px" }}>{p.nome}</span>,
                  }))}
                  dropdownMatchSelectWidth={250}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    })),
  ];

  /* ================= UI ================= */
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: THEME.primary,
          borderRadius: 4,
        },
      }}
    >
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Barra de Filtros Limpa e Organizada */}
        <div
          style={{
            padding: "12px 24px",
            backgroundColor: "#ffffff", // Fundo branco limpo
            display: "flex",
            alignItems: "center",
            gap: "16px",
            borderBottom: `1px solid ${THEME.border}`,
            zIndex: 100,
          }}
        >
          <div
            style={{ display: "flex", gap: "12px", flex: 1, flexWrap: "wrap" }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                DEPARTAMENTO
              </span>
              <Select
                placeholder="Selecionar..."
                style={{ width: 160 }}
                value={deptoId}
                onChange={handleDeptoChange}
                allowClear
                options={departamentos.map((d) => ({
                  value: d.id,
                  label: d.nome,
                }))}
                size="small"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                CURSO
              </span>
              <Select
                placeholder="Selecionar..."
                style={{ width: 160 }}
                value={cursoId}
                onChange={setCursoId}
                allowClear
                options={cursos.map((c) => ({ value: c.id, label: c.nome }))}
                size="small"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                ANO
              </span>
              <Select
                placeholder="-"
                style={{ width: 70 }}
                value={anoId}
                onChange={setAnoId}
                allowClear
                options={anos.map((a) => ({ value: a.id, label: a.ano }))}
                size="small"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                SEM.
              </span>
              <Select
                placeholder="-"
                style={{ width: 70 }}
                value={semestreId}
                onChange={setSemestreId}
                allowClear
                options={semestres.map((s) => ({ value: s.id, label: s.nome }))}
                size="small"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                CURRÍCULO
              </span>
              <Select
                placeholder="Selecionar..."
                style={{ width: 120 }}
                value={curriculoId}
                onChange={setCurriculoId}
                allowClear
                options={curriculos.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
                size="small"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#64748b",
                  fontWeight: "600",
                  marginBottom: "2px",
                }}
              >
                COORDENADOR
              </span>
              <Select
                placeholder="Selecionar..."
                style={{ width: 160 }}
                value={coordenadorId}
                onChange={setCoordenadorId}
                allowClear
                showSearch
                options={coordenadores.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
                size="small"
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              style={{ backgroundColor: THEME.primary, fontWeight: "600" }}
              size="small"
            >
              SALVAR
            </Button>
            <Button
              icon={<FilePdfOutlined />}
              onClick={handlePDF}
              style={{ fontWeight: "600" }}
              size="small"
            >
              PDF
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
              size="small"
            />
          </div>
        </div>

        {/* Grade Horária Limpa */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <Table
            rowKey="id"
            dataSource={horarios}
            columns={columns}
            pagination={false}
            bordered
            size="small"
            scroll={{ x: "max-content", y: "calc(100vh - 64px)" }}
            style={{ borderRadius: 0 }}
            sticky
          />
        </div>
      </div>
    </ConfigProvider>
  );
}
