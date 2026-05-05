import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  Row,
  Col,
  Tabs,
  Input,
  Space,
  Tag,
} from "antd";

import {
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

/* 🎨 HEADER */
const headerCellStyle = {
  backgroundColor: "#093e5e",
  color: "#fff",
  fontWeight: 600,
  fontSize: 16,
  textAlign: "center",
};

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

  const filtrar = (lista) =>
    lista.filter((d) =>
      d.nome?.toLowerCase().includes(search.toLowerCase())
    );

  /* ================= TAGS ================= */
  const renderTags = (items, color) => {
    if (!items?.length) return <span style={{ color: "#aaa" }}>—</span>;

    return (
      <Space size={[6, 6]} wrap>
        {items.map((item, i) => (
          <Tag key={i} color={color}>
            {item}
          </Tag>
        ))}
      </Space>
    );
  };

  /* ================= COLUNAS ================= */
  const colProfessor = [
    {
      title: "Disciplina",
      width: "40%",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {r.nome}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {r.codigo}
          </div>
        </div>
      ),
    },
    {
      title: "Cursos",
      width: "30%",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div>
          {/* 🔥 contador discreto */}
          <div style={{
            textAlign: "right",
            fontSize: 12,
            color: "#999",
            marginBottom: 4
          }}>
            {r.totalCursos} curso(s)
          </div>

          {renderTags(r.cursos, "blue")}
        </div>
      ),
    },
    {
      title: "Professores",
      width: "30%",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => renderTags(r.professores, "green"),
    },
  ];

  const colMulti = [
    {
      title: "Disciplina",
      width: "40%",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {r.nome}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {r.codigo}
          </div>
        </div>
      ),
    },
    {
      title: "Cursos",
      width: "40%",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div>
          {/* 🔥 contador discreto */}
          <div style={{
            textAlign: "right",
            fontSize: 12,
            color: "#999",
            marginBottom: 4
          }}>
            {r.totalCursos} curso(s)
          </div>

          {renderTags(r.cursos, "purple")}
        </div>
      ),
    },
    {
      title: "Status",
      width: "20%",
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Tag color={r.totalCursos > 2 ? "orange" : "green"}>
          {r.totalCursos > 2 ? "Multicurso" : "OK"}
        </Tag>
      ),
    },
  ];

  return (
    <AppLayout>
      {/* TOPO */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Space>
          <Button icon={<DownloadOutlined />}>Excel</Button>
          <Button icon={<DownloadOutlined />}>PDF</Button>
        </Space>
      </div>

      {/* FILTROS */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
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
            options={professores.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
          />
        </Col>
      </Row>

      {/* TABELA */}
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
                dataSource={filtrar(dadosProfessor)}
                columns={colProfessor}
                pagination={{ pageSize: 6 }}
                bordered
                size="large"
              />
            ),
          },
          {
            key: "multi",
            label: "Multicurso",
            children: (
              <Table
                rowKey="id"
                dataSource={filtrar(dadosMulti)}
                columns={colMulti}
                pagination={{ pageSize: 6 }}
                bordered
                size="large"
              />
            ),
          },
        ]}
      />
    </AppLayout>
  );
}