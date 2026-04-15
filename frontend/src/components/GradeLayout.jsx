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
  const [professores, setProfessores] = useState([]);
  const [grade, setGrade] = useState([]);

  const [deptoId, setDeptoId] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);
  const [professorId, setProfessorId] = useState(null);

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
        const [d, c, a, s, cur, h, p] = await Promise.all([
          api.get("/departamentos"),
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/pessoas"),
        ]);

        setDepartamentos(d.data || []);
        setTodosCursos(c.data || []);
        setCursos(c.data || []);
        setAnos(a.data || []);
        setSemestres(s.data || []);
        setCurriculos(cur.data || []);
        setHorarios(h.data || []);
        setProfessores(p.data || []);
      } catch {
        message.error("Erro ao carregar dados");
      }
    };
    load();
  }, []);

  // ================= DEPTO
  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
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
    if (!cursoId) return;
    api.get(`/cursos/${cursoId}/disciplinas`)
      .then((res) => setDisciplinas(res.data || []));
  }, [cursoId]);

  // ================= GRADE
  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;

    api.get("/grade-horaria", {
      params: {
        curso_id: cursoId,
        ano_id: anoId,
        semestre_id: semestreId,
        curriculo_id: curriculoId,
        ...(professorId ? { professor_id: professorId } : {}),
      },
    })
      .then((res) => setGrade(res.data || []))
      .catch(() => setGrade([]));
  }, [cursoId, anoId, semestreId, curriculoId, professorId]);

  // ================= UPDATE
  const updateCell = (hId, dId, value) => {
    setGrade((prev) => {
      const filtered = prev.filter(
        (g) => !(g.horario_id === hId && g.dia_semana_id === dId)
      );

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
    await api.post("/grade-horaria/save", {
      contexto: {
        curso_id: cursoId,
        ano_id: anoId,
        semestre_id: semestreId,
        curriculo_id: curriculoId,
      },
      slots: grade,
    });

    message.success("Salvo!");
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
      width: 260,
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
              allowClear
              showSearch
              size="small"
              style={{ width: "100%" }}
              value={item?.disciplina_id || undefined}
              onChange={(val) =>
                updateCell(record.id, dia.id, val || null)
              }

              // 🔥 AQUI ESTÁ A CORREÇÃO REAL
              options={disciplinas.map((d) => ({
                value: d.id,
                label: `${d.codigo} - ${d.nome}`,
                search: `${d.codigo} ${d.nome}` // importante
              }))}

              optionFilterProp="search"

              filterOption={(input, option) =>
                (option?.search ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Tooltip>
        );
      },
    })),
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>

        <Select
          placeholder="Depto"
          style={{ width: 180 }}
          value={deptoId}
          onChange={handleDeptoChange}
          options={departamentos.map(d => ({ value: d.id, label: d.nome }))}
        />

        <Select
          placeholder="Curso"
          style={{ width: 180 }}
          value={cursoId}
          onChange={setCursoId}
          options={cursos.map(c => ({ value: c.id, label: c.nome }))}
        />

        <Select
          placeholder="Ano"
          style={{ width: 100 }}
          value={anoId}
          onChange={setAnoId}
          options={anos.map(a => ({ value: a.id, label: a.ano }))}
        />

        <Select
          placeholder="Sem"
          style={{ width: 100 }}
          value={semestreId}
          onChange={setSemestreId}
          options={semestres.map(s => ({ value: s.id, label: s.nome }))}
        />

        <Select
          placeholder="Curr"
          style={{ width: 120 }}
          value={curriculoId}
          onChange={setCurriculoId}
          options={curriculos.map(c => ({ value: c.id, label: c.nome }))}
        />

        <Select
          placeholder="Professor (opcional)"
          allowClear
          style={{ width: 200 }}
          value={professorId}
          onChange={setProfessorId}
          options={professores.map(p => ({
            value: p.id,
            label: p.nome,
          }))}
        />

        <Space>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} />
          <Button icon={<FilePdfOutlined />} />
          <Button icon={<FileExcelOutlined />} />
          <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
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