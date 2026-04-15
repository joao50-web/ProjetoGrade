import { useEffect, useState } from "react";
import { Card, Select, Table, Tag, Row, Col, Tabs, Button, Space } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

export default function Relatorios() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [filtros, setFiltros] = useState({
    departamento_id: null,
    curso_id: null,
    professor_id: null,
  });

  const [dadosProfessor, setDadosProfessor] = useState([]);
  const [dadosMulti, setDadosMulti] = useState([]);
  const [tab, setTab] = useState("professor");

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

  const exportExcel = () => {
    window.open(`${api.defaults.baseURL}/relatorios/export/excel`);
  };

  const exportPDF = () => {
    window.open(`${api.defaults.baseURL}/relatorios/export/pdf`);
  };

  const colProfessor = [
    {
      title: "Estrutura Acadêmica",
      render: (_, d) => (
        <div>
          <b>{d.nome}</b>

          {d.cursos?.map(c => (
            <div key={c.id} style={{ marginLeft: 15 }}>
              <b>{c.nome}</b>

              {c.disciplinas?.map(disc => (
                <div key={disc.id} style={{ marginLeft: 15 }}>
                  {disc.nome} ({disc.codigo})

                  <div style={{ fontSize: 12, color: "#888" }}>
                    {disc.professores?.map(p => p.nome).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const colMulti = [
    {
      title: "Disciplina",
      render: (_, r) => (
        <div>
          {r.nome} <br />
          <small>{r.codigo}</small>
        </div>
      ),
    },
    {
      title: "Cursos",
      render: (_, r) => r.cursos?.map(c => <div key={c.id}>{c.nome}</div>),
    },
    {
      title: "Total",
      render: (_, r) => <Tag>{r.totalCursos}</Tag>,
    },
  ];

  return (
    <AppLayout>
      <Card style={{ marginBottom: 10 }}>
        <Row gutter={10}>
          <Col span={8}>
            <Select
              allowClear
              placeholder="Departamento"
              onChange={v => setFiltros(f => ({ ...f, departamento_id: v }))}
              options={departamentos.map(d => ({ value: d.id, label: d.nome }))}
            />
          </Col>

          <Col span={8}>
            <Select
              allowClear
              placeholder="Curso"
              onChange={v => setFiltros(f => ({ ...f, curso_id: v }))}
              options={cursos.map(c => ({ value: c.id, label: c.nome }))}
            />
          </Col>

          <Col span={8}>
            <Select
              allowClear
              placeholder="Professor"
              onChange={v => setFiltros(f => ({ ...f, professor_id: v }))}
              options={professores.map(p => ({ value: p.id, label: p.nome }))}
            />
          </Col>
        </Row>

        <Space style={{ marginTop: 10 }}>
          <Button icon={<DownloadOutlined />} onClick={exportExcel}>
            Excel
          </Button>

          <Button icon={<DownloadOutlined />} onClick={exportPDF}>
            PDF
          </Button>
        </Space>
      </Card>

      <Card>
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
                  columns={colProfessor}
                  dataSource={dadosProfessor}
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
                  columns={colMulti}
                  dataSource={dadosMulti}
                />
              ),
            },
          ]}
        />
      </Card>
    </AppLayout>
  );
}