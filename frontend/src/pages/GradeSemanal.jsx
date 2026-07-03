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
  borderColor: "#e5e7eb",
  separatorColor: "#cbd5e1",
};

const miniGradeHeaderStyle = { 
  backgroundColor: THEME.bgHeader, 
  color: THEME.textWhite, 
  fontWeight: "700", 
  fontSize: "12px", 
  textAlign: "center", 
  padding: "8px 4px", 
  textTransform: "uppercase" 
};

const horarioCellStyle = { 
  backgroundColor: "#f9fafb", 
  color: THEME.primary, 
  fontWeight: "700", 
  textAlign: "center", 
  fontSize: "13px", 
  padding: "4px", 
  borderRight: `2px solid ${THEME.separatorColor}` 
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

  // Novos estados para os filtros adicionais
  const [filtroCurso, setFiltroCurso] = useState(null);
  const [filtroProfessor, setFiltroProfessor] = useState(null);

  const diasFixos = [
    { id: 1, nome: "SEG" }, { id: 2, nome: "TER" }, { id: 3, nome: "QUA" }, { id: 4, nome: "QUI" }, { id: 5, nome: "SEX" }
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
      // Sempre que mudar o departamento, limpa os filtros secundários
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

  // Departamento selecionado (para cabeçalho e PDF)
  const deptoSelecionado = useMemo(() => {
    return departamentos.find(d => d.id === departamentoId);
  }, [departamentos, departamentoId]);

  /* ======================================================
     OPÇÕES DOS NOVOS FILTROS (Extraídos da grade atual)
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
     MAPEAMENTO DA GRADE COM OS FILTROS APLICADOS
  ====================================================== */
  const gradeMap = useMemo(() => {
    const map = {};
    grade.forEach((g) => {
      const cNome = g.curso?.nome || g.curso_nome || g.curso || "Curso";
      const pNome = g.professor?.nome || g.professor_nome || g.professor || "Professor";

      // Verifica se a aula passa nos filtros secundários
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
      <div style="box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; color: #1f2d3d; margin: 0; padding: 0;">
        
        <div style="text-align: center; margin-bottom: 4px;">
          <h1 style="margin: 0; font-size: 11px; color: #093e5e;">GRADE HORÁRIA SEMANAL</h1>
          <h2 style="margin: 1px 0 0 0; font-size: 9px;">${deptoSelecionado?.nome || '-'} (${deptoSelecionado?.sigla || '-'})</h2>
          ${filtroCurso || filtroProfessor ? `
            <p style="margin: 3px 0 0 0; font-size: 8px; color: #555;">
              Filtros: ${[filtroCurso, filtroProfessor].filter(Boolean).join(' | ')}
            </p>
          ` : ''}
        </div>

        <div style="margin-bottom: 18px;"></div>

        <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border: 0.1pt solid #000;">
          <thead>
            <tr>
              <th style="width: 60px; min-width: 60px; max-width: 60px; background: #093e5e; color: #fff; font-weight: bold; font-size: 7px; border: 0.1pt solid #000; text-align: center; padding: 3px 1px;">
                Horário
              </th>
              ${diasFixos.map(d => `
                <th style="background: #093e5e; color: #fff; font-size: 7.8px; padding: 3px 1px; border: 0.1pt solid #000; text-align: center;">
                  ${d.nome}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${horarios.map(horario => `
              <tr>
                <td style="width: 60px; min-width: 60px; max-width: 60px; background: #093e5e; color: #fff; font-weight: bold; font-size: 7px; border: 0.1pt solid #000; text-align: center; padding: 1px;">
                  ${horario.descricao}
                </td>
                ${diasFixos.map(dia => {
                  const items = gradeMap[`${horario.id}-${dia.id}`] || [];
                  return `
                    <td style="border: 0.1pt solid #000; text-align: center; padding: 1px 2px; vertical-align: middle; height: 37px; min-height: 37px; max-height: 37px; overflow: hidden; word-break: break-word;">
                      <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%;">
                        ${items.map(item => {
                          const dNome = item.disciplina?.nome || item.disciplina_nome || "Disciplina";
                          const cNome = item.curso?.nome || item.curso_nome || item.curso || "Curso";
                          const pNome = item.professor?.nome || item.professor_nome || item.professor || "";
                          const tNome = item.turma || "";
                          
                          return `
                            <div style="font-weight: bold; font-size: 7.5px; color: #000; margin-bottom: 1px; line-height: 1.1;">
                              ${dNome}
                            </div>
                            <div style="font-size: 7.5px; color: #1f2937; margin-bottom: 1px; line-height: 1.1;">
                              ${cNome} ${tNome ? `(${tNome})` : ''}
                            </div>
                            <div style="font-size: 6.8px; color: #4b5563; font-weight: bold; line-height: 1.1;">
                              ${pNome}
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
      margin:       [4, 4, 4, 4], 
      filename:     `Grade_Semanal_${deptoSelecionado?.sigla || 'Depto'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2.5, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
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
      title: "HORA", dataIndex: "descricao", width: 80, fixed: "left", align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      onCell: () => ({ style: horarioCellStyle }),
    },
    ...diasFixos.map((dia) => ({
      title: dia.nome, width: 160, align: "center",
      onHeaderCell: () => ({ style: miniGradeHeaderStyle }),
      render: (_, record) => {
        const items = gradeMap[`${record.id}-${dia.id}`] || [];
        return (
          <div style={{ minHeight: "70px", maxHeight: "150px", overflowY: "auto", padding: "2px", display: "flex", flexDirection: "column", gap: "4px" }}>
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
                    <div style={{ fontSize: '12px', padding: '2px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{dNome}</div>
                      <div><strong>Professor:</strong> {pNome}</div>
                      <div><strong>Curso:</strong> {cNome}</div>
                      {tNome && <div><strong>Turma:</strong> {tNome}</div>}
                    </div>
                  }
                >
                  <div style={{ backgroundColor: "#ffffff", border: "1px solid #d1d5db", borderLeft: `4px solid ${THEME.primary}`, borderRadius: "4px", padding: "4px 6px", textAlign: "left", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", overflow: "hidden" }}>
                    <div style={{ fontWeight: "700", color: "#1f2937", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.2" }}>{dNome}</div>
                    <div style={{ fontSize: "10px", color: THEME.primary, fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>{pNome}</div>
                    <div style={{ fontSize: "10px", color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cNome} {tNome && `- ${tNome}`}</div>
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
      <div style={{ marginBottom: 15, background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 }}>
        
        {/* Painel de Filtros */}
        <Space size="middle" style={{ flexWrap: 'wrap' }}>
          
          <Space direction="vertical" size={2}>
            <Text strong style={{ color: THEME.primary, fontSize: '12px' }}>Departamento</Text>
            <Select
              placeholder="Selecione um Departamento"
              style={{ width: 280 }}
              allowClear
              value={departamentoId}
              onChange={setDepartamentoId}
              options={departamentos.map(d => ({ value: d.id, label: `${d.sigla} - ${d.nome}` }))}
            />
          </Space>

          <Space direction="vertical" size={2}>
            <Text strong style={{ color: THEME.primary, fontSize: '12px' }}>Curso</Text>
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
            <Text strong style={{ color: THEME.primary, fontSize: '12px' }}>Professor(a)</Text>
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
        
        <Space>
          <Button
            type="default"
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
            disabled={!departamentoId || loading}
            loading={exporting}
          >
            Exportar PDF 
          </Button>
        </Space>
      </div>

      <Table
        loading={loading}
        rowKey="id"
        dataSource={horarios}
        columns={columns}
        pagination={false}
        bordered
        size="middle"
        scroll={{ x: 800 }}
        locale={{ emptyText: departamentoId ? "Nenhuma aula agendada (ou compatível com os filtros)." : "Selecione um departamento acima para visualizar a grade" }}
      />
    </AppLayout>
  );
}