import { useEffect, useState } from "react";
import { Table, Select, Button, Row, Col, Tabs, Tag, Input } from "antd";
import { DownloadOutlined, SearchOutlined } from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

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

      setDepartamentos(d.data);
      setCursos(c.data);
      setProfessores(p.data);
    })();
  }, []);

  /* ================= RELATÓRIOS ================= */
  useEffect(() => {
    (async () => {
      const [prof, multi] = await Promise.all([
        api.get("/relatorios/professor", { params: filtros }),
        api.get("/relatorios/multicurso", { params: filtros }),
      ]);

      setDadosProfessor(prof.data);
      setDadosMulti(multi.data);
    })();
  }, [filtros]);

  /* ================= FILTRO CASCATA ================= */
  const cursosFiltrados = filtros.departamento_id
    ? cursos.filter((c) => c.departamento_id === filtros.departamento_id)
    : cursos;

  const professoresFiltrados = filtros.curso_id
    ? professores.filter((p) =>
        p.cursos?.some((c) => c.id === filtros.curso_id)
      )
    : professores;

  /* ================= SEARCH ================= */
  const filteredProfessor = dadosProfessor.filter((d) =>
    d.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMulti = dadosMulti.filter((d) =>
    d.nome?.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= COLUNAS ================= */
  const colProfessor = [
    {
      title: "Disciplina",
      render: (_, r) => (
        <div>
          <b>{r.nome}</b>
          <div style={{ fontSize: 12 }}>{r.codigo}</div>
        </div>
      ),
    },
    {
      title: "Cursos",
      render: (_, r) => (
        <>
          {r.cursos?.map((c) => (
            <Tag key={c.id}>{c.nome}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "Professores",
      render: (_, r) => (
        <>
          {r.professores?.map((p) => (
            <Tag key={p.id} color="green">
              {p.nome}
            </Tag>
          ))}
        </>
      ),
    },
  ];

  const colMulti = [
    {
      title: "Disciplina",
      render: (_, r) => (
        <div>
          <b>{r.nome}</b>
          <div style={{ fontSize: 12 }}>{r.codigo}</div>
        </div>
      ),
    },
    {
      title: "Cursos",
      render: (_, r) => (
        <>
          {r.cursos?.map((c) => (
            <Tag key={c.id}>{c.nome}</Tag>
          ))}
        </>
      ),
    },
    {
      title: "Total",
      render: (_, r) => <Tag color="purple">{r.totalCursos}</Tag>,
    },
  ];

  return (
    <AppLayout>
      {/* ================= HEADER ================= */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Input
          placeholder="Buscar..."
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <Button icon={<DownloadOutlined />}>Excel</Button>
          <Button icon={<DownloadOutlined />}>PDF</Button>
        </div>
      </div>

      {/* ================= FILTROS ================= */}
      <Row gutter={10} style={{ marginTop: 16 }}>
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
                professor_id: undefined,
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
              setFiltros((f) => ({ ...f, professor_id: v }))
            }
            options={professoresFiltrados.map((p) => ({
              value: p.id,
              label: p.nome,
            }))}
          />
        </Col>
      </Row>

      {/* ================= TABS ================= */}
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
                dataSource={filteredProfessor}
                columns={colProfessor}
                pagination={{ pageSize: 6 }}
              />
            ),
          },
          {
            key: "multi",
            label: "Multicurso",
            children: (
              <Table
                rowKey="id"
                dataSource={filteredMulti}
                columns={colMulti}
                pagination={{ pageSize: 6 }}
              />
            ),
          },
        ]}
      />
    </AppLayout>
  );
}