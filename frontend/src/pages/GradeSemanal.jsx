import React, { useEffect, useState, useMemo } from 'react';
import { Table, Select, Typography, message, Tooltip, Button, Space } from 'antd';
import { useLocation } from 'react-router-dom';
import { FilePdfOutlined } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';

const { Text } = Typography;

/* =========================================
   ESTILOS GERAIS DA TELA
========================================= */
const THEME = {
  primary: "#0b3d5c",
  bgHeader: "#0b3d5c",
  textWhite: "#ffffff",
  borderColor: "#e2e8f0", 
  gridLine: "#94a3b8", 
  rowOdd: "#f8fafc",
  rowEven: "#ffffff",
  tagBg: "#f1f5f9",
  tagText: "#334155" 
};

const miniGradeHeaderStyle = { 
  backgroundColor: THEME.bgHeader, 
  color: THEME.textWhite, 
  fontWeight: "600", 
  fontSize: "12px", 
  textAlign: "center", 
  padding: "10px 6px", 
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const horarioCellStyle = { 
  fontWeight: "700", 
  textAlign: "center", 
  fontSize: "12px", 
  padding: "8px 4px", 
  color: "#334155",
  backgroundColor: "#f1f5f9"
};

export default function GradeSemanal() {
  const location = useLocation();
  const initialDeptId = location.state?.departamentoId || null;

  // Estados principais
  const [departamentos, setDepartamentos] = useState([]);
  const [departamentoId, setDepartamentoId] = useState(initialDeptId);
  const [horarios, setHorarios] = useState([]);
  const [grade, setGrade] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Estados para os filtros
  const [filtroCurso, setFiltroCurso] = useState(null);
  const [filtroProfessor, setFiltroProfessor] = useState(null);

  const diasFixos = [
    { id: 1, nome: "SEG" },
    { id: 2, nome: "TER" },
    { id: 3, nome: "QUA" },
    { id: 4, nome: "QUI" },
    { id: 5, nome: "SEX" },
    { id: 6, nome: "SÁB" }
  ];

  // Busca dados base (Departamentos e Horários)
  useEffect(() => {
    api.get('/departamentos')
      .then(res => setDepartamentos(Array.isArray(res.data) ? res.data : []))
      .catch(() => message.error('Erro ao carregar departamentos.'));

    api.get("/horarios")
      .then(res => setHorarios((res.data || []).sort((a, b) => a.id - b.id)))
      .catch(() => message.error("Erro ao carregar horários"));
  }, []);

  // Busca a grade sempre que o departamento mudar
  useEffect(() => {
    if (departamentoId) {
      setLoading(true);
      setFiltroCurso(null);
      setFiltroProfessor(null);

      api.get("/grade-horaria", { params: { departamento_id: departamentoId } })
        .then(res => setGrade(res.data || []))
        .catch(() => message.error("Erro ao carregar grade"))
        .finally(() => setLoading(false));
    } else {
      setGrade([]);
      setFiltroCurso(null);
      setFiltroProfessor(null);
    }
  }, [departamentoId]);

  // Departamento selecionado
  const deptoSelecionado = useMemo(() => {
    return departamentos.find(d => d.id === departamentoId);
  }, [departamentos, departamentoId]);

  /* ======================================================
     OPÇÕES DOS FILTROS
  ====================================================== */
  const opcoesCursos = useMemo(() => {
    const cursosSet = new Set();
    grade.forEach(item => {
      const cNome = item.curso?.nome || item.curso_nome || item.curso;
      if (cNome) cursosSet.add(cNome);
    });
    return Array.from(cursosSet).sort().map(curso => ({ value: curso, label: curso }));
  }, [grade]);

  const opcoesProfessores = useMemo(() => {
    const professoresSet = new Set();
    grade.forEach(item => {
      const pNome = item.professor?.nome || item.professor_nome || item.professor;
      if (pNome) professoresSet.add(pNome);
    });
    return Array.from(professoresSet).sort().map(prof => ({ value: prof, label: prof }));
  }, [grade]);

  /* ======================================================
     MAPEAMENTO DA GRADE
  ====================================================== */
  const gradeMap = useMemo(() => {
    const map = {};
    grade.forEach((g) => {
      const cNome = g.curso?.nome || g.curso_nome || g.curso || "Curso";
      const pNome = g.professor?.nome || g.professor_nome || g.professor || "Professor";

      if (filtroCurso && cNome !== filtroCurso) return;
      if (filtroProfessor && pNome !== filtroProfessor) return;

      const key = `${g.horario_id}-${g.dia_semana_id}`;
      if (!map[key]) map[key] = [];
      map[key].push(g);
    });
    return map;
  }, [grade, filtroCurso, filtroProfessor]);

  /* ======================================================
     GERAÇÃO DO PDF
  ====================================================== */
  const handleExportPDF = () => {
    if (!departamentoId) {
      message.warning("Selecione um departamento antes de exportar o PDF.");
      return;
    }

    setExporting(true);

    const htmlTemplate = `
      <div style="box-sizing: border-box; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 8px; color: #1e293b; margin: 0; padding: 0;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h1 style="margin: 0; font-size: 12px; color: ${THEME.primary}; text-transform: uppercase; font-weight: 700;">GRADE HORÁRIA SEMANAL</h1>
          <h2 style="margin: 2px 0 0 0; font-size: 10px; color: #475569; font-weight: 500;">${deptoSelecionado?.nome || '-'} (${deptoSelecionado?.sigla || '-'})</h2>
          ${filtroCurso || filtroProfessor ? `
            <p style="margin: 4px 0 0 0; font-size: 8px; color: #64748b;">
              <strong>Filtros aplicados:</strong> ${[filtroCurso, filtroProfessor].filter(Boolean).join(' | ')}
            </p>
          ` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid ${THEME.gridLine};">
          <thead>
            <tr>
              <th style="width: 60px; background: ${THEME.primary}; color: #fff; font-weight: 600; font-size: 8px; text-align: center; padding: 4px 2px; border: 1px solid #475569;">
                HORÁRIO
              </th>
              ${diasFixos.map(d => `
                <th style="background: ${THEME.primary}; color: #fff; font-size: 8px; padding: 4px 2px; text-align: center; font-weight: 600; border: 1px solid #475569;">
                  ${d.nome}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${horarios.map((horario, hIdx) => `
              <!-- Adicionado page-break-inside e break-inside para evitar corte na quebra de página -->
              <tr style="background-color: ${hIdx % 2 === 0 ? THEME.rowEven : THEME.rowOdd}; page-break-inside: avoid; break-inside: avoid;">
                <td style="width: 60px; border: 1px solid ${THEME.gridLine}; text-align: center; padding: 4px 2px; vertical-align: middle; background-color: #f1f5f9;">
                  <span style="color: #334155; font-size: 8px; font-weight: 700;">
                    ${horario.descricao}
                  </span>
                </td>
                ${diasFixos.map(dia => {
                  const items = gradeMap[`${horario.id}-${dia.id}`] || [];
                  return `
                    <td style="border: 1px solid ${THEME.gridLine}; text-align: left; padding: 3px; vertical-align: top;">
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${items.map(item => {
                          const dNome = item.disciplina?.nome || item.disciplina_nome || "Disciplina";
                          const cNome = item.curso?.nome || item.curso_nome || item.curso || "Curso";
                          const pNome = item.professor?.nome || item.professor_nome || item.professor || "";
                          const tNome = item.turma || "";
                          return `
                            <div style="background: #ffffff; border: 1px solid ${THEME.borderColor}; border-left: 3px solid ${THEME.primary}; padding: 3px 4px; border-radius: 3px;">
                              <div style="font-weight: 700; font-size: 8px; color: #0f172a; line-height: 1.2;">${dNome}</div>
                              <div style="font-size: 7.5px; color: ${THEME.primary}; font-weight: 600; line-height: 1.2; margin-top: 1px;">${pNome}</div>
                              <div style="font-size: 7px; color: #475569; line-height: 1.2; margin-top: 2px;">
                                <strong>${cNome}</strong> ${tNome ? `<strong style="color: #0369a1;">(T: ${tNome})</strong>` : ''}
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const containerOculto = document.createElement('div');
    containerOculto.innerHTML = htmlTemplate;
    document.body.appendChild(containerOculto);

    const opt = {
      margin:       [6, 6, 6, 6], 
      filename:     `Grade_Semanal_${deptoSelecionado?.sigla || 'Depto'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      // Adicionado configuração específica para evitar quebras em linhas de tabela
      pagebreak:    { mode: ['css', 'legacy'], avoid: 'tr' } 
    };

    const executarImpressao = () => {
      window.html2pdf().set(opt).from(containerOculto).save()
        .then(() => {
          document.body.removeChild(containerOculto);
          setExporting(false);
        })
        .catch(() => {
          message.error("Erro ao gerar PDF");
          document.body.removeChild(containerOculto);
          setExporting(false);
        });
    };

    if (window.html2pdf) {
      executarImpressao();
    } else {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = executarImpressao;
      document.body.appendChild(script);
    }
  };

  /* =========================================
     COLUNAS DO ANT DESIGN
  ========================================= */
  const columns = [
    {
      title: "HORÁRIO",
      dataIndex: "descricao",
      width: 90,
      fixed: "left",
      align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      onCell: () => ({ style: horarioCellStyle }),
      render: (text) => (
        <span style={{ color: "#334155", fontSize: "12px", fontWeight: "700" }}>
          {text}
        </span>
      )
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome,
      width: 170,
      align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      render: (_, record) => {
        const items = gradeMap[`${record.id}-${dia.id}`] || [];

        if (items.length === 0) return <div style={{ minHeight: "60px" }} />;

        return (
          <div
            className="custom-scroll"
            style={{
              maxHeight: "155px", 
              overflowY: "auto",
              overflowX: "hidden",
              padding: "4px",
              display: "flex",
              flexDirection: "column",
              gap: "8px" 
            }}
          >
            {items.map((item, idx) => {
              const dNome = item.disciplina?.nome || item.disciplina_nome || "Disciplina";
              const cNome = item.curso?.nome || item.curso_nome || item.curso || "Curso";
              const pNome = item.professor?.nome || item.professor_nome || item.professor || "Professor(a)";
              const tNome = item.turma || "";

              return (
                <Tooltip 
                  key={idx} 
                  color={THEME.primary}
                  placement="topLeft"
                  title={
                    <div style={{ fontSize: '13px', padding: '4px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '4px' }}>
                        {dNome}
                      </div>
                      <div style={{ marginBottom: '3px' }}><strong>Prof:</strong> {pNome}</div>
                      <div style={{ marginBottom: '3px' }}><strong>Curso:</strong> {cNome}</div>
                      {tNome && <div><strong>Turma:</strong> {tNome}</div>}
                    </div>
                  }
                >
                  <div 
                    className="modern-card"
                    style={{ 
                      backgroundColor: "#ffffff", 
                      border: `1px solid ${THEME.borderColor}`, 
                      borderLeft: `4px solid ${THEME.primary}`, 
                      borderRadius: "6px", 
                      padding: "10px", 
                      textAlign: "left", 
                      cursor: "pointer", 
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div 
                      style={{ 
                        fontWeight: "700", 
                        color: "#0f172a", 
                        fontSize: "13px", 
                        lineHeight: "1.3",
                        wordBreak: "break-word"
                      }}
                    >
                      {dNome}
                    </div>

                    <div 
                      style={{ 
                        fontSize: "12px", 
                        color: THEME.primary, 
                        fontWeight: "600", 
                        marginTop: "4px"
                      }}
                    >
                      {pNome}
                    </div>

                    <div 
                      style={{ 
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px",
                        marginTop: "10px"
                      }}
                    >
                      <span 
                        style={{ 
                          backgroundColor: THEME.tagBg, 
                          color: THEME.tagText, 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          fontSize: "11px", 
                          fontWeight: "600", 
                          overflow: "hidden", 
                          textOverflow: "ellipsis", 
                          whiteSpace: "nowrap",
                          border: "1px solid #cbd5e1"
                        }}
                      >
                        {cNome}
                      </span>

                      {tNome && (
                        <span 
                          style={{ 
                            backgroundColor: "#e0f2fe", 
                            color: "#0369a1", 
                            padding: "2px 6px", 
                            borderRadius: "4px", 
                            fontSize: "11px", 
                            fontWeight: "700", 
                            flexShrink: 0,
                            border: "1px solid #bae6fd"
                          }}
                        >
                          T: {tNome}
                        </span>
                      )}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        );
      },
    })),
  ];

  return (
    <AppLayout>
      <style>{`
        /* Scrollbar Elegante e Fina */
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Tabela Institucional com Linhas Suaves mas Precisas (1px) */
        .ant-table-wrapper {
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border: 1px solid ${THEME.gridLine}; 
        }
        .ant-table-tbody > tr > td {
          border-bottom: 1px solid ${THEME.gridLine} !important; 
          border-right: 1px solid ${THEME.gridLine} !important; 
          padding: 6px !important;
          background-color: transparent !important;
        }
        /* Garantir que a primeira coluna (Horários) tenha a borda separando dos dias */
        .ant-table-tbody > tr > td:first-child {
          border-right: 1px solid ${THEME.gridLine} !important;
        }
        
        .ant-table-thead > tr > th {
          border-right: 1px solid rgba(255, 255, 255, 0.3) !important; 
          border-bottom: 1px solid ${THEME.gridLine} !important;
        }
        
        .grid-row-even { background-color: ${THEME.rowEven}; }
        .grid-row-odd { background-color: ${THEME.rowOdd}; }

        /* Animação Hover no Card */
        .modern-card {
          transition: all 0.2s ease;
        }
        .modern-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          border-color: #cbd5e1 !important;
        }
      `}</style>

      {/* Painel de Filtros e Ações */}
      <div 
        style={{ 
          marginBottom: 16, 
          background: '#ffffff', 
          padding: '16px 20px', 
          borderRadius: 8, 
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex', 
          alignItems: 'flex-end', 
          flexWrap: 'wrap', 
          justifyContent: 'space-between', 
          gap: 16 
        }}
      >
        <Space size="large" style={{ flexWrap: 'wrap' }}>
          
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: "#475569", fontSize: '12px' }}>Departamento</Text>
            <Select
              placeholder="Selecione..."
              style={{ width: 260 }}
              allowClear
              value={departamentoId}
              onChange={setDepartamentoId}
              options={departamentos.map(d => ({ value: d.id, label: `${d.sigla} - ${d.nome}` }))}
            />
          </Space>

          <Space direction="vertical" size={2}>
            <Text strong style={{ color: "#475569", fontSize: '12px' }}>Curso</Text>
            <Select
              placeholder="Todos os Cursos"
              style={{ width: 200 }}
              allowClear
              value={filtroCurso}
              onChange={setFiltroCurso}
              options={opcoesCursos}
              disabled={!departamentoId || loading}
            />
          </Space>

          <Space direction="vertical" size={2}>
            <Text strong style={{ color: "#475569", fontSize: '12px' }}>Professor(a)</Text>
            <Select
              placeholder="Todos os Professores"
              style={{ width: 200 }}
              allowClear
              value={filtroProfessor}
              onChange={setFiltroProfessor}
              options={opcoesProfessores}
              disabled={!departamentoId || loading}
            />
          </Space>

        </Space>
        
        <Button
          type="primary"
          style={{ backgroundColor: THEME.primary }}
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
          disabled={!departamentoId || loading}
          loading={exporting}
        >
          Exportar PDF 
        </Button>
      </div>

      <Table
        loading={loading}
        rowKey="id"
        dataSource={horarios}
        columns={columns}
        pagination={false}
        bordered={true} 
        size="middle"
        scroll={{ x: 1100 }}
        rowClassName={(_, index) => (index % 2 === 0 ? 'grid-row-even' : 'grid-row-odd')}
        locale={{ 
          emptyText: departamentoId 
            ? "Nenhuma aula agendada (ou compatível com os filtros)." 
            : "Selecione um departamento acima para visualizar a grade." 
        }}
      />
    </AppLayout>
  );
}