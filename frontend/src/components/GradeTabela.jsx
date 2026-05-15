import { useEffect, useState } from "react";
import {
  Table,
  Select,
  Button,
  message,
  ConfigProvider,
} from "antd";

import {
  SaveOutlined,
  FilePdfOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { api } from "../services/api";

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
};

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "10px 6px",
};

const horarioCellStyle = {
  backgroundColor: THEME.primary,
  color: "#fff",
  fontWeight: "700",
  textAlign: "center",
  fontSize: "12px",
};

export default function GradeTabela() {

  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [coordenadores, setCoordenadores] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);

  const [grade, setGrade] = useState([]);
  const [saving, setSaving] = useState(false);

  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);
  const [coordenadorId, setCoordenadorId] = useState(null);

  const diasFixos = [
    { id: 1, nome: "SEGUNDA" },
    { id: 2, nome: "TERÇA" },
    { id: 3, nome: "QUARTA" },
    { id: 4, nome: "QUINTA" },
    { id: 5, nome: "SEXTA" },
  ];

  /* LOAD INICIAL */
  useEffect(() => {
    const load = async () => {
      try {
        const [
          cursosRes,
          anosRes,
          semestresRes,
          curriculosRes,
          horariosRes,
          professoresRes,
          coordenadoresRes,
          departamentosRes,
        ] = await Promise.all([
          api.get("/cursos"),
          api.get("/anos"),
          api.get("/semestres"),
          api.get("/curriculos"),
          api.get("/horarios"),
          api.get("/pessoas/professores"),
          api.get("/pessoas/coordenadores"),
          api.get("/departamentos"),
        ]);

        setCursos(cursosRes.data || []);
        setAnos(anosRes.data || []);
        setSemestres(semestresRes.data || []);
        setCurriculos(curriculosRes.data || []);
        setProfessores(professoresRes.data || []);
        setCoordenadores(coordenadoresRes.data || []);
        setDepartamentos(departamentosRes.data || []);

        setHorarios(
          (horariosRes.data || []).sort((a, b) =>
            a.descricao.split("-")[0].localeCompare(b.descricao.split("-")[0])
          )
        );

      } catch (err) {
        message.error("Erro ao carregar dados");
      }
    };

    load();
  }, []);

  /* DISCIPLINAS */
  useEffect(() => {
    if (!cursoId) return setDisciplinas([]);

    api.get(`/cursos/${cursoId}/disciplinas`)
      .then(res => setDisciplinas(res.data || []))
      .catch(() => setDisciplinas([]));

  }, [cursoId]);

  /* GRADE */
  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      setGrade([]);
      return;
    }
    loadGrade();
  }, [cursoId, anoId, semestreId, curriculoId]);

  const loadGrade = async () => {
    try {
      const response = await api.get("/grade-horaria", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
      });

      setGrade(response.data || []);

      if (response.data?.length > 0) {
        setCoordenadorId(response.data[0].coordenador_id);
      }

    } catch {
      setGrade([]);
      message.error("Erro ao carregar grade");
    }
  };

  /* UPDATE SLOT */
  const updateSlot = (horarioId, diaId, field, value) => {
    setGrade(prev => {
      const exists = prev.find(
        g => g.horario_id === horarioId && g.dia_semana_id === diaId
      );

      if (!exists) {
        return [
          ...prev,
          {
            horario_id: horarioId,
            dia_semana_id: diaId,
            disciplina_id: null,
            professor_id: null,
            departamento_id: null,
            [field]: value,
          },
        ];
      }

      return prev.map(g =>
        g.horario_id === horarioId && g.dia_semana_id === diaId
          ? { ...g, [field]: value }
          : g
      );
    });
  };

  /* SAVE */
  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      return message.warning("Selecione os filtros");
    }

    const slots = grade.filter(g => g.disciplina_id);

    if (!slots.length) {
      return message.warning("Nenhuma disciplina selecionada");
    }

    setSaving(true);

    try {
      await api.post("/grade-horaria/save", {
        contexto: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId,
        },
        slots,
      });

      message.success("Grade salva com sucesso");
      loadGrade();

    } catch (err) {
      message.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  /* DELETE */
  const handleDeleteGrade = async () => {
    try {
      await api.delete("/grade-horaria/delete", {
        data: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
      });

      setGrade([]);
      message.success("Grade excluída");

    } catch {
      message.error("Erro ao excluir");
    }
  };

  /* PDF */
  const handlePDF = async () => {
    try {
      const response = await api.get("/api/relatorio-grade/pdf", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
        },
        responseType: "blob",
      });

      const file = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);
      window.open(url);

    } catch {
      message.error("Erro ao gerar PDF");
    }
  };

  /* COLUMNS */
  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 85,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      onCell: () => ({ style: horarioCellStyle }),
      render: text => (
        <div style={{ color: "#fff", fontWeight: 700, fontSize: 12 }}>
          {text}
        </div>
      ),
    },

    ...diasFixos.map(dia => ({
      title: dia.nome,
      width: 380,
      align: "center",
      onHeaderCell: () => ({ style: headerStyle }),

      render: (_, record) => {

        const item = grade.find(
          g =>
            g.horario_id === record.id &&
            g.dia_semana_id === dia.id
        ) || {
          horario_id: record.id,
          dia_semana_id: dia.id,
          disciplina_id: null,
          professor_id: null,
          departamento_id: null,
        };

        return (
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, minHeight: 180 }}>

            <Select
              allowClear
              placeholder="Disciplina"
              value={item.disciplina_id}
              onChange={v => updateSlot(record.id, dia.id, "disciplina_id", v)}
              options={disciplinas.map(d => ({
                value: d.id,
                label: `${d.codigo} - ${d.nome}`,
              }))}
            />

            {item.disciplina_id && (
              <>
                <Select
                  allowClear
                  placeholder="Professor"
                  value={item.professor_id}
                  onChange={v => updateSlot(record.id, dia.id, "professor_id", v)}
                  options={professores.map(p => ({
                    value: p.id,
                    label: p.nome,
                  }))}
                />

                <Select
                  allowClear
                  placeholder="Departamento"
                  value={item.departamento_id}
                  onChange={v => updateSlot(record.id, dia.id, "departamento_id", v)}
                  options={departamentos.map(d => ({
                    value: d.id,
                    label: `${d.sigla} - ${d.nome}`,
                  }))}
                />
              </>
            )}

          </div>
        );
      },
    })),
  ];

  return (
    <ConfigProvider theme={{ token: { colorPrimary: THEME.primary } }}>
      <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", flexWrap: "wrap" }}>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Select placeholder="Curso" value={cursoId} onChange={setCursoId} style={{ width: 220 }} options={cursos.map(c => ({ value: c.id, label: c.nome }))} />
            <Select placeholder="Currículo" value={curriculoId} onChange={setCurriculoId} style={{ width: 220 }} options={curriculos.map(c => ({ value: c.id, label: c.descricao || c.nome }))} />
            <Select placeholder="Ano" value={anoId} onChange={setAnoId} style={{ width: 140 }} options={anos.map(a => ({ value: a.id, label: a.descricao }))} />
            <Select placeholder="Semestre" value={semestreId} onChange={setSemestreId} style={{ width: 140 }} options={semestres.map(s => ({ value: s.id, label: s.descricao }))} />
            <Select placeholder="Coordenador" value={coordenadorId} onChange={setCoordenadorId} style={{ width: 220 }} options={coordenadores.map(c => ({ value: c.id, label: c.nome }))} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>Salvar</Button>
            <Button icon={<FilePdfOutlined />} onClick={handlePDF}>PDF</Button>
            <Button danger onClick={handleDeleteGrade}>Excluir Grade</Button>
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()} />
          </div>

        </div>

        <Table
          rowKey="id"
          dataSource={horarios}
          columns={columns}
          pagination={false}
          bordered
          size="small"
          sticky
          scroll={{ x: 1900, y: "calc(100vh - 120px)" }}
        />

      </div>
    </ConfigProvider>
  );
}