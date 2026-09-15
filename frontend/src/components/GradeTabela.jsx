import React, { useEffect, useMemo, useState } from "react";
import { Table, Select, Input, Button, message, ConfigProvider, Typography, Tooltip, Popconfirm } from "antd";
import { SaveOutlined, FilePdfOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { api, getUsuarioLogado } from "../services/api";

const { Text } = Typography;

const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  gridBorderColor: "#94a3b8", // Bordas visíveis apenas para as linhas e colunas da tabela
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
              minHeight: 105,
              padding: "6px",
              gap: 5,
              boxSizing: "border-box",
              backgroundColor: hasMultiple ? "#f8fafc" : "transparent"
            }}
          >
            {displayItems.map((item, idx) => {
              const depCor = getDepartamentoCor(item.departamento_id);
              const disciplinaObj = disciplinasMap[item.disciplina_id];

              return (
                <div
                  key={idx}
                  style={{
                    width: "100%",
                    padding: "5px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    backgroundColor: item.disciplina_id ? "#ffffff" : "#fafafa",
                    borderRadius: 4,
                    border: `1px solid ${depCor ? `${depCor}40` : "#e2e8f0"}`,
                    borderLeft: `3px solid ${depCor || "#cbd5e1"}`,
                    boxShadow: item.disciplina_id ? "0 1px 2px rgba(0,0,0,0.03)" : "none",
                    boxSizing: "border-box",
                    overflow: "hidden"
                  }}
                >
                  {/* Linha 1: Indicador (#1) + Seleção da Disciplina + Popconfirm */}
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

                    {/* Confirmação anti-clique acidental */}
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
                            style={{ height: 20, width: 20, padding: 0, flexShrink: 0, opacity: 0.7 }}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </div>

                  {/* Detalhes exibidos apenas ao escolher uma disciplina */}
                  {item.disciplina_id && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
                      
                      {/* Linha 2: Turma + Carga Horária */}
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
                          padding: "1px 6px",
                          borderRadius: 3,
                          border: "1px solid #e2e8f0",
                          whiteSpace: "nowrap",
                          flexShrink: 0
                        }}>
                          {disciplinaObj?.carga_horaria ?? 0}h
                        </div>
                      </div>

                      {/* Linha 3: Professor */}
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

                      {/* Linha 4: Departamento */}
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

            {/* Botão para adicionar aula simultânea */}
            {canEdit && (
              <Button
                type="text"
                size="small"
                block
                icon={<PlusOutlined style={{ fontSize: "9px" }} />}
                onClick={() => addSlotItem(record.id, dia.id)}
                style={{
                  fontSize: "10px",
                  height: 20,
                  color: "#94a3b8",
                  border: "1px dashed #e2e8f0",
                  borderRadius: 4,
                  marginTop: "auto",
                  padding: "0 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                Simultânea
              </Button>
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
          borderRadius: 4,
          colorTextDisabled: "#334155",
        },
        components: {
          Table: {
            headerBg: THEME.bgHeader,
            headerColor: THEME.textWhite,
            borderColor: THEME.gridBorderColor, // Bordas aplicadas unicamente na tabela
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
        
        {/* Filtros Superiores Limpos (Sem borda destacada) */}
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
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {canEdit && <Button size="middle" type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave} style={{ fontWeight: 600 }}>Salvar</Button>}
              <Button size="middle" icon={<FilePdfOutlined />} onClick={handlePDF}>PDF</Button>
              {canEdit && <Button size="middle" icon={<ReloadOutlined />} onClick={handleReset}>Redefinir</Button>}
              {canDelete && <Button size="middle" danger onClick={handleDeleteGrade}>Excluir</Button>}
            </div>
          </div>
        </div>

        {/* Tabela de Grade Horária com Bordas Marcadas */}
        <div style={{ flex: 1, background: "#fff", borderRadius: "6px", border: `1px solid ${THEME.gridBorderColor}`, overflow: "hidden" }}>
          <Table rowKey={(record) => record.id} dataSource={horarios} columns={columns} pagination={false} bordered size="middle" sticky scroll={{ x: 2000, y: "calc(100vh - 165px)" }} />
        </div>
      </div>
    </ConfigProvider>
  );
}