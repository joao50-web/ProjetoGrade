import { useEffect, useState } from "react";

import {
  Table,
  Select,
  Button,
  Row,
  Col,
  Input,
  Space,
  Tag,
  message,
  ConfigProvider,
} from "antd";

import {
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

import AppLayout from "../components/AppLayout";

import { api } from "../services/api";

/* ======================================================
   ESTILOS INSTITUCIONAIS
====================================================== */

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  borderColor: "#e5e7eb",
  institutionalGray: "#f3f4f6",
  buttonExcel: "#4b5563",
  buttonPDF: "#6b7280",
};

const headerCellStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "13px",
  textAlign: "center",
  padding: "12px 4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const filtroContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const filtroLabelStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: THEME.primary,
  marginBottom: "1px",
  display: "block",
};

/* ======================================================
   COMPONENTE
====================================================== */

export default function Relatorios() {
  const [departamentos, setDepartamentos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [cargasDisponiveis, setCargasDisponiveis] = useState([]);

  const [dadosProfessor, setDadosProfessor] = useState([]);
  const [filtros, setFiltros] = useState({});
  const [search, setSearch] = useState("");

  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);

  /* =========================================
     LOAD INICIAL
  ========================================= */

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [
        departamentosRes,
        cursosRes,
        professoresRes,
        coordenadoresRes,
        anosRes,
        semestresRes,
        relatorioRes,
        disciplinasRes,
      ] = await Promise.all([
        api.get("/departamentos"),
        api.get("/cursos"),
        api.get("/pessoas/professores"),
        api.get("/pessoas/coordenadores"),
        api.get("/anos"),
        api.get("/semestres"),
        api.get("/relatorios/professor"),
        api.get("/disciplinas"),
      ]);

      setDepartamentos(departamentosRes.data || []);
      setTodosCursos(cursosRes.data || []);
      setCursos(cursosRes.data || []);
      setProfessores(professoresRes.data || []);
      setCoordenadores(coordenadoresRes.data || []);
      setAnos(anosRes.data || []);
      setSemestres(semestresRes.data || []);
      setDadosProfessor(relatorioRes.data || []);

      const cargas = disciplinasRes.data
        ? [...new Set(disciplinasRes.data.map(d => d.carga_horaria))].sort((a, b) => a - b)
        : [];
      setCargasDisponiveis(cargas);

    } catch (err) {
      console.error(err);
      message.error("Erro ao carregar os dados");
    }
  };

  /* =========================================
     FILTRAR CURSOS
  ========================================= */

  useEffect(() => {
    if (!filtros.departamento_id) {
      setCursos(todosCursos);
      return;
    }

    const filtrados = todosCursos.filter(
      (c) =>
        c.departamento_id === filtros.departamento_id ||
        c.departamento?.id === filtros.departamento_id
    );

    setCursos(filtrados);
  }, [filtros.departamento_id, todosCursos]);

  /* =========================================
     RELATÓRIO DINÂMICO
  ========================================= */

  useEffect(() => {
    carregarRelatorio();
  }, [filtros]);

  const carregarRelatorio = async () => {
    try {
      const response = await api.get("/relatorios/professor", {
        params: filtros,
      });

      setDadosProfessor(response.data || []);
    } catch (err) {
      console.error(err);
      message.error("Erro ao carregar relatório");
    }
  };

  /* =========================================
     EXPORTAR EXCEL
  ========================================= */

  const exportarExcel = async () => {
    try {
      setLoadingExcel(true);
      const response = await api.get("/relatorios/export/excel", {
        params: filtros,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "relatorio.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      message.error("Erro ao exportar Excel");
    } finally {
      setLoadingExcel(false);
    }
  };

  /* =========================================
     EXPORTAR PDF
  ========================================= */

  const exportarPDF = async () => {
    try {
      setLoadingPDF(true);
      const response = await api.get("/relatorios/export/pdf", {
        params: filtros,
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (err) {
      console.error(err);
      message.error("Erro ao gerar PDF");
    } finally {
      setLoadingPDF(false);
    }
  };

  /* =========================================
     PESQUISA
  ========================================= */

  const dadosFiltrados = dadosProfessor.filter((d) => {
    const nome = d.nome?.toLowerCase() || "";
    const codigo = d.codigo?.toLowerCase() || "";
    return nome.includes(search.toLowerCase()) || codigo.includes(search.toLowerCase());
  });

  /* =========================================
     TAGS
  ========================================= */

  const renderTags = (text, bg, color) => {
    return (
      <Tag
        style={{
          background: bg,
          color,
          border: "none",
          fontSize: 13,
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 14,
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </Tag>
    );
  };

  /* =========================================
     COLUNAS
  ========================================= */

  const columns = [
    {
      title: "Disciplina",
      width: 280,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <div style={{ padding: "4px 8px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
            {r.nome}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {r.codigo}
          </div>
        </div>
      ),
    },
    {
      title: "Curso",
      width: 220,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Space wrap style={{ padding: "4px 8px" }}>
          {(r.cursos || []).map((curso, i) => (
            <Tag
              key={i}
              style={{
                background: "#dbeafe",
                color: "#000000", // Letra preta nos cursos
                border: "none",
                borderRadius: 14,
                padding: "4px 10px",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {curso}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Departamento",
      width: 180,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => renderTags(r.departamento, "#f3f4f6", "#374151"), // Cinza institucional (igual professor)
    },
    {
      title: "Professor",
      width: 220,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (_, r) => (
        <Space wrap style={{ padding: "4px 8px" }}>
          {(r.professores || []).map((prof, i) => (
            <Tag
              key={i}
              style={{
                background: "#f3f4f6",
                color: "#374151",
                border: "none",
                borderRadius: 14,
                padding: "4px 10px",
                fontWeight: 600,
                fontSize: 12,
              }}
            >
              {prof}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Coordenador",
      dataIndex: "coordenador",
      width: 200,
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (v) => <span style={{ fontSize: 14, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: "Carga Horária",
      dataIndex: "carga_horaria",
      width: 150,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (v) => <span style={{ fontWeight: 600, fontSize: 14 }}>{v}h</span>,
    },
    {
      title: "Ano",
      dataIndex: "ano",
      width: 100,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (v) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
    {
      title: "Semestre",
      dataIndex: "semestre",
      width: 140,
      align: "center",
      onHeaderCell: () => ({ style: headerCellStyle }),
      render: (v) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
      }}
    >
      <AppLayout>
        <div style={{ padding: "24px", background: "#f3f4f6", minHeight: "100vh" }}>
          <div
            style={{
              padding: "16px 20px",
              background: "#fff",
              borderRadius: "8px",
              border: `1px solid ${THEME.borderColor}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              marginBottom: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 8 }}>
              <Button
                size="small"
                type="primary"
                icon={<FileExcelOutlined />}
                loading={loadingExcel}
                onClick={exportarExcel}
                style={{ background: THEME.buttonExcel, borderColor: THEME.buttonExcel, fontWeight: 500 }}
              >
                Excel
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<FilePdfOutlined />}
                loading={loadingPDF}
                onClick={exportarPDF}
                style={{ background: THEME.buttonPDF, borderColor: THEME.buttonPDF, fontWeight: 500 }}
              >
                PDF
              </Button>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>PESQUISAR</span>
                <Input
                  size="middle"
                  placeholder="Disciplina ou código..."
                  prefix={<SearchOutlined />}
                  style={{ width: 200 }}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>CURSO</span>
                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Todos"
                  style={{ width: 180 }}
                  onChange={(v) => setFiltros({ ...filtros, curso_id: v })}
                  options={cursos.map((c) => ({ value: c.id, label: c.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>DEPARTAMENTO</span>
                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Todos"
                  style={{ width: 180 }}
                  onChange={(v) => setFiltros({ ...filtros, departamento_id: v })}
                  options={departamentos.map((d) => ({ value: d.id, label: d.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>PROFESSOR</span>
                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Todos"
                  style={{ width: 180 }}
                  onChange={(v) => setFiltros({ ...filtros, professor_id: v })}
                  options={professores.map((p) => ({ value: p.id, label: p.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>COORDENADOR</span>
                <Select
                  size="middle"
                  allowClear
                  showSearch
                  placeholder="Todos"
                  style={{ width: 180 }}
                  onChange={(v) => setFiltros({ ...filtros, coordenador_id: v })}
                  options={coordenadores.map((c) => ({ value: c.id, label: c.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>CARGA HORÁRIA</span>
                <Select
                  size="middle"
                  allowClear
                  placeholder="Todas"
                  style={{ width: 100 }}
                  onChange={(v) => setFiltros({ ...filtros, carga_horaria: v })}
                  options={cargasDisponiveis.map((c) => ({ value: c, label: `${c}h` }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>ANO</span>
                <Select
                  size="middle"
                  allowClear
                  placeholder="Todos"
                  style={{ width: 90 }}
                  onChange={(v) => setFiltros({ ...filtros, ano_id: v })}
                  options={anos.map((a) => ({ value: a.id, label: a.descricao }))}
                />
              </div>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>SEMESTRE</span>
                <Select
                  size="middle"
                  allowClear
                  placeholder="Todos"
                  style={{ width: 140 }}
                  onChange={(v) => setFiltros({ ...filtros, semestre_id: v })}
                  options={semestres.map((s) => ({ value: s.id, label: s.descricao }))}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: "8px",
              border: `1px solid ${THEME.borderColor}`,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}
          >
            <Table
              dataSource={dadosFiltrados}
              columns={columns}
              rowKey="id"
              bordered
              size="middle"
              pagination={{ 
                pageSize: 8, 
                showSizeChanger: false,
                position: ["bottomRight"],
              }}
            />
          </div>
        </div>
      </AppLayout>
    </ConfigProvider>
  );
}