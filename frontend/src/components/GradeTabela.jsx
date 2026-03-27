import { useEffect, useState, useRef } from "react";
import {
  Select,
  Table,
  Typography,
  Row,
  Col,
  Button,
  Dropdown,
  Popconfirm,
  message,
  Layout,
} from "antd";

import {
  SaveOutlined,
  FilePdfOutlined,
  ClearOutlined,
} from "@ant-design/icons";

import { api, getUsuarioLogado } from "../services/api";
import AppLayout from "../components/AppLayout";

const { Text } = Typography;
const { Header, Content, Footer } = Layout;

const headerStyle = {
  backgroundColor: "#093e5e",
  color: "#ffffff",
  fontWeight: 600,
  padding: "6px 16px",
  fontSize: 14,
  textAlign: "center",
  borderRight: "1px solid #0a4d7a",
};

export default function GradeTabela() {
  const usuario = getUsuarioLogado();
  const podeEditar =
    usuario?.role === "edicao" || usuario?.role === "administrador";

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

  const saveTimeout = useRef(null);

  const anos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    anos.push({ value: `${ano}/1`, label: `${ano}/1` });
    anos.push({ value: `${ano}/2`, label: `${ano}/2` });
  }

  const curriculos = [];
  for (let ano = 2020; ano <= 2040; ano++) {
    curriculos.push({ value: `${ano}`, label: `${ano}` });
  }

  /* LOAD FIXOS */
  useEffect(() => {
    api.get("/cursos").then((r) => setCursos(r.data));
    api.get("/pessoas/coordenadores").then((r) => setCoordenadores(r.data));
    api.get("/semestres").then((r) => setSemestres(r.data));
    api.get("/horarios").then((r) => setHorarios(r.data));
    api.get("/dias-semana").then((r) => setDias(r.data));
  }, []);

  /* DISCIPLINAS */
  useEffect(() => {
    if (!contexto.curso_id) return;

    api.get(`/cursos/${contexto.curso_id}/disciplinas`).then((r) => {
      const lista = Array.isArray(r.data)
        ? r.data
        : r.data?.Disciplinas || [];

      setDisciplinas(
        lista.map((d) => ({
          id: d.id,
          codigo: d.codigo || "",
          nome: d.nome || "",
        }))
      );
    });
  }, [contexto.curso_id]);

  /* LOAD GRADE */
  useEffect(() => {
    const { curso_id, semestre_id, ano, curriculo } = contexto;
    if (!curso_id || !semestre_id || !ano || !curriculo) return;

    async function carregarGrade() {
      try {
        const anoRes = await api.post("/anos/get-or-create", { descricao: ano });
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
      } catch { /* empty */ }
    }

    carregarGrade();
  }, [contexto]);

  /* SLOT */
  const updateSlot = (payload) => {
    if (!podeEditar) return;

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

  /* SALVAR */
  const salvarGrade = async (mostrarMensagem = true) => {
    if (!podeEditar) return;

    const { curso_id, semestre_id, ano, curriculo } = contexto;

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

      if (mostrarMensagem) {
        message.success("Grade salva com sucesso");
      }
    } catch {
      if (mostrarMensagem) {
        message.error("Erro ao salvar");
      }
    }
  };

  /* AUTO SAVE SILENCIOSO */
  useEffect(() => {
    if (!podeEditar) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      salvarGrade(false);
    }, 1500);
    return () => clearTimeout(saveTimeout.current);
  }, [gradeDraft, contexto]);

  /* RESTAURAR */
  const limparTudo = () => {
    setGradeDraft([]);
    setContexto({
      curso_id: null,
      coordenador_id: null,
      semestre_id: null,
      ano: null,
      curriculo: null,
    });
    message.info("Grade restaurada");
  };

  /* PDF */
  const gerarPDF = async (todos) => {
    const { curso_id, semestre_id, ano, curriculo } = contexto;
    if (!curso_id || !ano || !curriculo) {
      message.warning("Selecione curso, ano e currículo");
      return;
    }

    const anoRes = await api.post("/anos/get-or-create", { descricao: ano });
    const currRes = await api.post("/curriculos/get-or-create", { descricao: curriculo });

    const params = new URLSearchParams({
      curso_id,
      ano_id: anoRes.data.id,
      curriculo_id: currRes.data.id,
    });

    if (!todos) {
      if (!semestre_id) {
        message.warning("Selecione o semestre");
        return;
      }
      params.append("semestre_id", semestre_id);
    } else {
      params.append("todos", "true");
    }

    window.open(
      `${import.meta.env.VITE_API_URL}/relatorios/grade-horaria/pdf?${params}`,
      "_blank"
    );
  };

  /* COLUNAS */
  const columns = [
    {
      title: "Horário",
      dataIndex: "horario",
      fixed: "left",
      width: 120,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
    },
    ...dias.map((d) => ({
      title: d.descricao,
      width: 220,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const cell = gradeDraft.find(
          (g) =>
            g.horario_id === record.horario_id &&
            g.dia_semana_id === d.id
        );

        return (
          <Select
            size="small"
            allowClear
            disabled={!podeEditar}
            style={{
              width: "100%",
              color: !podeEditar ? "#000" : undefined,
              backgroundColor: !podeEditar ? "#f5f7fa" : "#ffffff",
              border: "1px solid #d9d9d9",
              borderRadius: 4,
            }}
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

  return (
    <AppLayout>
      <Layout style={{ backgroundColor: "white" }}>
        <Header style={{ backgroundColor: "#093e5e", marginBottom: 10 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 16,
              height: "100%",
            }}
          >
            {podeEditar && (
              <Button
                icon={<SaveOutlined />}
                type="primary"
                size="small"
                onClick={() => salvarGrade(true)}
              >
                Salvar
              </Button>
            )}

            <Dropdown
              menu={{
                items: [
                  { key: "1", label: "PDF do semestre", onClick: () => gerarPDF(false) },
                  { key: "2", label: "PDF todos", onClick: () => gerarPDF(true) },
                ],
              }}
            >
              <Button icon={<FilePdfOutlined />} size="small">PDF</Button>
            </Dropdown>

            {podeEditar && (
              <Popconfirm title="Restaurar grade?" onConfirm={limparTudo}>
                <Button
                  style={{
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "1px solid #d9d9d9",
                  }}
                  icon={<ClearOutlined />}
                  size="small"
                >
                  Restaurar
                </Button>
              </Popconfirm>
            )}
          </div>
        </Header>

        <Content>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col span={6}>
              <Text strong>Curso</Text>
              <Select
                style={{ width: "100%" }}
                value={contexto.curso_id}
                options={cursos.map((c) => ({ label: c.nome, value: c.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, curso_id: v }))}
                allowClear
              />
            </Col>

            <Col span={6}>
              <Text strong>Coordenador</Text>
              <Select
                style={{ width: "100%" }}
                value={contexto.coordenador_id}
                options={coordenadores.map((c) => ({ label: c.nome, value: c.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, coordenador_id: v }))}
                allowClear
              />
            </Col>

            <Col span={4}>
              <Text strong>Ano</Text>
              <Select
                style={{ width: "100%" }}
                value={contexto.ano}
                options={anos}
                onChange={(v) => setContexto((c) => ({ ...c, ano: v }))}
                allowClear
              />
            </Col>

            <Col span={4}>
              <Text strong>Semestre</Text>
              <Select
                style={{ width: "100%" }}
                value={contexto.semestre_id}
                options={semestres.map((s) => ({ label: s.descricao, value: s.id }))}
                onChange={(v) => setContexto((c) => ({ ...c, semestre_id: v }))}
                allowClear
              />
            </Col>

            <Col span={4}>
              <Text strong>Currículo</Text>
              <Select
                style={{ width: "100%" }}
                value={contexto.curriculo}
                options={curriculos}
                onChange={(v) => setContexto((c) => ({ ...c, curriculo: v }))}
                allowClear
              />
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            bordered={false} // removido borda interna pesada
            scroll={{ x: "max-content" }}
            rowClassName={() => "grade-row"}
            style={{
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            }}
          />
        </Content>

        <Footer style={{ textAlign: "center" }} />
      </Layout>
    </AppLayout>
  );
}