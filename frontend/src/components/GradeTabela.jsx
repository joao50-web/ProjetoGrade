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
  ReloadOutlined,
} from "@ant-design/icons";
import AppLayout from "../components/AppLayout";
import { api, getUsuarioLogado } from "../services/api";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const { Text } = Typography;

const headerStyle = {
  backgroundColor: "#0b3d5c",
  color: "#fff",
  fontWeight: 600,
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
  const [disciplinas, setDisciplinas] = useState([]);

  const [deptoId, setDeptoId] = useState(null);
  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);

  const [grade, setGrade] = useState([]);

  const diasFixos = [
    { id: 1, nome: "Segunda" },
    { id: 2, nome: "Terça" },
    { id: 3, nome: "Quarta" },
    { id: 4, nome: "Quinta" },
    { id: 5, nome: "Sexta" },
  ];

  useEffect(() => {
    const load = async () => {
      const [d, c, a, s, cur, h] = await Promise.all([
        api.get("/departamentos"),
        api.get("/cursos"),
        api.get("/anos"),
        api.get("/semestres"),
        api.get("/curriculos"),
        api.get("/horarios"),
      ]);

      setDepartamentos(d.data);
      setTodosCursos(c.data);
      setCursos(c.data);
      setAnos(a.data);
      setSemestres(s.data);
      setCurriculos(cur.data);
      setHorarios(h.data);
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
      setDisciplinas(res.data.map((i) => i.disciplina || i));
    });
  }, [cursoId]);

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
      .then((res) => setGrade(res.data || []));
  }, [cursoId, anoId, semestreId, curriculoId]);

  const updateCell = (hId, dId, value) => {
    setGrade((prev) => {
      const filtered = prev.filter(
        (g) => !(g.horario_id === hId && g.dia_semana_id === dId)
      );

      filtered.push({
        horario_id: hId,
        dia_semana_id: dId,
        disciplina_id: value || null,
      });

      return filtered;
    });

    saveGrade();
  };

  const buildSlots = () => {
    const slots = [];

    horarios.forEach((h) => {
      diasFixos.forEach((d) => {
        const item = grade.find(
          (g) => g.horario_id === h.id && g.dia_semana_id === d.id
        );

        slots.push({
          horario_id: h.id,
          dia_semana_id: d.id,
          disciplina_id: item?.disciplina_id || null,
        });
      });
    });

    return slots;
  };

  const saveGrade = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return;

    await api.post("/grade-horaria/save", {
      contexto: {
        curso_id: cursoId,
        ano_id: anoId,
        semestre_id: semestreId,
        curriculo_id: curriculoId,
      },
      slots: buildSlots(),
    });
  };

  // 🔥 RESTAURAR FILTROS (LIMPA TELA)
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

  // EXPORT
  const exportToExcel = () => {
    const data = horarios.map((h) => {
      const row = { Horário: h.descricao };
      diasFixos.forEach((dia) => {
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

    const head = [["Horário", ...diasFixos.map((d) => d.nome)]];
    const body = horarios.map((h) => {
      const row = [h.descricao];
      diasFixos.forEach((dia) => {
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
    ...diasFixos.map((dia) => ({
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
            value={item?.disciplina_id || undefined}
            onChange={(val) => updateCell(record.id, dia.id, val)}
            allowClear
            showSearch
            optionFilterProp="children"
            dropdownMatchSelectWidth={false}
            maxTagCount="responsive"
          >
            {disciplinas.map((d) => (
              <Select.Option key={d.id} value={d.id}>
                <span
                  style={{
                    display: "inline-block",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.nome}
                </span>
              </Select.Option>
            ))}
          </Select>
        );
      },
    })),
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: 10 }}>
        {/* BOTÕES */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Space>
            <Tooltip title="Salvar">
              <Button icon={<SaveOutlined />} onClick={saveGrade}>
                Salvar
              </Button>
            </Tooltip>

            <Tooltip title="Exportar PDF">
              <Button icon={<FilePdfOutlined />} onClick={exportToPDF}>
                PDF
              </Button>
            </Tooltip>

            <Tooltip title="Exportar Excel">
              <Button icon={<FileExcelOutlined />} onClick={exportToExcel}>
                Excel
              </Button>
            </Tooltip>

            <Tooltip title="Limpar filtros">
              <Button icon={<ReloadOutlined />} onClick={resetFiltros}>
                Restaurar
              </Button>
            </Tooltip>
          </Space>
        </div>

        {/* FILTROS RESPONSIVOS */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            padding: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fafafa",
            marginTop: 10,
          }}
        >
          {[
            ["Departamento", departamentos, handleDeptoChange],
            ["Curso", cursos, setCursoId],
            ["Ano", anos, setAnoId],
            ["Semestre", semestres, setSemestreId],
            ["Currículo", curriculos, setCurriculoId],
          ].map(([label, list, onChange], i) => (
            <div key={i} style={{ minWidth: 180, flex: "1 1 180px" }}>
              <Text strong style={{ fontSize: 12 }}>
                {label}
              </Text>

              <Select
                style={{ width: "100%", marginTop: 4 }}
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
        scroll={{ x: "max-content", y: 550 }}
      />
    </AppLayout>
  );
}