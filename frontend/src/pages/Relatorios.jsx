import { useEffect, useState } from "react";
import {
  Card,
  Select,
  Table,
  Tag,
  Row,
  Col,
  Typography,
  Tabs
} from "antd";

import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

const { Title } = Typography;

export default function Relatorios() {
  const [departamentos, setDepartamentos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);

  const [filtros, setFiltros] = useState({
    departamento_id: null,
    curso_id: null,
    professor_id: null
  });

  const [dadosProfessor, setDadosProfessor] = useState([]);
  const [dadosMulti, setDadosMulti] = useState([]);

  const [tab, setTab] = useState("professor");

  /* ================= LOAD ================= */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadFiltros();
  }, []);

  const loadFiltros = async () => {
    try {
      const [d, c, p] = await Promise.all([
        api.get("/departamentos"),
        api.get("/cursos"),
        api.get("/pessoas")
      ]);

      setDepartamentos(d.data);
      setCursos(c.data);
      setProfessores(p.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= BUSCA ================= */

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    buscar();
  }, [filtros]);

  const buscar = async () => {
    try {
      const [prof, multi] = await Promise.all([
        api.get("/relatorios/professor", { params: filtros }),
        api.get("/relatorios/multicurso", { params: filtros })
      ]);

      setDadosProfessor(prof.data);
      setDadosMulti(multi.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= COLUNAS ================= */

  const colProfessor = [
    {
      title: "Disciplina",
      dataIndex: "nome",
      render: (_, r) => (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {r.nome}
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {r.codigo}
          </div>
        </div>
      )
    },
    {
      title: "Cursos",
      render: (_, r) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {(r.cursos || []).map(c => (
            <Tag key={c.id} style={{ margin: 0, fontSize: 11 }}>
              {c.nome}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: "Professores",
      render: (_, r) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {(r.professores || []).map(p => (
            <Tag key={p.id || p} color="blue" style={{ margin: 0, fontSize: 11 }}>
              {p.nome || p}
            </Tag>
          ))}
        </div>
      )
    }
  ];

  const colMulti = [
    {
      title: "Disciplina",
      dataIndex: "nome",
      render: (_, r) => (
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {r.nome}
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {r.codigo}
          </div>
        </div>
      )
    },
    {
      title: "Cursos",
      render: (_, r) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
          {(r.cursos || []).map(c => (
            <Tag key={c.id} style={{ margin: 0, fontSize: 11 }}>
              {c.nome}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: "Qtd",
      width: 60,
      align: "center",
      render: (_, r) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {r.totalCursos}
        </Tag>
      )
    }
  ];

  /* ================= UI ================= */

  return (
    <AppLayout>
      <div style={{ width: "100%" }}>

        {/* FILTROS (GLOBAL) */}
        <Card
          style={{ marginBottom: 10, borderRadius: 10 }}
          bodyStyle={{ padding: 10 }}
        >
          <Row gutter={8}>
            <Col span={8}>
              <Select
                placeholder="Departamento"
                allowClear
                style={{ width: "100%" }}
                onChange={v =>
                  setFiltros(f => ({ ...f, departamento_id: v }))
                }
                options={departamentos.map(d => ({
                  value: d.id,
                  label: `${d.nome} (${d.sigla})`
                }))}
              />
            </Col>

            <Col span={8}>
              <Select
                placeholder="Curso"
                allowClear
                style={{ width: "100%" }}
                onChange={v =>
                  setFiltros(f => ({ ...f, curso_id: v }))
                }
                options={cursos.map(c => ({
                  value: c.id,
                  label: c.nome
                }))}
              />
            </Col>

            <Col span={8}>
              <Select
                placeholder="Professor"
                allowClear
                style={{ width: "100%" }}
                onChange={v =>
                  setFiltros(f => ({ ...f, professor_id: v }))
                }
                options={professores.map(p => ({
                  value: p.id,
                  label: p.nome
                }))}
              />
            </Col>
          </Row>
        </Card>

        {/* TABS (SEPARAÇÃO DOS RELATÓRIOS) */}
        <Card style={{ borderRadius: 10 }} bodyStyle={{ padding: 10 }}>
          <Tabs
            activeKey={tab}
            onChange={setTab}
            items={[
              {
                key: "professor",
                label: "Relatório por Professor",
                children: (
                  <Table
                    rowKey="id"
                    columns={colProfessor}
                    dataSource={dadosProfessor}
                    size="small"
                    pagination={{ pageSize: 8 }}
                    tableLayout="fixed"
                  />
                )
              },
              {
                key: "multi",
                label: "Disciplinas Multicurso",
                children: (
                  <Table
                    rowKey="id"
                    columns={colMulti}
                    dataSource={dadosMulti}
                    size="small"
                    pagination={{ pageSize: 8 }}
                    tableLayout="fixed"
                  />
                )
              }
            ]}
          />
        </Card>

      </div>
    </AppLayout>
  );
}