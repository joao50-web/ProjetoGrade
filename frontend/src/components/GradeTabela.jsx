import { useEffect, useState } from "react";
import { Table, Select, Button, message, Tooltip, ConfigProvider } from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";

const THEME = {
  primary: "#0b3d5c",
  border: "#e5e7eb",
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
  borderRadius: 6,
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

  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, a, s, cur, h, prof, coord] = await Promise.all([
          api.get("/departamentos"),
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/pessoas/professores"),
          api.get("/pessoas/coordenadores"),
        ]);

        setDepartamentos(d.data || []);
        setTodosCursos(c.data || []);
        setCursos(c.data || []);
        setAnos(a.data || []);
        setSemestres(s.data || []);
        setCurriculos(cur.data || []);
        setHorarios(
          (h.data || []).sort((a, b) => {
            const getHora = (str) => str.split("-")[0];
            return getHora(a.descricao).localeCompare(getHora(b.descricao));
          }),
        );
        setProfessores(prof.data || []);
        setCoordenadores(coord.data || []);
      } catch {
        message.error("Erro ao carregar dados");
      }
    };
    load();
  }, []);

  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
    setGrade([]);
    setDisciplinas([]);

    if (!id) return setCursos(todosCursos);

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

    api
      .get("/grade-horaria", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId ?? "null",
        },
      })
      .then((res) => setGrade(res.data || []))
      .catch(() => setGrade([]));
  }, [cursoId, anoId, semestreId, curriculoId, coordenadorId]);

  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      message.warning("Selecione os filtros.");
      return;
    }

    const slots = grade.filter((g) => g.disciplina_id);
    if (!slots.length) return message.warning("Nenhuma disciplina.");

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
        slots,
      });

      message.success("Grade salva com sucesso!");
    } catch {
      message.error("Erro ao salvar");
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

  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 100,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome,
      width: 260,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const item = grade.find(
          (g) => g.horario_id === record.id && g.dia_semana_id === dia.id,
        ) || {
          horario_id: record.id,
          dia_semana_id: dia.id,
          disciplina_id: null,
          professor_id: null,
        };

        return (
          <div
            style={{
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minHeight: "90px",
            }}
          >
            <Select
              allowClear
              showSearch
              size="small"
              placeholder="Disciplina"
              value={item?.disciplina_id}
              dropdownMatchSelectWidth={false}
              style={{ width: "100%", fontSize: "11px" }}
              onChange={(val) =>
                setGrade((prev) => {
                  const filtered = prev.filter(
                    (g) =>
                      !(
                        g.horario_id === record.id && g.dia_semana_id === dia.id
                      ),
                  );
                  if (val) {
                    filtered.push({
                      horario_id: record.id,
                      dia_semana_id: dia.id,
                      disciplina_id: val,
                      professor_id: null,
                    });
                  }
                  return filtered;
                })
              }
              options={disciplinas.map((d) => ({
                value: d.id,
                label: (
                  <Tooltip title={`${d.codigo} - ${d.nome}`}>
                    <span
                      style={{
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        maxWidth: 220,
                      }}
                    >
                      {d.codigo} - {d.nome}
                    </span>
                  </Tooltip>
                ),
              }))}
            />

            {item?.disciplina_id && (
              <Select
                allowClear
                showSearch
                size="small"
                placeholder="Professor"
                value={item?.professor_id}
                dropdownMatchSelectWidth={false}
                style={{ width: "100%", fontSize: "11px" }}
                onChange={(val) =>
                  setGrade((prev) =>
                    prev.map((g) =>
                      g.horario_id === record.id && g.dia_semana_id === dia.id
                        ? { ...g, professor_id: val }
                        : g,
                    ),
                  )
                }
                options={professores.map((p) => ({
                  value: p.id,
                  label: p.nome,
                }))}
              />
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: THEME.primary } }}>
      <div
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* FILTROS COMPACTOS */}

        {/* FILTROS MODERNOS AZUL INSTITUCIONAL */}
        <div
          style={{
            padding: "12px 16px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: "14px",
            flexWrap: "wrap",

            background: "linear-gradient(180deg, #f5faff 0%, #ffffff 100%)",
            borderBottom: "1px solid rgba(11, 61, 92, 0.12)",
          }}
        >
          {/* LADO ESQUERDO */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {/* DEPARTAMENTO */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Departamento</span>
              <Select
                size="middle"
                style={selectStyle}
                placeholder="Selecione o departamento"
                value={deptoId}
                onChange={handleDeptoChange}
                allowClear
                options={departamentos.map((d) => ({
                  value: d.id,
                  label: d.nome,
                }))}
              />
            </div>

            {/* CURSO */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Curso</span>
              <Select
                size="middle"
                style={selectStyle}
                placeholder="Selecione o curso"
                value={cursoId}
                onChange={setCursoId}
                allowClear
                options={cursos.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
              />
            </div>

            {/* ANO */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Ano letivo</span>
              <Select
                size="middle"
                style={{ ...selectStyle, width: 120 }}
                placeholder="Ano"
                value={anoId}
                onChange={setAnoId}
                allowClear
                options={anos.map((a) => ({
                  value: a.id,
                  label: a.ano,
                }))}
              />
            </div>

            {/* SEMESTRE */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Semestre</span>
              <Select
                size="middle"
                style={{ ...selectStyle, width: 120 }}
                placeholder="Semestre"
                value={semestreId}
                onChange={setSemestreId}
                allowClear
                options={semestres.map((s) => ({
                  value: s.id,
                  label: s.nome,
                }))}
              />
            </div>

            {/* CURRÍCULO */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Matriz curricular</span>
              <Select
                size="middle"
                style={{ ...selectStyle, width: 180 }}
                placeholder="Currículo"
                value={curriculoId}
                onChange={setCurriculoId}
                allowClear
                options={curriculos.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
              />
            </div>

            {/* COORDENADOR */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={labelStyle}>Coordenador</span>
              <Select
                size="middle"
                style={{ ...selectStyle, width: 200 }}
                placeholder="Responsável"
                value={coordenadorId}
                onChange={setCoordenadorId}
                allowClear
                showSearch
                options={coordenadores.map((c) => ({
                  value: c.id,
                  label: c.nome,
                }))}
              />
            </div>
          </div>

          {/* BOTÕES */}
          <div style={{ display: "flex", gap: "6px" }}>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={saving}
              style={{ background: "#0b3d5c" }}
            >
              Salvar
            </Button>

            <Button icon={<FilePdfOutlined />} onClick={handlePDF}>
              PDF
            </Button>

            <Button
              icon={<ReloadOutlined />}
              onClick={() => window.location.reload()}
            />
          </div>
        </div>
        <Table
          rowKey="id"
          dataSource={horarios}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          scroll={{ x: "max-content", y: "calc(100vh - 100px)" }}
          sticky
        />
      </div>
    </ConfigProvider>
  );
}
