import { useEffect, useState } from "react";
import {
  Select,
  Table,
  Typography,
  Row,
  Col,
  Input,
  Button,
  message,
  Dropdown,
  Popconfirm,
} from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const { Title } = Typography;

const headerStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 600,
  padding: "3px 30px",
  fontSize: 14,
  textAlign: "center",
};

export default function GradeTabela() {
  const navigate = useNavigate();

  const [cursos, setCursos] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [dias, setDias] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);

  const [contexto, setContexto] = useState({
    curso_id: null,
    coordenador_id: null,
    semestre_id: null,
  });

  const [anoInput, setAnoInput] = useState("");
  const [curriculoInput, setCurriculoInput] = useState("");
  const [gradeDraft, setGradeDraft] = useState([]);

  /* ================= LOAD GRADE ================= */
  useEffect(() => {
    const { curso_id, semestre_id } = contexto;
    if (!curso_id || !semestre_id || !anoInput || !curriculoInput) return;

    async function carregarGrade() {
      const ano = await api.post("/anos/get-or-create", {
        descricao: anoInput,
      });
      const curriculo = await api.post("/curriculos/get-or-create", {
        descricao: curriculoInput,
      });

      const res = await api.get("/grade-horaria", {
        params: {
          curso_id,
          semestre_id,
          ano_id: ano.data.id,
          curriculo_id: curriculo.data.id,
        },
      });

      setGradeDraft(res.data);
    }

    carregarGrade();
  }, [contexto, anoInput, curriculoInput]);

  /* ================= LOAD FIXOS ================= */
  useEffect(() => {
    api.get("/cursos").then((r) => setCursos(r.data));
    api.get("/pessoas/coordenadores").then((r) => setCoordenadores(r.data));
    api.get("/semestres").then((r) => setSemestres(r.data));
    api.get("/horarios").then((r) => setHorarios(r.data));
    api.get("/dias-semana").then((r) => setDias(r.data));
  }, []);

  useEffect(() => {
    if (!contexto.curso_id) return;
    api
      .get(`/cursos/${contexto.curso_id}/disciplinas-professores`)
      .then((r) => setDisciplinas(r.data));
  }, [contexto.curso_id]);

  /* ================= SLOT ================= */
  const updateSlot = (payload) => {
    setGradeDraft((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex(
        (s) =>
          s.horario_id === payload.horario_id &&
          s.dia_semana_id === payload.dia_semana_id
      );
      if (idx >= 0) copy[idx] = { ...copy[idx], ...payload };
      else copy.push(payload);
      return copy;
    });
  };

  /* ================= LIMPAR ================= */
  const limparTudo = () => {
    setGradeDraft([]);
    setAnoInput("");
    setCurriculoInput("");
    setContexto({
      curso_id: null,
      coordenador_id: null,
      semestre_id: null,
    });
    message.info("Grade e filtros limpos");
  };

  /* ================= COLUNAS ================= */
  const columns = [
    {
      title: "Horário",
      dataIndex: "horario",
      fixed: "left",
      width: 80,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (text) => <strong>{text}</strong>,
    },
    ...dias.map((d) => ({
      title: d.descricao,
      width: 160,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        // Busca o slot correspondente
        const cell = gradeDraft.find(
          (g) =>
            g.horario_id === record.horario_id &&
            g.dia_semana_id === d.id
        );

        const disciplinaId = cell?.disciplina_id ?? undefined;

        return (
          <Select
            size="small"
            allowClear
            style={{ width: "100%" }}
            value={disciplinaId}
            optionLabelProp="label"
            onChange={(disciplina_id) => {
              if (!disciplina_id) {
                return updateSlot({
                  horario_id: record.horario_id,
                  dia_semana_id: d.id,
                  disciplina_id: null,
                  professor_id: null,
                });
              }

              // Busca o professor vinculado à disciplina selecionada
              const vinculo = disciplinas.find(
                (x) => x.disciplina_id === disciplina_id
              );

              updateSlot({
                horario_id: record.horario_id,
                dia_semana_id: d.id,
                disciplina_id,
                professor_id: vinculo?.professor_id ?? null,
              });
            }}
            options={disciplinas.map((opt) => ({
              value: opt.disciplina_id,
              label: (
                <div>
                  <div style={{ fontWeight: 500 }}>{opt.disciplina_nome}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>
                    {opt.professor_nome}
                  </div>
                </div>
              ),
            }))}
          />
        );
      },
    })),
  ];

  const dataSource = horarios.map((h) => ({
    key: h.id,
    horario: h.descricao,
    horario_id: h.id,
  }));

  /* ================= AÇÕES ================= */
  const salvarGrade = async () => {
    try {
      const ano = await api.post("/anos/get-or-create", {
        descricao: anoInput,
      });
      const curr = await api.post("/curriculos/get-or-create", {
        descricao: curriculoInput,
      });

      await api.post("/grade-horaria/save", {
        contexto: {
          ...contexto,
          ano_id: ano.data.id,
          curriculo_id: curr.data.id,
        },
        slots: gradeDraft,
      });

      message.success("Grade salva com sucesso");
    } catch {
      message.error("Erro ao salvar a grade");
    }
  };

  const gerarPDF = async (todos) => {
    const ano = await api.post("/anos/get-or-create", { descricao: anoInput });
    const curr = await api.post("/curriculos/get-or-create", {
      descricao: curriculoInput,
    });

    const params = new URLSearchParams({
      curso_id: contexto.curso_id,
      ano_id: ano.data.id,
      curriculo_id: curr.data.id,
    });

    if (todos) params.append("todos", "true");
    else params.append("semestre_id", contexto.semestre_id);

    window.open(
      `${import.meta.env.VITE_API_URL}/relatorios/grade-horaria/pdf?${params}`,
      "_blank"
    );
  };

  return (
    <div style={{ backgroundColor: "#f7f9fc", padding: 14 }}>
      {/* TÍTULO */}
      <div style={{ textAlign: "center", margin: "1px 0" }}>
        <Title
          level={3}
          style={{ fontWeight: 500, margin: 10, color: "#093e5e" }}
        >
          Grade Horária
        </Title>
      </div>

      {/* BOTÕES SUPERIORES */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 76,
        }}
      >
        <Button
          type="default"
          icon={<HomeOutlined />}
          onClick={() => navigate("/home")}
        >
          Início
        </Button>

        <div style={{ display: "flex", gap: 8 }}>
          <Button size="small" type="primary" onClick={salvarGrade}>
            Salvar
          </Button>

          <Dropdown
            menu={{
              items: [
                {
                  key: "1",
                  label: "PDF do semestre",
                  onClick: () => gerarPDF(false),
                },
                {
                  key: "2",
                  label: "PDF todos os semestres",
                  onClick: () => gerarPDF(true),
                },
              ],
            }}
          >
            <Button size="small">PDF</Button>
          </Dropdown>

          <Popconfirm
            title="Tem certeza que deseja limpar?"
            onConfirm={limparTudo}
          >
            <Button size="small" danger>
              Limpar
            </Button>
          </Popconfirm>
        </div>
      </div>

      {/* FILTROS */}
      <div
        style={{
          position: "relative",
          top: -10,
          zIndex: 10,
          backgroundColor: "#f7f9fc",
          paddingBottom: 5,
        }}
      >
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col md={6}>
            <strong>Curso</strong>
            <Select
              size="small"
              style={{ width: "100%" }}
              value={contexto.curso_id}
              options={cursos.map((c) => ({ value: c.id, label: c.nome }))}
              onChange={(v) => setContexto((c) => ({ ...c, curso_id: v }))}
            />
          </Col>
          <Col md={6}>
            <strong>Coordenador</strong>
            <Select
              size="small"
              style={{ width: "100%" }}
              value={contexto.coordenador_id}
              options={coordenadores.map((c) => ({
                value: c.id,
                label: c.nome,
              }))}
              onChange={(v) =>
                setContexto((c) => ({ ...c, coordenador_id: v }))
              }
            />
          </Col>
          <Col md={4}>
            <strong>Ano</strong>
            <Input
              size="small"
              value={anoInput}
              onChange={(e) => setAnoInput(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <strong>Semestre</strong>
            <Select
              size="small"
              style={{ width: "100%" }}
              value={contexto.semestre_id}
              options={semestres.map((s) => ({
                value: s.id,
                label: s.descricao,
              }))}
              onChange={(v) => setContexto((c) => ({ ...c, semestre_id: v }))}
            />
          </Col>
          <Col md={4}>
            <strong>Currículo</strong>
            <Input
              size="small"
              value={curriculoInput}
              onChange={(e) => setCurriculoInput(e.target.value)}
            />
          </Col>
        </Row>
      </div>

      {/* TABELA */}
      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        scroll={{ x: "max-content" }}
        style={{ background: "#ffffff", borderRadius: 4 }}
        sticky
      />
    </div>
  );
}