import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  Row,
  Col,
  Tabs,
  Input,
  message,
  Space,
  Typography,
  Badge,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

const { Text } = Typography;

export default function Relatorios() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [dadosProfessor, setDadosProfessor] = useState([]);
  const [dadosMulti, setDadosMulti] = useState([]);

  const [filtros, setFiltros] = useState({});
  const [tab, setTab] = useState("professor");
  const [search, setSearch] = useState("");

  /* ================= LOAD ================= */
  useEffect(() => {
    (async () => {
      const [d, c, p] = await Promise.all([
        api.get("/departamentos"),
        api.get("/cursos"),
        api.get("/pessoas"),
      ]);

      setDepartamentos(d.data || []);
      setCursos(c.data || []);
      setProfessores(p.data || []);
    })();
  }, []);

  /* ================= RELATÓRIOS ================= */
  useEffect(() => {
    (async () => {
      const [prof, multi] = await Promise.all([
        api.get("/relatorios/professor", { params: filtros }),
        api.get("/relatorios/multicurso", { params: filtros }),
      ]);

      setDadosProfessor(prof.data || []);
      setDadosMulti(multi.data || []);
    })();
  }, [filtros]);

  /* ================= FILTROS ================= */
  const cursosFiltrados = filtros.departamento_id
    ? cursos.filter((c) => c.departamento_id === filtros.departamento_id)
    : cursos;

  const professoresFiltrados = professores;

  const filtrar = (lista) =>
    lista.filter((d) =>
      d.nome?.toLowerCase().includes(search.toLowerCase())
    );

  /* ================= STYLE ================= */
  const tagStyle = {
    fontSize: 11,
    margin: 0,
    padding: "0 6px",
    height: 20,
    lineHeight: "18px",
    borderRadius: 4,
  };

  const box = {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  };

  /* ================= COLUNAS ================= */
  const colProfessor = [
    {
      title: "Disciplina",
      width: 200,
      render: (_, r) => (
        <div style={box}>
          <b style={{ fontSize: 13 }}>{r.nome}</b>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.codigo}
          </Text>
        </div>
      ),
    },

    /* ================= CURSOS (FORÇADO VISÍVEL) ================= */
    {
      title: "Cursos",
      render: (_, r) => (
        <div style={{ ...box, flexWrap: "wrap" }}>
          {r.cursos?.length ? (
            r.cursos.map((c) => (
              <Tag key={c.id} color="blue" style={tagStyle}>
                {c.nome}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Sem cursos</Text>
          )}
        </div>
      ),
    },

    {
      title: "Professores",
      render: (_, r) => (
        <div style={{ ...box, flexWrap: "wrap" }}>
          {r.professores?.length ? (
            r.professores.map((p) => (
              <Tag key={p.id} color="green" style={tagStyle}>
                {p.nome}
              </Tag>
            ))
          ) : (
            <Text type="secondary">Sem professor</Text>
          )}
        </div>
      ),
    },

    /* ================= TOTAL (REDESENHADO) ================= */
    {
      title: "Total Cursos",
      width: 140,
      align: "center",
      render: (_, r) => (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Badge
            count={r.totalCursos}
            style={{
              backgroundColor: "#0b3d5c",
              fontSize: 11,
            }}
          />
          <Text style={{ fontSize: 11, color: "#666" }}>
            {r.totalCursos === 1
              ? "curso vinculado"
              : "cursos vinculados"}
          </Text>
        </div>
      ),
    },
  ];

  const colMulti = [
    {
      title: "Disciplina",
      width: 200,
      render: (_, r) => (
        <div style={box}>
          <b>{r.nome}</b>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {r.codigo}
          </Text>
        </div>
      ),
    },

    {
      title: "Cursos",
      render: (_, r) => (
        <div style={{ ...box, flexWrap: "wrap" }}>
          {r.cursos?.map((c) => (
            <Tag key={c.id} color="purple" style={tagStyle}>
              {c.nome}
            </Tag>
          ))}
        </div>
      ),
    },

    {
      title: "Status",
      width: 100,
      align: "center",
      render: (_, r) => (
        <Tag color={r.totalCursos > 2 ? "orange" : "green"}>
          {r.totalCursos > 2 ? "Multi" : "OK"}
        </Tag>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* HEADER */}
      <Row justify="space-between" style={{ marginBottom: 8 }}>
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          style={{ width: 240 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Space>
          <Button icon={<DownloadOutlined />}>Excel</Button>
          <Button icon={<DownloadOutlined />}>PDF</Button>
        </Space>
      </Row>

      {/* FILTROS */}
      <Row gutter={8} style={{ marginBottom: 10 }}>
        <Col span={8}>
          <Select
            allowClear
            placeholder="Departamento"
            style={{ width: "100%" }}
            onChange={(v) =>
              setFiltros((f) => ({
                ...f,
                departamento_id: v,
                curso_id: undefined,
              }))
            }
            options={departamentos.map((d) => ({
              value: d.id,
              label: d.nome,
            }))}
          />
        </Col>

        <Col span={8}>
          <Select
            allowClear
            placeholder="Curso"
            style={{ width: "100%" }}
            onChange={(v) =>
              setFiltros((f) => ({
                ...f,
                curso_id: v,
              }))
            }
            options={cursosFiltrados.map((c) => ({
              value: c.id,
              label: c.nome,
            }))}
          />
        </Col>

        <Col span={8}>
          <Select
            allowClear
            placeholder="Professor"
            style={{ width: "100%" }}
            onChange={(v) =>
              setFiltros((f) => ({
                ...f,
                professor_id: v,
              }))
            }
            options={professoresFiltrados.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
          />
        </Col>
      </Row>

      {/* TABELAS */}
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: "professor",
            label: "Estrutura Acadêmica",
            children: (
              <Table
                rowKey="id"
                size="small"
                bordered
                columns={colProfessor}
                dataSource={filtrar(dadosProfessor)}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: "multi",
            label: "Multicurso",
            children: (
              <Table
                rowKey="id"
                size="small"
                bordered
                columns={colMulti}
                dataSource={filtrar(dadosMulti)}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />
    </AppLayout>
  );
}