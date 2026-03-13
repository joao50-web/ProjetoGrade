import { useEffect, useState } from "react";
import {
  Select,
  Table,
  Typography,
  Row,
  Col,
  Button,
  message,
  Dropdown,
  Popconfirm,
  Card,
  Space
} from "antd";

import {
  HomeOutlined,
  SaveOutlined,
  FilePdfOutlined,
  ClearOutlined
} from "@ant-design/icons";

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

  const [gradeDraft, setGradeDraft] = useState([]);

  const [contexto, setContexto] = useState({
    curso_id: null,
    coordenador_id: null,
    semestre_id: null,
    ano: null,
    curriculo: null,
  });

  /* ================= GERAR ANOS ================= */

  const anos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    anos.push({ value: `${ano}/1`, label: `${ano}/1` });
    anos.push({ value: `${ano}/2`, label: `${ano}/2` });
  }

  const curriculos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    curriculos.push({ value: `${ano}`, label: `${ano}` });
  }

  /* ================= LOAD GRADE ================= */

  useEffect(() => {

    const { curso_id, semestre_id, ano, curriculo } = contexto;

    if (!curso_id || !semestre_id || !ano || !curriculo) return;

    async function carregarGrade() {

      try {

        const anoRes = await api.post("/anos/get-or-create", {
          descricao: ano,
        });

        const curriculoRes = await api.post("/curriculos/get-or-create", {
          descricao: curriculo,
        });

        const res = await api.get("/grade-horaria", {
          params: {
            curso_id,
            semestre_id,
            ano_id: anoRes.data.id,
            curriculo_id: curriculoRes.data.id,
          },
        });

        setGradeDraft(res.data || []);

      } catch {

        message.error("Erro ao carregar grade");

      }

    }

    carregarGrade();

  }, [contexto]);

  /* ================= LOAD FIXOS ================= */

  useEffect(() => {

    api.get("/cursos").then((r) => setCursos(r.data));
    api.get("/pessoas/coordenadores").then((r) => setCoordenadores(r.data));
    api.get("/semestres").then((r) => setSemestres(r.data));
    api.get("/horarios").then((r) => setHorarios(r.data));
    api.get("/dias-semana").then((r) => setDias(r.data));

  }, []);

  /* ================= LOAD DISCIPLINAS ================= */

  useEffect(() => {

    if (!contexto.curso_id) return;

    api.get(`/cursos/${contexto.curso_id}/disciplinas`)
      .then((r) => {

        const lista = Array.isArray(r.data)
          ? r.data
          : r.data?.Disciplinas || [];

        const disciplinasCorrigidas = lista.map((d) => ({
          id: d.id,
          codigo: d.codigo || "",
          nome: d.nome || "",
        }));

        setDisciplinas(disciplinasCorrigidas);

      });

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

    setContexto({
      curso_id: null,
      coordenador_id: null,
      semestre_id: null,
      ano: null,
      curriculo: null,
    });

    message.info("Grade e filtros limpos");

  };

  /* ================= COLUNAS ================= */

  const columns = [

    {
      title: "Horário",
      dataIndex: "horario",
      fixed: "left",
      width: 90,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (text) => <strong>{text}</strong>,
    },

    ...dias.map((d) => ({

      title: d.descricao,
      width: 170,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),

      render: (_, record) => {

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
            onChange={(disciplina_id) => {

              updateSlot({
                horario_id: record.horario_id,
                dia_semana_id: d.id,
                disciplina_id: disciplina_id || null,
              });

            }}
            options={disciplinas.map((disc) => ({
              value: disc.id,
              label: `${disc.codigo} - ${disc.nome}`,
            }))}
            placeholder="Selecionar"
          />

        );

      }

    }))

  ];

  const dataSource = horarios.map((h) => ({
    key: h.id,
    horario: h.descricao,
    horario_id: h.id,
  }));

  /* ================= SALVAR ================= */

  const salvarGrade = async () => {

    const { curso_id, semestre_id, ano, curriculo } = contexto;

    if (!curso_id || !semestre_id || !ano || !curriculo) {
      message.warning("Preencha curso, semestre, ano e currículo");
      return;
    }

    try {

      const anoRes = await api.post("/anos/get-or-create", {
        descricao: ano,
      });

      const currRes = await api.post("/curriculos/get-or-create", {
        descricao: curriculo,
      });

      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id,
          coordenador_id: contexto.coordenador_id,
          semestre_id,
          ano_id: anoRes.data.id,
          curriculo_id: currRes.data.id,
        },
        slots: gradeDraft,
      });

      message.success("Grade salva com sucesso");

    } catch {

      message.error("Erro ao salvar a grade");

    }

  };

  /* ================= PDF ================= */

  const gerarPDF = async (todos) => {

    const { curso_id, semestre_id, ano, curriculo } = contexto;

    if (!curso_id || !ano || !curriculo) {
      message.warning("Selecione curso, ano e currículo");
      return;
    }

    try {

      const anoRes = await api.post("/anos/get-or-create", {
        descricao: ano,
      });

      const currRes = await api.post("/curriculos/get-or-create", {
        descricao: curriculo,
      });

      const params = new URLSearchParams({
        curso_id,
        ano_id: anoRes.data.id,
        curriculo_id: currRes.data.id,
      });

      if (todos) {
        params.append("todos", "true");
      } else {

        if (!semestre_id) {
          message.warning("Selecione o semestre");
          return;
        }

        params.append("semestre_id", semestre_id);
      }

      window.open(
        `${import.meta.env.VITE_API_URL}/relatorios/grade-horaria/pdf?${params}`,
        "_blank"
      );

    } catch (err) {

      console.error(err);
      message.error("Erro ao gerar PDF");

    }

  };

  return (

    <div style={{ backgroundColor: "#f7f9fc", padding: 20 }}>

      <Title
        level={3}
        style={{
          textAlign: "center",
          color: "#093e5e",
          marginBottom: 16
        }}
      >
        Grade Horária
      </Title>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >

        <Button icon={<HomeOutlined />} onClick={() => navigate("/home")}>
          Início
        </Button>

        <Space>

          <Card size="small">
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              onClick={salvarGrade}
            >
              Salvar
            </Button>
          </Card>

          <Card size="small">
            <Dropdown
              menu={{
                items: [
                  {
                    key: "1",
                    icon: <FilePdfOutlined />,
                    label: "PDF do semestre",
                    onClick: () => gerarPDF(false),
                  },
                  {
                    key: "2",
                    icon: <FilePdfOutlined />,
                    label: "PDF todos os semestres",
                    onClick: () => gerarPDF(true),
                  },
                ],
              }}
            >
              <Button size="small" icon={<FilePdfOutlined />}>
                PDF
              </Button>
            </Dropdown>
          </Card>

          <Card size="small">
            <Popconfirm
              title="Tem certeza que deseja limpar?"
              onConfirm={limparTudo}
            >
              <Button
                size="small"
                danger
                icon={<ClearOutlined />}
              >
                Limpar
              </Button>
            </Popconfirm>
          </Card>

        </Space>

      </div>

      {/* FILTROS */}

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>

        <Col md={6}>
          <strong>Curso</strong>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={contexto.curso_id}
            options={cursos.map((c) => ({
              value: c.id,
              label: c.nome,
            }))}
            onChange={(v) =>
              setContexto((c) => ({ ...c, curso_id: v }))
            }
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
          <Select
            size="small"
            style={{ width: "100%" }}
            value={contexto.ano}
            options={anos}
            onChange={(v) =>
              setContexto((c) => ({ ...c, ano: v }))
            }
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
            onChange={(v) =>
              setContexto((c) => ({ ...c, semestre_id: v }))
            }
          />
        </Col>

        <Col md={4}>
          <strong>Currículo</strong>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={contexto.curriculo}
            options={curriculos}
            onChange={(v) =>
              setContexto((c) => ({ ...c, curriculo: v }))
            }
          />
        </Col>

      </Row>

      <Table
        size="small"
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
        scroll={{ x: "max-content" }}
        style={{ background: "#ffffff", borderRadius: 6 }}
        sticky
      />

    </div>
  );
}