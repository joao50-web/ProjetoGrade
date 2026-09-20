import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Input, Button, message, ConfigProvider, Tooltip, Popconfirm } from "antd";
import { SaveOutlined, FilePdfOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { api, getUsuarioLogado } from "../services/api";

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  gridBorderColor: "#94a3b8",
};

const paletaPastelSuave = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899",
  "#06b6d4", "#84cc16", "#f97316", "#6366f1", "#14b8a6"
];

const headerStyle = {
  backgroundColor: THEME.bgHeader,
  color: THEME.textWhite,
  fontWeight: "700",
  fontSize: "12px",
  textAlign: "center",
  padding: "10px 4px",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const horarioCellStyle = {
  backgroundColor: "#f8fafc",
  color: THEME.primary,
  fontWeight: "700",
  textAlign: "center",
  fontSize: "12px",
  padding: "6px 4px"
};

const filtroContainerStyle = { display: "flex", flexDirection: "column", gap: 2 };
const filtroLabelStyle = { fontSize: "11px", fontWeight: 700, color: THEME.primary };

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
  const [loadingPDF, setLoadingPDF] = useState(false);

  const [cursoId, setCursoId] = useState(null);
  const [anoId, setAnoId] = useState(null);
  const [semestreId, setSemestreId] = useState(null);
  const [curriculoId, setCurriculoId] = useState(null);
  const [coordenadorId, setCoordenadorId] = useState(null);
  const [turmaGrade, setTurmaGrade] = useState("");

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

  useEffect(() => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) { setGrade([]); setTurmaGrade(""); return; }
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
      const data = response.data || [];
      setGrade(data);

      if (data.length > 0) {
        if (data[0].coordenador_id) setCoordenadorId(Number(data[0].coordenador_id));
        setTurmaGrade(data[0].turma_grade || "");
      } else {
        const cursoSelecionado = cursos.find((c) => Number(c.id) === Number(cursoId));
        setCoordenadorId(cursoSelecionado?.coordenador_id ? Number(cursoSelecionado.coordenador_id) : null);
        setTurmaGrade("");
      }
    } catch {
      setGrade([]);
      setTurmaGrade("");
      message.error("Erro ao carregar grade");
    }
  };

  const gradeMap = useMemo(() => {
    const map = {};
    grade.forEach((g) => {
      const key = `${g.horario_id}-${g.dia_semana_id}`;
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
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

  const updateSlotItem = (horarioId, diaId, itemIndex, field, value) => {
    if (!canEdit) return;

    setGrade((prev) => {
      const matches = prev.filter(
        (g) => Number(g.horario_id) === Number(horarioId) && Number(g.dia_semana_id) === Number(diaId)
      );

      if (matches.length <= itemIndex) {
        let newItem = {
          horario_id: horarioId,
          dia_semana_id: diaId,
          disciplina_id: null,
          professor_id: null,
          departamento_id: null,
          turma: "",
          [field]: value
        };

        if (field === "disciplina_id" && value) {
          const disciplinaSelecionada = disciplinasMap[Number(value)];
          if (disciplinaSelecionada) {
            const depId = disciplinaSelecionada.departamento_id || disciplinaSelecionada.departamento?.id || null;
            newItem.departamento_id = depId ? Number(depId) : null;
          }
        }

        return [...prev, newItem];
      }

      let currentCellCount = 0;
      return prev.map((g) => {
        if (Number(g.horario_id) === Number(horarioId) && Number(g.dia_semana_id) === Number(diaId)) {
          if (currentCellCount === itemIndex) {
            currentCellCount++;
            let updated = { ...g, [field]: value };

            if (field === "disciplina_id") {
              if (value) {
                const disciplinaSelecionada = disciplinasMap[Number(value)];
                if (disciplinaSelecionada) {
                  const depId = disciplinaSelecionada.departamento_id || disciplinaSelecionada.departamento?.id || null;
                  updated.departamento_id = depId ? Number(depId) : null;
                }
              } else {
                updated.departamento_id = null;
                updated.professor_id = null;
                updated.turma = "";
              }
            }
            return updated;
          }
          currentCellCount++;
        }
        return g;
      });
    });
  };

  const addSlotItem = (horarioId, diaId) => {
    if (!canEdit) return;
    setGrade((prev) => [
      ...prev,
      {
        horario_id: horarioId,
        dia_semana_id: diaId,
        disciplina_id: null,
        professor_id: null,
        departamento_id: null,
        turma: ""
      }
    ]);
  };

  const removeSlotItem = (horarioId, diaId, itemIndex) => {
    if (!canEdit) return;
    setGrade((prev) => {
      let currentCellCount = 0;
      return prev.filter((g) => {
        if (Number(g.horario_id) === Number(horarioId) && Number(g.dia_semana_id) === Number(diaId)) {
          const isTarget = currentCellCount === itemIndex;
          currentCellCount++;
          return !isTarget;
        }
        return true;
      });
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

  const handleCursoChange = (value) => {
    setCursoId(value);
    const cursoSelecionado = cursos.find((c) => Number(c.id) === Number(value));
    if (cursoSelecionado && cursoSelecionado.coordenador_id) {
      setCoordenadorId(Number(cursoSelecionado.coordenador_id));
    } else {
      setCoordenadorId(null);
    }
    setCurriculoId(null);
    setSemestreId(null);
    setTurmaGrade("");
  };

  const handleReset = () => {
    setCursoId(null); setAnoId(null); setSemestreId(null); setCurriculoId(null); setCoordenadorId(null); setTurmaGrade("");
    setGrade([]); setDisciplinas([]);
    const horariosResetados = JSON.parse(JSON.stringify(horariosOriginais));
    horariosResetados.sort((a, b) => a.id - b.id);
    setHorarios(horariosResetados);
    message.success("Página redefinida");
  };

  const handleSave = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) return message.warning("Selecione os filtros");

    const slots = grade
      .filter((g) => g.horario_id && g.dia_semana_id)
      .map((g) => ({ ...g, turma_grade: turmaGrade }));

    setSaving(true);
    try {
      await api.post("/grade-horaria/save", {
        contexto: { curso_id: cursoId, ano_id: anoId, semestre_id: semestreId, curriculo_id: curriculoId, coordenador_id: coordenadorId, turma_grade: turmaGrade },
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
      setTurmaGrade("");
      message.success("Grade excluída");
    } catch {
      message.error("Erro ao excluir");
    }
  };

  const handlePDF = async () => {
    if (!cursoId || !anoId || !semestreId || !curriculoId) {
      return message.warning("Selecione os filtros (Curso, Currículo, Ano e Semestre) para gerar o PDF.");
    }

    const pdfWindow = window.open("", "_blank");

    if (!pdfWindow) {
      return message.error("O navegador bloqueou o PDF. Permita popups para este site.");
    }

    pdfWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head><meta charset="UTF-8" /><title>Gerando PDF</title></head>
        <body style="font-family: Arial, sans-serif; padding: 30px;">
          Gerando PDF, aguarde...
        </body>
      </html>
    `);
    pdfWindow.document.close();

    try {
      setLoadingPDF(true);
      const response = await api.get("/grade-horaria/pdf", {
        params: {
          curso_id: Number(cursoId),
          ano_id: Number(anoId),
          semestre_id: Number(semestreId),
          curriculo_id: Number(curriculoId),
          coordenador_id: coordenadorId ? Number(coordenadorId) : undefined,
          turma_grade: turmaGrade || undefined,
        },
        responseType: "blob",
      });

      const contentType = String(response.headers?.["content-type"] || "").toLowerCase();
      const blob = new Blob([response.data], { type: contentType || "application/pdf" });

      if (!contentType.includes("application/pdf")) {
        const resposta = await blob.text();
        console.error("O servidor não retornou PDF:", resposta);
        throw new Error("A resposta do servidor não é um PDF.");
      }

      if (!blob.size) {
        throw new Error("O PDF retornado está vazio.");
      }

      const url = window.URL.createObjectURL(blob);
      pdfWindow.location.href = url;

      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err) {
      console.error("Erro ao carregar PDF:", err);
      pdfWindow.close();
      message.error("Erro ao gerar PDF. Verifique o console e o backend.");
    } finally {
      setLoadingPDF(false);
    }
  };

  const columns = [
    {
      title: "HORÁRIO", dataIndex: "descricao", width: 110, fixed: "left", align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      onCell: () => ({ style: horarioCellStyle }),
      render: (_, record) => (
        <Select
          size="small" variant="borderless" value={record.id}
          disabled={!canEdit}
          style={{ width: "100%", fontSize: "12px", fontWeight: "700" }}
          onChange={(v) => updateHorario(record.id, v)}
          options={horarios.map((h) => ({ value: h.id, label: h.descricao }))}
        />
      ),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome, width: 310, align: "center",
      onHeaderCell: () => ({ style: headerStyle }),
      render: (_, record) => {
        const cellItems = gradeMap[`${record.id}-${dia.id}`] || [];
        const displayItems = cellItems.length > 0
          ? cellItems
          : (canEdit ? [{ horario_id: record.id, dia_semana_id: dia.id, disciplina_id: null, turma: "", professor_id: null, departamento_id: null }] : []);

        const hasMultiple = displayItems.length > 1;

        return (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              minHeight: 90,
              padding: "4px",
              paddingBottom: canEdit ? "22px" : "4px",
              gap: 4,
              boxSizing: "border-box",
              backgroundColor: hasMultiple ? "#f8fafc" : "transparent",
              position: "relative"
            }}
          >
            {canEdit && (
              <Tooltip title="Adicionar disciplina simultânea">
                <Button
                  type="text"
                  size="small"
                  icon={<PlusOutlined style={{ fontSize: "10px" }} />}
                  onClick={() => addSlotItem(record.id, dia.id)}
                  style={{
                    position: "absolute",
                    bottom: 3,
                    right: 3,
                    height: 18,
                    width: 18,
                    minWidth: 18,
                    padding: 0,
                    color: "#64748b",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    zIndex: 2,
                    opacity: 0.85
                  }}
                />
              </Tooltip>
            )}

            {displayItems.map((item, idx) => {
              const depCor = getDepartamentoCor(item.departamento_id);
              const disciplinaObj = disciplinasMap[item.disciplina_id];

              return (
                <div
                  key={idx}
                  style={{
                    width: "100%",
                    padding: "4px 5px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    backgroundColor: item.disciplina_id ? "#ffffff" : "#fafafa",
                    borderRadius: 4,
                    border: `1px solid ${depCor ? `${depCor}40` : "#e2e8f0"}`,
                    borderLeft: `3px solid ${depCor || "#cbd5e1"}`,
                    boxShadow: item.disciplina_id ? "0 1px 2px rgba(0,0,0,0.03)" : "none",
                    boxSizing: "border-box",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
                    {hasMultiple && (
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", flexShrink: 0 }}>
                        #{idx + 1}
                      </span>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Select
                        size="small" allowClear showSearch optionFilterProp="label" placeholder="Disciplina..."
                        value={item.disciplina_id ? Number(item.disciplina_id) : null}
                        disabled={!canEdit}
                        onChange={(v) => updateSlotItem(record.id, dia.id, idx, "disciplina_id", v)}
                        style={{ width: "100%", fontSize: "11px" }}
                        popupMatchSelectWidth={false}
                        options={Object.values(disciplinasMap).map((d) => ({
                          value: Number(d.id),
                          label: `${d.codigo ? d.codigo + ' - ' : ''}${d.nome}`
                        }))}
                      />
                    </div>

                    {canEdit && (item.disciplina_id || hasMultiple) && (
                      <Popconfirm
                        title="Remover disciplina"
                        description="Tem certeza que deseja remover esta disciplina do horário?"
                        onConfirm={() => removeSlotItem(record.id, dia.id, idx)}
                        okText="Sim"
                        cancelText="Não"
                        okButtonProps={{ danger: true, size: "small" }}
                        cancelButtonProps={{ size: "small" }}
                        icon={<QuestionCircleOutlined style={{ color: "#ef4444" }} />}
                      >
                        <Tooltip title="Remover disciplina">
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<DeleteOutlined style={{ fontSize: "11px" }} />}
                            style={{ height: 18, width: 18, minWidth: 18, padding: 0, flexShrink: 0, opacity: 0.7 }}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </div>

                  {item.disciplina_id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, width: "100%" }}>
                        <Input
                          size="small"
                          placeholder="Turma (ex: TA)"
                          value={item.turma}
                          disabled={!canEdit}
                          onChange={(e) => updateSlotItem(record.id, dia.id, idx, "turma", e.target.value.toUpperCase())}
                          style={{ flex: 1, fontSize: "11px", minWidth: 0 }}
                        />
                        <div style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: "#64748b",
                          backgroundColor: "#f8fafc",
                          padding: "1px 5px",
                          borderRadius: 3,
                          border: "1px solid #e2e8f0",
                          whiteSpace: "nowrap",
                          flexShrink: 0
                        }}>
                          {disciplinaObj?.carga_horaria ?? 0}h
                        </div>
                      </div>

                      <div style={{ width: "100%", minWidth: 0 }}>
                        <Select
                          size="small" allowClear showSearch placeholder="Professor..."
                          value={item.professor_id ? Number(item.professor_id) : null}
                          disabled={!canEdit}
                          onChange={(v) => updateSlotItem(record.id, dia.id, idx, "professor_id", v)}
                          style={{ width: "100%", fontSize: "11px" }}
                          popupMatchSelectWidth={false}
                          options={professores.map((p) => ({ value: Number(p.id), label: p.nome }))}
                        />
                      </div>

                      <div style={{ width: "100%", minWidth: 0 }}>
                        <Select
                          size="small" allowClear placeholder="Departamento..."
                          value={item.departamento_id ? Number(item.departamento_id) : null}
                          disabled={!canEdit}
                          onChange={(v) => updateSlotItem(record.id, dia.id, idx, "departamento_id", v)}
                          style={{ width: "100%", fontSize: "11px" }}
                          popupMatchSelectWidth={false}
                          options={departamentos.map((d) => {
                            const color = getDepartamentoCor(d.id);
                            return {
                              value: Number(d.id),
                              label: (
                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                  <span
                                    style={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      backgroundColor: color,
                                      display: "inline-block",
                                      flexShrink: 0
                                    }}
                                  />
                                  <span style={{ fontSize: "11px" }}>{`${d.sigla || ''} - ${d.nome}`}</span>
                                </div>
                              )
                            };
                          })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
          borderRadius: 4,
          colorTextDisabled: "#334155",
        },
        components: {
          Table: {
            headerBg: THEME.bgHeader,
            headerColor: THEME.textWhite,
            borderColor: THEME.gridBorderColor,
            cellPaddingInline: 0,
            cellPaddingBlock: 0
          },
          Select: {
            fontSize: 11,
            colorTextDisabled: "#334155",
            colorBgContainerDisabled: "#f8fafc"
          },
          Input: {
            fontSize: 11,
            colorTextDisabled: "#334155",
            colorBgContainerDisabled: "#f8fafc"
          }
        }
      }}
    >
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#f1f5f9", padding: "10px", gap: "10px" }}>

        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10, background: "#fff", borderRadius: "6px", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

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

              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>CURRÍCULO</span><Select size="middle" value={curriculoId ? Number(curriculoId) : null} onChange={setCurriculoId} style={{ width: 160 }} options={curriculos.map((c) => ({ value: Number(c.id), label: c.descricao || c.nome }))} /></div>
              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>ANO</span><Select size="middle" value={anoId ? Number(anoId) : null} onChange={setAnoId} style={{ width: 90 }} options={anos.map((a) => ({ value: Number(a.id), label: a.descricao || a.ano }))} /></div>
              <div style={filtroContainerStyle}><span style={filtroLabelStyle}>SEMESTRE</span><Select size="middle" value={semestreId ? Number(semestreId) : null} onChange={setSemestreId} placeholder="Selecione" style={{ width: 140 }} options={semestres.map((s) => ({ value: Number(s.id), label: s.descricao || s.nome }))} /></div>
              
              <div style={filtroContainerStyle}>
                <span style={filtroLabelStyle}>TURMA DA GRADE</span>
                <Input
                  size="middle"
                  value={turmaGrade}
                  onChange={(e) => setTurmaGrade(e.target.value.toUpperCase())}
                  disabled={!canEdit}
                  placeholder="Ex: T1, A"
                  style={{ width: 120 }}
                />
              </div>

            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {canEdit && <Button size="middle" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ fontWeight: 600 }}>Salvar</Button>}
              <Button size="middle" icon={<FilePdfOutlined />} loading={loadingPDF} onClick={handlePDF}>PDF</Button>
              {canEdit && <Button size="middle" icon={<ReloadOutlined />} onClick={handleReset}>Redefinir</Button>}
              {canDelete && <Button size="middle" danger onClick={handleDeleteGrade}>Excluir</Button>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, background: "#fff", borderRadius: "6px", border: `1px solid ${THEME.gridBorderColor}`, overflow: "hidden" }}>
          <Table rowKey={(record) => record.id} dataSource={horarios} columns={columns} pagination={false} bordered size="middle" sticky scroll={{ x: 2000, y: "calc(100vh - 165px)" }} />
        </div>
      </div>
    </ConfigProvider>
  );
}