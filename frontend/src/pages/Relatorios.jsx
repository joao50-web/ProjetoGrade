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
} from "antd";

import {
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";

import AppLayout from "../components/AppLayout";

import { api } from "../services/api";

/* ======================================================
   HEADER
====================================================== */

const headerCellStyle = {
  backgroundColor: "#093e5e",
  color: "#fff",
  fontWeight: 700,
  fontSize: 15,
  textAlign: "center",
};

/* ======================================================
   COMPONENTE
====================================================== */

export default function Relatorios() {
  const [departamentos, setDepartamentos] =
    useState([]);

  const [todosCursos, setTodosCursos] =
    useState([]);

  const [cursos, setCursos] =
    useState([]);

  const [disciplinas, setDisciplinas] =
    useState([]);

  const [professores, setProfessores] =
    useState([]);

  const [anos, setAnos] =
    useState([]);

  const [semestres, setSemestres] =
    useState([]);

  const [curriculos, setCurriculos] =
    useState([]);

  const [dadosProfessor, setDadosProfessor] =
    useState([]);

  const [filtros, setFiltros] =
    useState({});

  const [search, setSearch] =
    useState("");

  const [loadingExcel, setLoadingExcel] =
    useState(false);

  const [loadingPDF, setLoadingPDF] =
    useState(false);

  /* ======================================================
     LOAD INICIAL
  ====================================================== */

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const [
        departamentosRes,
        cursosRes,
        professoresRes,
        anosRes,
        semestresRes,
        curriculosRes,
        disciplinasRes,
        relatorioRes,
      ] = await Promise.all([
        api.get("/departamentos"),
        api.get("/cursos"),
        api.get("/pessoas/professores"),
        api.get("/anos"),
        api.get("/semestres"),
        api.get("/curriculos"),
        api.get("/disciplinas"),
        api.get("/relatorios/professor"),
      ]);

      setDepartamentos(
        departamentosRes.data || []
      );

      setTodosCursos(
        cursosRes.data || []
      );

      setCursos(
        cursosRes.data || []
      );

      setProfessores(
        professoresRes.data || []
      );

      setAnos(
        anosRes.data || []
      );

      setSemestres(
        semestresRes.data || []
      );

      setCurriculos(
        curriculosRes.data || []
      );

      setDisciplinas(
        disciplinasRes.data || []
      );

      setDadosProfessor(
        relatorioRes.data || []
      );

    } catch (err) {
      console.error(err);

      message.error(
        "Erro ao carregar os dados"
      );
    }
  };

  /* ======================================================
     FILTRAR CURSOS
  ====================================================== */

  useEffect(() => {
    if (!filtros.departamento_id) {
      setCursos(todosCursos);
      return;
    }

    const filtrados =
      todosCursos.filter(
        (c) =>
          c.departamento_id ===
            filtros.departamento_id ||
          c.departamento?.id ===
            filtros.departamento_id
      );

    setCursos(filtrados);

  }, [
    filtros.departamento_id,
    todosCursos,
  ]);

  /* ======================================================
     RELATÓRIO DINÂMICO
  ====================================================== */

  useEffect(() => {
    carregarRelatorio();
  }, [filtros]);

  const carregarRelatorio =
    async () => {
      try {

        const response =
          await api.get(
            "/relatorios/professor",
            {
              params: filtros,
            }
          );

        setDadosProfessor(
          response.data || []
        );

      } catch (err) {
        console.error(err);

        message.error(
          "Erro ao carregar relatório"
        );
      }
    };

  /* ======================================================
     EXPORTAR EXCEL
  ====================================================== */

  const exportarExcel =
    async () => {
      try {
        setLoadingExcel(true);

        const response =
          await api.get(
            "/relatorios/export/excel",
            {
              params: filtros,
              responseType:
                "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        const link =
          document.createElement(
            "a"
          );

        link.href = url;

        link.download =
          "relatorio.xlsx";

        document.body.appendChild(
          link
        );

        link.click();

        link.remove();

      } catch (err) {
        console.error(err);

        message.error(
          "Erro ao exportar Excel"
        );
      } finally {
        setLoadingExcel(false);
      }
    };

  /* ======================================================
     EXPORTAR PDF
  ====================================================== */

  const exportarPDF =
    async () => {
      try {
        setLoadingPDF(true);

        const response =
          await api.get(
            "/relatorios/export/pdf",
            {
              params: filtros,
              responseType:
                "blob",
            }
          );

        const blob =
          new Blob(
            [response.data],
            {
              type: "application/pdf",
            }
          );

        const url =
          window.URL.createObjectURL(
            blob
          );

        window.open(url);

      } catch (err) {
        console.error(err);

        message.error(
          "Erro ao gerar PDF"
        );
      } finally {
        setLoadingPDF(false);
      }
    };

  /* ======================================================
     PESQUISA
  ====================================================== */

  const dadosFiltrados =
    dadosProfessor.filter((d) => {

      const nome =
        d.nome?.toLowerCase() ||
        d.disciplina?.nome?.toLowerCase() ||
        "";

      return nome.includes(
        search.toLowerCase()
      );
    });

  /* ======================================================
     TAGS
  ====================================================== */

  const renderTags = (
    text,
    bg,
    color
  ) => {
    return (
      <Tag
        style={{
          background: bg,
          color,
          border: "none",
          fontSize: 14,
          fontWeight: 600,
          padding: "6px 14px",
          borderRadius: 18,
          maxWidth: 220,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </Tag>
    );
  };

  /* ======================================================
     COLUNAS
  ====================================================== */

  const columns = [
    {
      title: "Disciplina",

      width: 340,

      onHeaderCell: () => ({
        style: headerCellStyle,
      }),

      render: (_, r) => (
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              wordBreak:
                "break-word",
            }}
          >
            {r.nome ||
              r.disciplina?.nome}
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginTop: 2,
            }}
          >
            {r.codigo ||
              r.disciplina?.codigo}
          </div>
        </div>
      ),
    },

    {
      title: "Curso",

      width: 270,

      onHeaderCell: () => ({
        style: headerCellStyle,
      }),

      render: (_, r) => (
        <Space wrap>
          {(r.cursos || []).map(
            (curso, i) => (
              <Tag
                key={i}
                style={{
                  background:
                    "#dbeafe",

                  color:
                    "black",

                  border:
                    "none",

                  borderRadius: 18,

                  padding:
                    "6px 12px",

                  fontWeight: 600,

                  maxWidth: 180,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",
                }}
              >
                {curso}
              </Tag>
            )
          )}
        </Space>
      ),
    },

    {
      title: "Departamento",

      width: 220,

      align: "center",

      onHeaderCell: () => ({
        style: headerCellStyle,
      }),

      render: (_, r) =>
        renderTags(
          r.departamento,
          "#f3e8ff",
          "black"
        ),
    },

    {
      title: "Professor",

      width: 260,

      onHeaderCell: () => ({
        style: headerCellStyle,
      }),

      render: (_, r) => (
        <Space wrap>
          {(r.professores || []).map(
            (prof, i) => (
              <Tag
                key={i}
                style={{
                  background:
                    "#black",

                  color:
                    "#166534",

                  border:
                    "none",

                  borderRadius: 18,

                  padding:
                    "6px 12px",

                  fontWeight: 600,

                  maxWidth: 180,

                  overflow:
                    "hidden",

                  textOverflow:
                    "ellipsis",

                  whiteSpace:
                    "nowrap",
                }}
              >
                {prof}
              </Tag>
            )
          )}
        </Space>
      ),
    },

    {
      title: "Multicurso",

      width: 140,

      align: "center",

      onHeaderCell: () => ({
        style: headerCellStyle,
      }),

      render: (_, r) => (
        <Tag
          style={{
            background:
              r.multicurso
                ? "#ffedd5"
                : "#dcfce7",

            color:
              r.multicurso
                ? "black"
                : "#166534",

            border: "none",

            fontSize: 12,

            fontWeight: 700,

            padding: "5px 14px",

            borderRadius: 20,
          }}
        >
          {r.multicurso
            ? "SIM"
            : "NÃO"}
        </Tag>
      ),
    },
  ];

  /* ======================================================
     RENDER
  ====================================================== */

  return (
    <AppLayout>

      {/* TOPO */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          marginBottom: 18,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Input
          placeholder="Buscar disciplina..."
          prefix={<SearchOutlined />}
          allowClear
          style={{
            width: 280,
          }}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <Space>
          <Button
            type="primary"
            icon={
              <DownloadOutlined />
            }
            loading={
              loadingExcel
            }
            onClick={
              exportarExcel
            }
          >
            Excel
          </Button>

          <Button
            icon={
              <DownloadOutlined />
            }
            loading={
              loadingPDF
            }
            onClick={
              exportarPDF
            }
          >
            PDF
          </Button>
        </Space>
      </div>

      {/* FILTROS */}

      <Row
  gutter={[12, 12]}
  style={{
    marginBottom: 20,
  }}
>

  <Col flex="230px">
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Disciplina"
      style={{ width: "100%" }}
      dropdownStyle={{
        width: 420,
      }}
      value={filtros.disciplina_id}
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          disciplina_id: v,
        }))
      }
      options={disciplinas.map(
        (d) => ({
          value: d.id,
          label: `${d.codigo} - ${d.nome}`,
        })
      )}
    />
  </Col>

  <Col flex="220px">
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Curso"
      style={{ width: "100%" }}
      value={filtros.curso_id}
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          curso_id: v,
        }))
      }
      options={cursos.map(
        (c) => ({
          value: c.id,
          label: c.nome,
        })
      )}
    />
  </Col>

  <Col flex="220px">
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Departamento"
      style={{ width: "100%" }}
      value={
        filtros.departamento_id
      }
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          departamento_id: v,
        }))
      }
      options={departamentos.map(
        (d) => ({
          value: d.id,
          label: `${d.sigla} - ${d.nome}`,
        })
      )}
    />
  </Col>

  <Col flex="220px">
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Professor"
      style={{ width: "100%" }}
      value={filtros.professor_id}
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          professor_id: v,
        }))
      }
      options={professores.map(
        (p) => ({
          value: p.id,
          label: p.nome,
        })
      )}
    />
  </Col>

  <Col flex="140px">
    <Select
      allowClear
      placeholder="Ano"
      style={{ width: "100%" }}
      value={filtros.ano_id}
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          ano_id: v,
        }))
      }
      options={anos.map(
        (a) => ({
          value: a.id,
          label:
            a.descricao ||
            a.ano,
        })
      )}
    />
  </Col>

  <Col flex="140px">
    <Select
      allowClear
      placeholder="Semestre"
      style={{ width: "100%" }}
      value={filtros.semestre_id}
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          semestre_id: v,
        }))
      }
      options={semestres.map(
        (s) => ({
          value: s.id,
          label:
            s.descricao ||
            s.nome,
        })
      )}
    />
  </Col>

  <Col flex="220px">
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      placeholder="Currículo"
      style={{ width: "100%" }}
      value={
        filtros.curriculo_id
      }
      onChange={(v) =>
        setFiltros((f) => ({
          ...f,
          curriculo_id: v,
        }))
      }
      options={curriculos.map(
        (c) => ({
          value: c.id,
          label:
            c.descricao ||
            c.nome,
        })
      )}
    />
  </Col>

</Row>

      {/* TABELA */}

      <Table
        rowKey="id"
        dataSource={
          dadosFiltrados
        }
        columns={columns}
        pagination={{
          pageSize: 8,
        }}
        bordered
        size="middle"
        scroll={{
          x: 1400,
        }}
      />

    </AppLayout>
  );
}