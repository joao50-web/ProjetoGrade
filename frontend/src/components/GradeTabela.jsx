import { useEffect, useState } from "react";
import { Table, Select, Button, Space, message, Alert, Tag } from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { api } from "../services/api";

const headerStyle = {
  backgroundColor: "#0b3d5c",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "13px",
  textAlign: "center",
};

export default function GradeTabela() {
  /* ================= STATES ================= */
  const [departamentos, setDepartamentos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [grade, setGrade] = useState([]);

  const [deptoId, setDeptoId] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);
  const [professorId, setProfessorId] = useState(null);
  const [coordenadorId, setCoordenadorId] = useState(null);

  const diasFixos = [
    { id: 1, nome: "2ª feira" },
    { id: 2, nome: "3ª feira" },
    { id: 3, nome: "4ª feira" },
    { id: 4, nome: "5ª feira" },
    { id: 5, nome: "6ª feira" },
  ];

  /* ================= LOAD INICIAL ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, a, s, cur, h, p, coord] = await Promise.all([
          api.get("/departamentos"),
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/pessoas"),
          api.get("/pessoas/coordenadores"),
        ]);

        setDepartamentos(d.data || []);
        setTodosCursos(c.data || []);
        setCursos(c.data || []);
        setAnos(a.data || []);
        setSemestres(s.data || []);
        setCurriculos(cur.data || []);
        setHorarios(h.data || []);
        setProfessores(p.data || []);
        setCoordenadores(coord.data || []);

        if (!coord.data?.length) {
          message.warning("Nenhum coordenador encontrado.");
        }
      } catch (err) {
        console.error(err);
        message.error("Erro ao carregar dados");
      }
    };

    load();
  }, []);

  /* ================= FILTRO DEPARTAMENTO ================= */
  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
    setGrade([]);
    setDisciplinas([]);

    if (!id) {
      setCursos(todosCursos);
      return;
    }

    setCursos(
      todosCursos.filter(
        (c) => c.departamento_id === id || c.departamento?.id === id
      )
    );
  };

  /* ================= DISCIPLINAS ================= */
  useEffect(() => {
    if (!cursoId) return;

    api
      .get(`/cursos/${cursoId}/disciplinas`)
      .then((res) => setDisciplinas(res.data || []))
      .catch(() => setDisciplinas([]));
  }, [cursoId]);

  /* ================= BUSCAR GRADE (CORRIGIDO) ================= */
  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;

    // 🔥 Envia os parâmetros de forma explícita:
    // - Se o select estiver vazio (null), envia a string "null" para o backend tratar.
    // - Se tiver um valor, envia o número.
    const params = {
      curso_id: cursoId,
      ano_id: anoId,
      semestre_id: semestreId,
      curriculo_id: curriculoId,
      professor_id: professorId === null ? "null" : professorId,
      coordenador_id: coordenadorId === null ? "null" : coordenadorId,
    };

    console.log("📡 Enviando para /grade-horaria:", params); // debug

    api
      .get("/grade-horaria", { params })
      .then((res) => setGrade(res.data || []))
      .catch((err) => {
        console.error(err);
        setGrade([]);
      });
  }, [cursoId, anoId, semestreId, curriculoId, professorId, coordenadorId]);

  /* ================= SALVAR ================= */
  const handleSave = async () => {
    try {
      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId ?? null,
          professor_id: professorId ?? null,
        },
        slots: grade,
      });
      message.success("Grade salva com sucesso!");
    } catch (err) {
      console.error(err);
      message.error("Erro ao salvar grade");
    }
  };

  /* ================= COLUNAS ================= */
  const columns = [
    {
      title: "Horário",
      dataIndex: "descricao",
      width: 90,
      fixed: "left",
      onHeaderCell: () => ({ style: headerStyle }),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome,
      width: 260,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const item = grade.find(
          (g) => g.horario_id === record.id && g.dia_semana_id === dia.id
        );
        return (
          <div>
            <Select
              allowClear
              showSearch
              size="small"
              style={{ width: "100%" }}
              value={item?.disciplina_id}
              onChange={(val) =>
                setGrade((prev) => {
                  const filtered = prev.filter(
                    (g) =>
                      !(g.horario_id === record.id && g.dia_semana_id === dia.id)
                  );
                  if (val) {
                    filtered.push({
                      horario_id: record.id,
                      dia_semana_id: dia.id,
                      disciplina_id: val,
                      professor_id: professorId ?? null,
                      coordenador_id: coordenadorId ?? null,
                    });
                  }
                  return filtered;
                })
              }
              options={disciplinas.map((d) => ({
                value: d.id,
                label: `${d.codigo} - ${d.nome}`,
              }))}
            />
            {item?.professor && (
              <div style={{ fontSize: 11 }}>Prof: {item.professor.nome}</div>
            )}
            {item?.coordenador && (
              <div style={{ fontSize: 11 }}>Coord: {item.coordenador.nome}</div>
            )}
          </div>
        );
      },
    })),
  ];

  const coordenadorSelecionado = coordenadores.find((c) => c.id === coordenadorId);

  /* ================= UI ================= */
  return (
    <>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
        <Select
          placeholder="Departamento"
          style={{ width: 160 }}
          value={deptoId}
          onChange={handleDeptoChange}
          allowClear
          options={departamentos.map((d) => ({ value: d.id, label: d.nome }))}
        />
        <Select
          placeholder="Curso"
          style={{ width: 160 }}
          value={cursoId}
          onChange={setCursoId}
          allowClear
          options={cursos.map((c) => ({ value: c.id, label: c.nome }))}
        />
        <Select
          placeholder="Ano"
          style={{ width: 90 }}
          value={anoId}
          onChange={setAnoId}
          allowClear
          options={anos.map((a) => ({ value: a.id, label: a.ano }))}
        />
        <Select
          placeholder="Semestre"
          style={{ width: 90 }}
          value={semestreId}
          onChange={setSemestreId}
          allowClear
          options={semestres.map((s) => ({ value: s.id, label: s.nome }))}
        />
        <Select
          placeholder="Currículo"
          style={{ width: 110 }}
          value={curriculoId}
          onChange={setCurriculoId}
          allowClear
          options={curriculos.map((c) => ({ value: c.id, label: c.nome }))}
        />
        <Select
          placeholder="Professor"
          style={{ width: 180 }}
          value={professorId}
          onChange={setProfessorId}
          allowClear
          showSearch
          options={professores.map((p) => ({ value: p.id, label: p.nome }))}
        />
        <Select
          placeholder="Coordenador"
          style={{ width: 180 }}
          value={coordenadorId}
          onChange={setCoordenadorId}
          allowClear
          showSearch
          options={coordenadores.map((c) => ({ value: c.id, label: c.nome }))}
        />
        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Salvar
          </Button>
          <Button icon={<FilePdfOutlined />}>PDF</Button>
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
            Reset
          </Button>
        </Space>
      </div>

      {/* Contexto (tags) */}
      {(coordenadorSelecionado || professorId) && (
        <div style={{ marginBottom: 10 }}>
          {coordenadorSelecionado && (
            <Tag color="blue">Coordenador: {coordenadorSelecionado.nome}</Tag>
          )}
          {professorId && (
            <Tag color="green">
              Professor: {professores.find((p) => p.id === professorId)?.nome}
            </Tag>
          )}
        </div>
      )}

      {/* Alerta se não houver coordenadores */}
      {coordenadores.length === 0 && (
        <Alert message="Nenhum coordenador cadastrado" type="warning" showIcon />
      )}

      {/* Tabela */}
      <Table
        rowKey="id"
        dataSource={horarios}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1500, y: 700 }}
      />
    </>
  );
}