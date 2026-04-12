import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  Typography,
  Space,
  Tooltip,
} from "antd";
import {
  SaveOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api, getUsuarioLogado } from "../services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Text } = Typography;

const headerStyle = {
  backgroundColor: "#093e5e",
  color: "#fff",
  fontWeight: "bold",
  fontSize: "13px",
  textAlign: "center",
};

export default function GradeHoraria() {
  const usuario = getUsuarioLogado();
  const canEdit = ["administrador", "edicao"].includes(
    usuario?.role?.toLowerCase()
  );

  const [departamentos, setDepartamentos] = useState([]);
  const [todosCursos, setTodosCursos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);

  const [deptoId, setDeptoId] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);

  const [grade, setGrade] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [d, c, a, s, cur, h, dias] = await Promise.all([
          api.get("/departamentos"),
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/dias-semana"),
        ]);

        setDepartamentos(d.data);
        setTodosCursos(c.data);
        setCursos(c.data);
        setAnos(a.data);
        setSemestres(s.data);
        setCurriculos(cur.data);
        setHorarios(h.data);
        setDiasSemana(dias.data);
      } catch {
        message.error("Erro ao carregar dados");
      }
    };
    load();
  }, []);

  const handleDeptoChange = (id) => {
    setDeptoId(id);
    setCursoId(null);
    setCursos(
      id
        ? todosCursos.filter(
            (c) => c.departamento_id === id || c.departamento?.id === id
          )
        : todosCursos
    );
  };

  useEffect(() => {
    if (!cursoId) return setDisciplinas([]);

    api.get(`/cursos/${cursoId}/disciplinas`).then((res) => {
      const lista = res.data.map((i) => i.disciplina || i);
      setDisciplinas(lista);
    });
  }, [cursoId]);

  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;

    setLoading(true);
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
      .catch(() => message.error("Erro ao buscar grade"))
      .finally(() => setLoading(false));
  }, [cursoId, anoId, semestreId, curriculoId]);

  const updateCell = (hId, dId, value) => {
    setGrade((prev) => {
      const filtered = prev.filter(
        (g) => !(g.horario_id === hId && g.dia_semana_id === dId)
      );
      if (value)
        filtered.push({
          horario_id: hId,
          dia_semana_id: dId,
          disciplina_id: value,
        });
      return filtered;
    });
  };

  const saveGrade = async () => {
    try {
      setLoading(true);
      await api.post("/grade-horaria", {
        curso_id: cursoId,
        ano_id: anoId,
        semestre_id: semestreId,
        curriculo_id: curriculoId,
        items: grade,
      });
      message.success("Grade salva com sucesso");
    } catch {
      message.error("Erro ao salvar");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const data = horarios.map((h) => {
      const row = { Horário: h.descricao };
      diasSemana.forEach((dia) => {
        const item = grade.find(
          (g) => g.horario_id === h.id && g.dia_semana_id === dia.id
        );
        const disc = disciplinas.find((d) => d.id === item?.disciplina_id);
        row[dia.nome] = disc?.nome || "";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Grade");
    XLSX.writeFile(wb, "Grade.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF("l");
    const head = [["Horário", ...diasSemana.map((d) => d.nome)]];
    const body = horarios.map((h) => {
      const row = [h.descricao];
      diasSemana.forEach((dia) => {
        const item = grade.find(
          (g) => g.horario_id === h.id && g.dia_semana_id === dia.id
        );
        const disc = disciplinas.find((d) => d.id === item?.disciplina_id);
        row.push(disc?.nome || "");
      });
      return row;
    });

    doc.autoTable({ head, body });
    doc.save("Grade.pdf");
  };

  const columns = [
    {
      title: "Horário",
      dataIndex: "descricao",
      width: 120,
      fixed: "left",
      onHeaderCell: () => ({ style: headerStyle }),
    },
    ...diasSemana.map((dia) => ({
      title: dia.nome,
      key: dia.id,
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const item = grade.find(
          (g) => g.horario_id === record.id && g.dia_semana_id === dia.id
        );

        return (
          <Select
            size="small"
            style={{ width: "100%" }}
            value={item?.disciplina_id}
            onChange={(val) => updateCell(record.id, dia.id, val)}
            disabled={!canEdit}
            allowClear
          >
            {disciplinas.map((d) => (
              <Select.Option key={d.id} value={d.id}>
                {d.nome}
              </Select.Option>
            ))}
          </Select>
        );
      },
    })),
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: 12 }}>
        {/* BOTÕES */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          <Space size={6}>
            {canEdit && (
              <Tooltip title="Salvar a grade horária">
                <Button size="small" icon={<SaveOutlined />} onClick={saveGrade}>
                  Salvar
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Exportar em PDF">
              <Button size="small" icon={<FilePdfOutlined />} onClick={exportToPDF}>
                PDF
              </Button>
            </Tooltip>

            <Tooltip title="Exportar em Excel">
              <Button size="small" icon={<FileExcelOutlined />} onClick={exportToExcel}>
                Excel
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* FILTROS */}
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: 12,
            border: "1px solid #d9e4ec",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          {[
            ["Departamento", departamentos, handleDeptoChange],
            ["Curso", cursos, setCursoId],
            ["Ano", anos, setAnoId],
            ["Semestre", semestres, setSemestreId],
            ["Currículo", curriculos, setCurriculoId],
          ].map(([label, list, onChange], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <Text style={{ fontWeight: 600, fontSize: 12, marginBottom: 4 }}>
                {label}
              </Text>
              <Select
                size="small"
                style={{ width: 160 }}
                onChange={onChange}
                allowClear
              >
                {list.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.nome || item.ano}
                  </Select.Option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      <Table
        rowKey="id"
        dataSource={horarios}
        columns={columns}
        pagination={false}
        bordered
        size="small"
        loading={loading}
        scroll={{ x: "max-content", y: 550 }}
      />
    </AppLayout>
  );
}