import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Input, Button, message, ConfigProvider, Typography } from "antd";
import { SaveOutlined, FilePdfOutlined, ReloadOutlined } from "@ant-design/icons";
import { api, getUsuarioLogado } from "../services/api";

const { Text } = Typography;

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  borderColor: "#e5e7eb",
  separatorColor: "#cbd5e1",
};

const paletaPastelSuave = [
  "#FFF6DF", "#F9EBCF", "#F3DDB5", "#EBD3A9", "#F8D8C2", 
  "#F2C6B5", "#F2D5D5", "#EBD9E8", "#DED7ED", "#D4DDF0", 
  "#C9DFED", "#C4DDE3", "#B3E5FC", "#BBDEFB", "#D0E8F2", "#E2E1DC"
];

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "8px 2px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const horarioCellStyle = {
  backgroundColor: "#f9fafb",
  color: THEME.primary,
  fontWeight: "700",
  textAlign: "center",
  fontSize: "13px",
  padding: "4px 2px",
  borderRight: `2px solid ${THEME.separatorColor}`,
  borderBottom: `1px solid ${THEME.separatorColor}`
};

const filtroContainerStyle = { display: "flex", flexDirection: "column", gap: 1 };
const filtroLabelStyle = { fontSize: "11px", fontWeight: 700, color: THEME.primary, marginBottom: "1px" };

export default function GradeTabela() {
  const usuario = getUsuarioLogado();

  const [cursos, setCursos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [curriculos, setCurriculos] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [horariosOriginais, setHorariosOriginais] = useState([]);
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

  const canEdit = useMemo(() => {
    if (!usuario) return false;
    const role = (usuario.role || "").toLowerCase();
    
    if (role.includes("admin") || role.includes("edicao") || role.includes("editor")) return true;

    if (role.includes("coordenador") && cursoId) {
      const cursoSelecionado = cursos.find(c => Number(c.id) === Number(cursoId));
      if (cursoSelecionado && Number(cursoSelecionado.coordenador_id) === Number(usuario.pessoa_id)) {
        return true;
      }
    }
    return false;
  }, [usuario, cursoId, cursos]);

  const canDelete = canEdit;

  const diasFixos = [
    { id: 1, nome: "SEGUNDA" },
    { id: 2, nome: "TERÇA" },
    { id: 3, nome: "QUARTA" },
    { id: 4, nome: "QUINTA" },
    { id: 5, nome: "SEXTA" },
    { id: 6, nome: "SÁBADO" }
  ];

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [
        cursosRes, anosRes, semestresRes, curriculosRes, horariosRes,
        professoresRes, coordenadoresRes, departamentosRes
      ] = await Promise.all([
        api.get("/cursos"), api.get("/anos"), api.get("/semestres"), api.get("/curriculos"), api.get("/horarios"),
        api.get("/pessoas/professores"), api.get("/pessoas/coordenadores"), api.get("/departamentos")
      ]);

      setCursos(cursosRes.data || []);
      setAnos(anosRes.data || []);
      setSemestres(semestresRes.data || []);
      setCurriculos(curriculosRes.data || []);
      setProfessores(professoresRes.data || []);
      setCoordenadores(coordenadoresRes.data || []);
      setDepartamentos(departamentosRes.data || []);

      const horariosOrdenados = (horariosRes.data || []).sort((a, b) => a.id - b.id);
      setHorarios(horariosOrdenados);
      setHorariosOriginais(JSON.parse(JSON.stringify(horariosOrdenados)));
    } catch {
      message.error("Erro ao carregar dados iniciais");
    }
  };

  // Carrega disciplinas quando curso, semestre ou currículo mudam
  useEffect(() => {
    if (!cursoId || !semestreId) {
      setDisciplinas([]);
      return;
    }

    api.get(`/cursos/${cursoId}/disciplinas`, {
      params: {
        semestre_id: semestreId,
        curriculo_id: curriculoId 
      }
    })
      .then((res) => setDisciplinas(res.data || []))
      .catch(() => setDisciplinas([]));
  }, [cursoId, semestreId, curriculoId]); 

  // Carrega a grade horária ao preencher todos os filtros obrigatórios
  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) { setGrade([]); return; }
    loadGrade();
  }, [cursoId, anoId, semestreId, curriculoId]);

  const loadGrade = async () => {
    try {
      const response = await api.get("/grade-horaria", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId
        }
      });
      setGrade(response.data || []);

      // Atualiza o coordenador com base nos dados salvos ou no próprio cadastro do curso
      if (response.data?.length > 0 && response.data[0].coordenador_id) {
        setCoordenadorId(Number(response.data[0].coordenador_id));
      } else {
        const cursoSelecionado = cursos.find((c) => Number(c.id) === Number(cursoId));
        if (cursoSelecionado && cursoSelecionado.coordenador_id) {
          setCoordenadorId(Number(cursoSelecionado.coordenador_id));
        } else {
          setCoordenadorId(null);
        }
      }
    } catch {
      setGrade([]);
      message.error("Erro ao carregar grade");
    }
  };

  const gradeMap = useMemo(() => {
    const map = {};
    grade.forEach((g) => { map[`${g.horario_id}-${g.dia_semana_id}`] = g; });
    return map;
  }, [grade]);

  const disciplinasMap = useMemo(() => {
    const map = {};
    disciplinas.forEach((d) => { map[d.id] = d; });
    
    grade.forEach((g) => {
      if (g.disciplina && g.disciplina.id) {
        map[g.disciplina.id] = g.disciplina;
      }
    });
    return map;
  }, [disciplinas, grade]);

  const getDepartamentoCor = (depId) => {
    if (!depId) return null;
    const dep = departamentos.find((d) => Number(d.id) === Number(depId));
    if (dep?.cor) return dep.cor;
    if (dep?.cor_hex) return dep.cor_hex;
    if (dep?.color) return dep.color;
    return paletaPastelSuave[Number(depId) % paletaPastelSuave.length];
  };

  const updateSlot = (horarioId, diaId, field, value) => {
    if (!canEdit) return;

    setGrade((prev) => {
      const exists = prev.find(
        (g) => Number(g.horario_id) === Number(horarioId) && Number(g.dia_semana_id) === Number(diaId)
      );

      let novoSlot = exists
        ? { ...exists, [field]: value }
        : {
            horario_id: horarioId,
            dia_semana_id: diaId,
            disciplina_id: null,
            professor_id: null,
            departamento_id: null,
            turma: "",
            [field]: value
          };

      if (field === "disciplina_id") {
        if (value) {
          const disciplinaSelecionada = disciplinasMap[Number(value)];
          if (disciplinaSelecionada) {
            const depId = disciplinaSelecionada.departamento_id || disciplinaSelecionada.departamento?.id || null;
            novoSlot.departamento_id = depId ? Number(depId) : null;
          }
        } else {
          novoSlot.departamento_id = null;
          novoSlot.professor_id = null;
          novoSlot.turma = "";
        }
      }

      if (!exists) return [...prev, novoSlot];
      return prev.map((g) =>
        Number(g.horario_id) === Number(horarioId) && Number(g.dia_semana_id) === Number(diaId) ? novoSlot : g
      );
    });
  };

  const updateHorario = (oldHorarioId, newHorarioId) => {
    if (!canEdit || oldHorarioId === newHorarioId) return;
    const horariosAtualizados = [...horarios];
    const oldIndex = horariosAtualizados.findIndex((h) => Number(h.id) === Number(oldHorarioId));
    const newIndex = horariosAtualizados.findIndex((h) => Number(h.id) === Number(newHorarioId));
    if (oldIndex === -1 || newIndex === -1) return;

    const temp = horariosAtualizados[oldIndex];
    horariosAtualizados[oldIndex] = horariosAtualizados[newIndex];
    horariosAtualizados[newIndex] = temp;
    setHorarios(horariosAtualizados);
  };

  // CORREÇÃO: Limpeza de filtros dependentes e comparação numérica correta
  const handleCursoChange = (value) => {
    setCursoId(value);
    const cursoSelecionado = cursos.find((c) => Number(c.id) === Number(value));
    if (cursoSelecionado && cursoSelecionado.coordenador_id) {
      setCoordenadorId(Number(cursoSelecionado.coordenador_id));
    } else {
      setCoordenadorId(null);
    }
    // Reseta currículo e semestre para evitar buscas com IDs inválidos do curso anterior
    setCurriculoId(null);
    setSemestreId(null);
  };

  const handleReset = () => {
    setCursoId(null); setAnoId(null); setSemestreId(null); setCurriculoId(null); setCoordenadorId(null);
    setGrade([]); setDisciplinas([]);
    const horariosResetados = JSON.parse(JSON.stringify(horariosOriginais));
    horariosResetados.sort((a, b) => a.id - b.id);
    setHorarios(horariosResetados);
    message.success("Página redefinida");
  };

  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return message.warning("Selecione os filtros");

    const slots = grade.filter((g) => g.disciplina_id || g.id);

    setSaving(true);
    try {
      await api.post("/grade-horaria/save", {
        contexto: { curso_id: cursoId, ano_id: anoId, semestre_id: semestreId, curriculo_id: curriculoId, coordenador_id: coordenadorId },
        slots
      });
      message.success("Grade salva com sucesso");
      loadGrade();
    } catch {
      message.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      return message.warning("Selecione todos os filtros antes de excluir");
    }
    try {
      await api.delete("/grade-horaria/delete", {
        data: { curso_id: cursoId, ano_id: anoId, semestre_id: semestreId, curriculo_id: curriculoId }
      });
      setGrade([]);
      message.success("Grade excluída");
    } catch {
      message.error("Erro ao excluir");
    }
  };

  const handlePDF = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      return message.warning("Selecione todos os filtros superiores antes de gerar o PDF");
    }

    try {
      message.loading({ content: "Gerando documento...", key: "pdfLoading" });

      const coordObj = coordenadores.find(c => Number(c.id) === Number(coordenadorId));
      const coordenadorNome = coordObj ? coordObj.nome : "-";

      const response = await api.get("/api/relatorio-grade/pdf", {
        params: {
          curso_id: cursoId,
          ano_id: anoId,
          semestre_id: semestreId,
          curriculo_id: curriculoId,
          coordenador_id: coordenadorId,
          coordenador_nome: coordenadorNome
        },
        responseType: "blob"
      });

      const file = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(file);

      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = `grade_horaria_${cursoId}_${anoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success({ content: "PDF gerado com sucesso!", key: "pdfLoading" });
    } catch (err) {
      console.error("Erro PDF:", err);
      message.error({ content: "Erro ao gerar PDF. Certifique-se de que há dados salvos.", key: "pdfLoading" });
    }
  };

  const columns = [
    {
      title: "HORÁRIO", dataIndex: "descricao", width: 110, fixed: "left", align: "center",
      onHeaderCell: () => ({ style: { ...headerStyle, borderRight: `2px solid ${THEME.separatorColor}` } }),
      onCell: () => ({ style: horarioCellStyle }),
      render: (_, record) => (
        <Select
          size="middle" variant="borderless" value={record.id}
          disabled={!canEdit}
          style={{ width: "100%", fontSize: "13px", fontWeight: "700" }}
          onChange={(v) => updateHorario(record.id, v)}
          options={horarios.map((h) => ({ value: h.id, label: h.descricao }))}
        />
      ),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome, width: 240, align: "center",
      onHeaderCell: () => ({ style: { ...headerStyle, borderRight: `1px solid ${THEME.separatorColor}` } }),
      render: (_, record) => {
        const item = gradeMap[`${record.id}-${dia.id}`] || { horario_id: record.id, dia_semana_id: dia.id };
        const depCor = getDepartamentoCor(item.departamento_id);

        return (
          <div
            style={{
              padding: "8px 5px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minHeight: 145,
              backgroundColor: item.disciplina_id ? (depCor ? `${depCor}25` : "#fff") : "transparent",
              borderLeft: depCor ? `4px solid ${depCor}` : "none",
              borderRight: `1px solid ${THEME.separatorColor}`,
              borderBottom: `1px solid ${THEME.separatorColor}`,
              transition: "all 0.2s ease"
            }}
          >
            <Select
              size="middle" allowClear showSearch optionFilterProp="label" placeholder="Disciplina"
              value={item.disciplina_id ? Number(item.disciplina_id) : null}
              disabled={!canEdit}
              onChange={(v) => updateSlot(record.id, dia.id, "disciplina_id", v)}
              style={{ width: "100%", fontSize: "12px" }}
              options={Object.values(disciplinasMap).map((d) => ({
                value: Number(d.id),
                label: `${d.codigo ? d.codigo + ' - ' : ''}${d.nome}`
              }))}
            />
            {item.disciplina_id && (
              <>
                <div style={{ height: 28, width: "100%", border: `1px solid ${THEME.borderColor}`, borderRadius: 4, backgroundColor: "#f9fafb", padding: "0 8px", display: "flex", alignItems: "center", boxSizing: "border-box", fontSize: "12px", color: "rgba(0,0,0,0.88)" }}>
                  <span style={{ color: "rgba(0,0,0,0.45)", marginRight: 4 }}>Carga Horária:</span>
                  <span style={{ fontWeight: 600 }}>{disciplinasMap[item.disciplina_id]?.carga_horaria ?? 0}h</span>
                </div>

                <Input
                  size="middle"
                  placeholder="Escreva a Turma (Ex: A)"
                  value={item.turma}
                  disabled={!canEdit}
                  onChange={(e) => updateSlot(record.id, dia.id, "turma", e.target.value.toUpperCase())}
                  style={{ width: "100%", fontSize: "12px" }}
                />

                <Select
                  size="middle" allowClear showSearch placeholder="Professor"
                  value={item.professor_id ? Number(item.professor_id) : null}
                  disabled={!canEdit}
                  onChange={(v) => updateSlot(record.id, dia.id, "professor_id", v)}
                  style={{ width: "100%", fontSize: "12px" }}
                  options={professores.map((p) => ({ value: Number(p.id), label: p.nome }))}
                />
                <Select
                  size="middle" allowClear placeholder="Departamento"
                  value={item.departamento_id ? Number(item.departamento_id) : null}
                  disabled={!canEdit}
                  onChange={(v) => updateSlot(record.id, dia.id, "departamento_id", v)}
                  style={{ width: "100%", fontSize: "12px" }}
                  options={departamentos.map((d) => {
                    const color = getDepartamentoCor(d.id);
                    return {
                      value: Number(d.id),
                      label: (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              backgroundColor: color,
                              display: "inline-block",
                              flexShrink: 0
                            }}
                          />
                          <span>{`${d.sigla || ''} - ${d.nome}`}</span>
                        </div>
                      )
                    };
                  })}
                />
              </>
            )}
          </div>
        );
      },
    })),
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: THEME.primary,
          borderRadius: 6,
          colorBorder: THEME.borderColor,
          colorTextDisabled: "#000000",
        },
        components: {
          Table: {
            headerBg: THEME.bgHeader,
            headerColor: THEME.textWhite,
            borderColor: THEME.borderColor,
            cellPaddingInline: 0,
            cellPaddingBlock: 0
          },
          Select: {
            fontSize: 12,
            colorTextDisabled: "#000000",
            colorBgContainerDisabled: "#f5f5f5"
          },
          Input: {
            fontSize: 12,
            colorTextDisabled: "#000000",
            colorBgContainerDisabled: "#f5f5f5"
          }
        }
      }}
    >
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f3f4f6", padding: "12px", gap: "12px" }}>
        
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12, background: "#fff", borderRadius: "8px", border: `1px solid ${THEME.borderColor}`, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>

              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>CURSO</span>
                <Select
                  size="middle"
                  value={cursoId ? Number(cursoId) : null}  
                  onChange={handleCursoChange}
                  style={{ width: 180 }}
                  options={cursos.map((c) => ({ value: Number(c.id), label: c.nome }))}
                />
              </div>

              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>CURRÍCULO</span><Select size="middle" value={curriculoId ? Number(curriculoId) : null} onChange={setCurriculoId} style={{ width: 170 }} options={curriculos.map((c) => ({ value: Number(c.id), label: c.descricao || c.nome }))} /></div>
              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>ANO</span><Select size="middle" value={anoId ? Number(anoId) : null} onChange={setAnoId} style={{ width: 90 }} options={anos.map((a) => ({ value: Number(a.id), label: a.descricao || a.ano }))} /></div>
              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>SEMESTRE</span><Select size="middle" value={semestreId ? Number(semestreId) : null} onChange={setSemestreId} placeholder="Selecione" style={{ width: 150 }} options={semestres.map((s) => ({ value: Number(s.id), label: s.descricao || s.nome }))} /></div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {canEdit && <Button size="middle" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ fontWeight: 600 }}>Salvar</Button>}
              <Button size="middle" icon={<FilePdfOutlined />} onClick={handlePDF}>PDF</Button>
              {canEdit && <Button size="middle" icon={<ReloadOutlined />} onClick={handleReset}>Redefinir</Button>}
              {canDelete && <Button size="middle" danger onClick={handleDeleteGrade}>Excluir</Button>}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: "8px", border: `1px solid ${THEME.borderColor}`, overflow: "hidden" }}>
          <Table rowKey={(record) => record.id} dataSource={horarios} columns={columns} pagination={false} bordered size="middle" sticky scroll={{ x: 1550, y: "calc(100vh - 180px)" }} />
        </div>
      </div>
    </ConfigProvider>
  );
}