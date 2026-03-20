import { useEffect, useState, useRef } from "react";
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
  Space,
  Layout,
} from "antd";

import {
  HomeOutlined,
  SaveOutlined,
  FilePdfOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import AppLayout from "../components/AppLayout";

const { Title, Text } = Typography;
const { Header, Content, Footer } = Layout;

const headerStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 600,
  padding: "6px 16px",
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

  const saveTimeout = useRef(null); // ⬅️ para debounce do salvamento automático

  // Arrays de anos e currículos para os selects
  const anos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    anos.push({ value: `${ano}/1`, label: `${ano}/1` });
    anos.push({ value: `${ano}/2`, label: `${ano}/2` });
  }

  const curriculos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    curriculos.push({ value: `${ano}`, label: `${ano}` });
  }

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

    api
      .get(`/cursos/${contexto.curso_id}/disciplinas`)
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

  /* ================= SALVAMENTO AUTOMÁTICO ================= */
  const salvarGradeAutomatica = async () => {
    const { curso_id, semestre_id, ano, curriculo } = contexto;

    if (!curso_id || !semestre_id || !ano || !curriculo) return;

    try {
      const anoRes = await api.post("/anos/get-or-create", { descricao: ano });
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

      console.log("Grade salva automaticamente");
    } catch (err) {
      console.error("Erro ao salvar grade automática", err);
    }
  };

  // useEffect para debouncing
  useEffect(() => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(() => {
      salvarGradeAutomatica();
    }, 1500); // salva 1,5s após última alteração

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [gradeDraft, contexto]);

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
            g.horario_id === record.horario_id && g.dia_semana_id === d.id
        );

        return (
          <Select
            size="small"
            allowClear
            style={{ width: "100%" }}
            value={cell?.disciplina_id}
            onChange={(disciplina_id) =>
              updateSlot({
                horario_id: record.horario_id,
                dia_semana_id: d.id,
                disciplina_id: disciplina_id || null,
              })
            }
            options={disciplinas.map((disc) => ({
              value: disc.id,
              label: `${disc.codigo} - ${disc.nome}`,
            }))}
            placeholder="Selecionar"
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

  /* ================= SALVAR MANUAL ================= */
  const salvarGrade = async () => {
    await salvarGradeAutomatica();
    message.success("Grade salva manualmente");
  };

  /* ================= PDF ================= */
  const gerarPDF = async (todos) => {
    const { curso_id, semestre_id, ano, curriculo } = contexto;

    if (!curso_id || !ano || !curriculo) {
      message.warning("Selecione curso, ano e currículo");
      return;
    }

    try {
      const anoRes = await api.post("/anos/get-or-create", { descricao: ano });
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
    <AppLayout>
      <Layout style={{ minHeight: "100vh", backgroundColor: "#f7f9fc", padding: "24px 32px" }}>
        <Header
          style={{
            backgroundColor: "#093e5e",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <Title level={3} style={{ color: "#fff", margin: 10 }}></Title>

          <Space size="middle">
            <Button icon={<HomeOutlined />} type="default" onClick={() => navigate("/home")}>
              Início
            </Button>

            <Button icon={<SaveOutlined />} type="primary" style={{ borderRadius: 6 }} onClick={salvarGrade}>
              Salvar
            </Button>

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
              <Button icon={<FilePdfOutlined />}>PDF</Button>
            </Dropdown>

            <Popconfirm title="Tem certeza que deseja limpar?" onConfirm={limparTudo}>
              <Button danger icon={<ClearOutlined />}>
                Limpar
              </Button>
            </Popconfirm>
          </Space>
        </Header>

        <Content
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 6,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* FILTROS */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Text strong>Curso</Text>
              <Select
                size="middle"
                placeholder="Selecione o curso"
                style={{ width: "100%" }}
                value={contexto.curso_id}
                options={cursos.map((c) => ({ label: c.nome, value: c.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, curso_id: v }))}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={6}>
              <Text strong>Coordenador</Text>
              <Select
                size="middle"
                placeholder="Selecione o coordenador"
                style={{ width: "100%" }}
                value={contexto.coordenador_id}
                options={coordenadores.map((c) => ({ label: c.nome, value: c.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, coordenador_id: v }))}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Text strong>Ano</Text>
              <Select
                size="middle"
                placeholder="Selecione o ano"
                style={{ width: "100%" }}
                value={contexto.ano}
                options={anos}
                onChange={(v) => setContexto((c) => ({ ...c, ano: v }))}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Text strong>Semestre</Text>
              <Select
                size="middle"
                placeholder="Selecione o semestre"
                style={{ width: "100%" }}
                value={contexto.semestre_id}
                options={semestres.map((s) => ({ label: s.descricao, value: s.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, semestre_id: v }))}
                allowClear
              />
            </Col>

            <Col xs={24} sm={12} md={4}>
              <Text strong>Currículo</Text>
              <Select
                size="middle"
                placeholder="Selecione o currículo"
                style={{ width: "100%" }}
                value={contexto.curriculo}
                options={curriculos}
                onChange={(v) => setContexto((c) => ({ ...c, curriculo: v }))}
                allowClear
              />
            </Col>
          </Row>

          {/* TABELA */}
          <Table
            size="middle"
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            bordered
            scroll={{ x: "max-content" }}
            style={{ borderRadius: 6 }}
            sticky
          />
        </Content>

        <Footer
          style={{
            textAlign: "center",
            padding: 12,
            color: "#999",
            marginTop: 24,
            backgroundColor: "#fafafa",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          © {new Date().getFullYear()} Seu Sistema - Todos os direitos reservados.
        </Footer>
      </Layout>
    </AppLayout>
  );
}