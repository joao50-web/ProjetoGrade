import { useEffect, useState } from "react";
import { Table, Select, Button, Space, Tooltip, message } from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api } from "../services/api";

const headerStyle = {
  backgroundColor: "#0b3d5c",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "13px",
  textAlign: "center",
};

export default function GradeHoraria() {
  const [departamentos, setDepartamentos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [grade, setGrade] = useState([]);

  const [deptoId, setDeptoId] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);

  const diasFixos = [
    { id: 1, nome: "2ª feira" },
    { id: 2, nome: "3ª feira" },
    { id: 3, nome: "4ª feira" },
    { id: 4, nome: "5ª feira" },
    { id: 5, nome: "6ª feira" },
  ];

  // ================= LOAD
  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, a, s, cur, h] = await Promise.all([
          api.get("/departamentos"),
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
        ]);

        setDepartamentos(d.data || []);
        setTodosCursos(c.data || []);
        setCursos(c.data || []);
        setAnos(a.data || []);
        setSemestres(s.data || []);
        setCurriculos(cur.data || []);
        setHorarios(h.data || []);
      } catch (err) {
        console.error(err);
        message.error("Erro ao carregar dados");
      }
    };
    load();
  }, []);

  // ================= DEPTO
  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
    setAnoId(null);
    setSemestreId(null);
    setCurriculoId(null);
    setGrade([]);
    setDisciplinas([]);

    if (!id) return setCursos(todosCursos);

    setCursos(
      todosCursos.filter(
        (c) => c.departamento_id === id || c.departamento?.id === id
      )
    );
  };

  // ================= DISCIPLINAS
  useEffect(() => {
    if (!cursoId) return setDisciplinas([]);

    api.get(`/cursos/${cursoId}/disciplinas`).then((res) => {
      setDisciplinas(res.data || []);
    });
  }, [cursoId]);

  // ================= GRADE
  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;

    api
      .get("/grade-horaria", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
      })
      .then((res) => setGrade(res.data || []))
      .catch(() => setGrade([]));
  }, [cursoId, anoId, semestreId, curriculoId]);

  // ================= UPDATE (INCLUI EXCLUSÃO)
  const updateCell = (hId, dId, value) => {
    setGrade((prev) => {
      const filtered = prev.filter(
        (g) => !(g.horario_id === hId && g.dia_semana_id === dId)
      );

      // 🔥 SE value for null → remove disciplina
      if (value) {
        filtered.push({
          horario_id: hId,
          dia_semana_id: dId,
          disciplina_id: value,
        });
      }

      return filtered;
    });
  };

  // ================= SAVE
  const handleSave = async () => {
    try {
      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: null,
        },
        slots: grade,
      });

      message.success("Salvo com sucesso!");
    } catch (err) {
      console.error(err);
      message.error("Erro ao salvar");
    }
  };

  // ================= PDF
  const handlePDF = () => {
    const url = `/relatorio/grade?curso_id=${cursoId}&ano_id=${anoId}&curriculo_id=${curriculoId}&semestre_id=${semestreId}`;
    window.open(api.defaults.baseURL + url, "_blank");
  };

  // ================= EXCEL
  const handleExcel = async () => {
    try {
      const res = await api.get("/relatorio/grade/excel", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "grade.xlsx";
      a.click();
    } catch {
      message.error("Erro Excel");
    }
  };

  // ================= RESET
  const resetFiltros = () => {
    setDeptoId(null);
    setCursoId(null);
    setAnoId(null);
    setSemestreId(null);
    setCurriculoId(null);
    setGrade([]);
    setDisciplinas([]);
    setCursos(todosCursos);
  };

  // ================= COLUNAS
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
      key: dia.id,
      width: 240,
      onHeaderCell: () => ({ style: headerStyle }),

      render: (_, record) => {
        const item = grade.find(
          (g) =>
            g.horario_id === record.id &&
            g.dia_semana_id === dia.id
        );

        return (
          <Tooltip title="Disciplina">
            <Select
              allowClear   // ⭐ BOTÃO DE EXCLUIR
              size="small"
              style={{ width: "100%" }}
              value={item?.disciplina_id || undefined}
              onChange={(val) =>
                updateCell(record.id, dia.id, val || null)
              }
              options={disciplinas.map((d) => ({
                value: d.id,
                label: `${d.departamento_sigla || ""} (${d.codigo}) - ${d.nome}`,
              }))}
            />
          </Tooltip>
        );
      },
    })),
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Select
          placeholder="Depto"
          style={{ width: 200 }}
          onChange={handleDeptoChange}
          value={deptoId}
          options={departamentos.map((d) => ({
            value: d.id,
            label: d.nome,
          }))}
        />

        <Select
          placeholder="Curso"
          style={{ width: 200 }}
          onChange={setCursoId}
          value={cursoId}
          options={cursos.map((c) => ({
            value: c.id,
            label: c.nome,
          }))}
        />

        <Select
          placeholder="Ano"
          style={{ width: 120 }}
          onChange={setAnoId}
          value={anoId}
          options={anos.map((a) => ({
            value: a.id,
            label: a.ano,
          }))}
        />

        <Select
          placeholder="Sem"
          style={{ width: 120 }}
          onChange={setSemestreId}
          value={semestreId}
          options={semestres.map((s) => ({
            value: s.id,
            label: s.nome,
          }))}
        />

        <Select
          placeholder="Curr"
          style={{ width: 150 }}
          onChange={setCurriculoId}
          value={curriculoId}
          options={curriculos.map((c) => ({
            value: c.id,
            label: c.nome,
          }))}
        />

        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
          <Button icon={<FilePdfOutlined />} onClick={handlePDF} />
          <Button icon={<FileExcelOutlined />} onClick={handleExcel} />
          <Button icon={<ReloadOutlined />} onClick={resetFiltros} />
        </Space>
      </div>

      <Table
        rowKey="id"
        dataSource={horarios}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 1500, y: 700 }}
      />
    </AppLayout>
  );
}