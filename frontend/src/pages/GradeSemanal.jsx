import React, { useEffect, useState, useMemo } from 'react';
import { Table, Select, Typography, message, Button, Space } from 'antd';
import { useLocation } from 'react-router-dom';
import { FilePdfOutlined } from '@ant-design/icons';
import AppLayout from '../components/AppLayout';
import { api } from '../services/api';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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

// Paleta pastel suave aplicada aos departamentos
const paletaPastelSuave = [
  "#FFF6DF", // Creme
  "#F9EBCF", // Bege
  "#F3DDB5", // Areia
  "#EBD3A9", // Ocre claro
  "#F8D8C2", // Pêssego
  "#F2C6B5", // Salmão claro
  "#F2D5D5", // Rosa claro
  "#EBD9E8", // Lilás claro
  "#DED7ED", // Roxo pastel
  "#D4DDF0", // Azul claro 1
  "#C9DFED", // Azul claro 2
  "#C4DDE3", // Azul claro 3
  "#B3E5FC", // AZUL NOVO
  "#BBDEFB", // AZUL NOVO
  "#D0E8F2", // AZUL NOVO
  "#E2E1DC"  // Cinza claro
];

// Mantém a paleta original, mas mistura cada cor com o branco no PDF para
// evitar blocos visualmente pesados na impressão e na visualização do arquivo.
const suavizarCorPastel = (hex, alpha = 0.42) => {
  const valor = hex.replace("#", "");
  const vermelho = parseInt(valor.slice(0, 2), 16);
  const verde = parseInt(valor.slice(2, 4), 16);
  const azul = parseInt(valor.slice(4, 6), 16);
  return `rgba(${vermelho}, ${verde}, ${azul}, ${alpha})`;
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
    return departamentos.find(d => Number(d.id) === Number(departamentoId));
  }, [departamentos, departamentoId]);

  // HELPER DE COR DOS DEPARTAMENTOS UTILIZANDO A PALETA PASTEL SUAVE
  const getDepartamentoCor = (depId) => {
    if (!depId) return null;
    const dep = departamentos.find((d) => Number(d.id) === Number(depId));
    if (dep?.cor) return dep.cor;
    if (dep?.cor_hex) return dep.cor_hex;
    if (dep?.color) return dep.color;
    return paletaPastelSuave[Number(depId) % paletaPastelSuave.length];
  };

  // No PDF, utiliza sempre a paleta pastel institucional, sem sobrescrever
  // as cores com valores personalizados vindos da API.
  const getDepartamentoCorPastel = (depId) => {
    const indice = Number(depId);
    if (Number.isFinite(indice)) {
      return suavizarCorPastel(
        paletaPastelSuave[Math.abs(indice) % paletaPastelSuave.length]
      );
    }

    const texto = String(depId || "");
    let hash = 0;
    for (let i = 0; i < texto.length; i += 1) {
      hash = texto.charCodeAt(i) + ((hash << 5) - hash);
    }
    return suavizarCorPastel(
      paletaPastelSuave[Math.abs(hash) % paletaPastelSuave.length]
    );
  };

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
     GERAÇÃO DO PDF — DESIGN DO TEMPLATE INSTITUCIONAL
  ====================================================== */
  const handleExportPDF = () => {
    if (!departamentoId) {
      message.warning("Selecione um departamento antes de exportar o PDF.");
      return;
    }

    const horariosComDisciplinas = horarios.filter((horario) => (
      diasFixos.some((dia) => (
        (gradeMap[`${horario.id}-${dia.id}`] || []).length > 0
      ))
    ));

    if (horariosComDisciplinas.length === 0) {
      message.warning("Não há aulas compatíveis com os filtros selecionados.");
      return;
    }

    const escapeHtml = (value) => String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const obterCorPastel = (depId) => {
      const indice = Number(depId);
      if (Number.isFinite(indice)) {
        return paletaPastelSuave[Math.abs(indice) % paletaPastelSuave.length];
      }

      const texto = String(depId || "");
      let hash = 0;
      for (let i = 0; i < texto.length; i += 1) {
        hash = texto.charCodeAt(i) + ((hash << 5) - hash);
      }
      return paletaPastelSuave[Math.abs(hash) % paletaPastelSuave.length];
    };

    const renderDisciplinaPDF = (item) => {
      const disciplina = item.disciplina || {};
      const dNome = disciplina.nome || item.disciplina_nome || "Disciplina";
      const codigo = disciplina.codigo || item.codigo || "";
      const carga = disciplina.carga_horaria ?? disciplina.cargaHoraria ?? item.carga_horaria ?? "";
      const cNome = item.curso?.nome || item.curso_nome || item.curso || "Curso";
      const pNome = item.professor?.nome || item.professor_nome || item.professor || "";
      const tNome = item.turma || "";
      const departamento = item.departamento?.sigla || item.departamento?.nome || "";
      const depId = item.departamento_id || disciplina.departamento_id || item.departamento?.id || departamentoId;
      const fundo = obterCorPastel(depId);

      return `
        <div class="disciplina-item" style="background-color: ${escapeHtml(fundo)}; border-left: 3px solid ${escapeHtml(fundo)};">
          <div class="disciplina-header">
            ${departamento ? `<span class="tag-moderna">${escapeHtml(departamento)}</span>` : ""}
            ${codigo ? `<span class="tag-moderna">${escapeHtml(codigo)}</span>` : ""}
            ${cNome ? `<span class="tag-moderna">${escapeHtml(cNome)}</span>` : ""}
            ${tNome ? `<span class="tag-moderna">T.${escapeHtml(tNome)}</span>` : ""}
          </div>
          <div class="disciplina-nome">
            ${escapeHtml(dNome)}${carga !== "" ? ` <span class="disciplina-carga">(${escapeHtml(carga)}h)</span>` : ""}
          </div>
          ${pNome ? `<div class="disciplina-professor">Prof. ${escapeHtml(pNome)}</div>` : ""}
        </div>
      `;
    };

    const htmlTemplate = `
      <style>
          * { box-sizing: border-box; }
          @page { size: A4 landscape; margin: 4mm 6mm; }
          html, body { width: 100%; margin: 0; padding: 0; background: #fff; }
          body {
            font-family: Inter, 'Segoe UI', Arial, sans-serif;
            color: #0f172a;
            font-size: 8px;
            -webkit-font-smoothing: antialiased;
          }
          .header {
            text-align: center;
            margin: 0 0 4px;
            padding: 0 2px 3px;
            border-bottom: 1px solid transparent;
            page-break-after: avoid;
            break-after: avoid;
          }
          .header h1 {
            margin: 0;
            color: #334155;
            font-size: 10.5px;
            line-height: 1.15;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: .1px;
          }
          .header h2 {
            margin: 2px 0 0;
            color: #64748b;
            font-size: 8.5px;
            line-height: 1.15;
            font-weight: 400;
            text-transform: uppercase;
            letter-spacing: .5px;
          }
          .info {
            width: 100%;
            margin: 14px 0 9px;
            padding: 3px 0;
            border-top: 1px solid #dbe3ec;
            border-bottom: 1px solid #dbe3ec;
            background: #f8fafc;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .info-table td {
            padding: 3px 5px;
            color: #64748b;
            font-size: 7px;
            line-height: 1.15;
            text-align: left;
            vertical-align: middle;
            overflow-wrap: anywhere;
            border-right: 1px solid #e2e8f0;
          }
          .info-table td:last-child { border-right: 0; }
          .info-table td:nth-child(odd) { background: #fff; }
          .info-table td:nth-child(even) { background: #f8fafc; }
          .info-table strong { color: #64748b; font-weight: 500; white-space: nowrap; }
          .grade-table {
            width: 100%;
            border: 2.4px solid #0b3d5c;
            border-collapse: collapse;
            table-layout: fixed;
          }
          .grade-table thead { display: table-header-group; }
          .grade-table tr { page-break-inside: avoid; break-inside: avoid; }
          .grade-table tbody tr { min-height: 25px; }
          .grade-table th, .grade-table td {
            border: 1.5px solid #94a3b8;
            padding: 0;
            vertical-align: top;
          }
          .grade-table th + th, .grade-table td + td { border-left: 2px solid #64748b; }
          .grade-table thead th { border-bottom: 2.5px solid #0b3d5c; }
          .grade-table th {
            height: 22px;
            padding: 3px 2px;
            background: #0b3d5c;
            color: #fff;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .35px;
            vertical-align: middle;
            text-align: center;
          }
          .coluna-horario, .horario-th, .horario { width: 68px; }
          .horario {
            background: #0b3d5c;
            color: #fff;
            font-size: 8.2px;
            font-weight: 700;
            text-align: center;
            vertical-align: middle;
          }
          .horario-conteudo {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 30px;
            padding: 3px 1px;
            line-height: 1.15;
          }
          .celula-grade { background: #fff; }
          .celula-conteudo {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: stretch;
            width: 100%;
            min-height: 36px;
            padding: 4px;
            gap: 5px;
          }
          .disciplina-item {
            width: 100%;
            min-width: 0;
            flex: 0 0 auto;
            display: flex;
            flex-direction: column;
            justify-content: center;
            margin: 0;
            padding: 6px 7px;
            text-align: left;
            white-space: normal;
            border: 1px solid #cbd5e1;
            border-radius: 3px;
            box-shadow: none;
          }
          .disciplina-header {
            display: flex;
            flex-wrap: wrap;
            gap: 3px;
            margin-bottom: 4px;
            line-height: 1.1;
          }
          .tag-moderna {
            background: #eef2f6;
            border: 1px solid #d8e0e8;
            border-radius: 3px;
            padding: 2px 4px;
            color: #1e293b;
            font-size: 7.2px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .15px;
            line-height: 1.15;
            overflow-wrap: anywhere;
          }
          .disciplina-nome {
            color: #0f172a;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 3px;
            word-break: break-word;
          }
          .disciplina-carga { color: #334155; font-weight: 600; font-size: 8px; }
          .disciplina-professor {
            color: #334155;
            font-size: 8px;
            font-weight: 600;
            line-height: 1.2;
            word-break: break-word;
          }
          footer {
            margin-top: 4px;
            padding-top: 2px;
            color: #94a3b8;
            font-size: 6px;
            text-transform: uppercase;
            letter-spacing: .5px;
            text-align: center;
          }
        </style>
        <div class="header">
          <h1>${escapeHtml("UNIVERSIDADE FEDERAL DE CIÊNCIAS DA SAÚDE DE PORTO ALEGRE")}</h1>
          <h2>Grade Horária Semanal</h2>
        </div>
        <div class="info">
          <table class="info-table">
            <colgroup>
              <col style="width: 30%" />
              <col style="width: 35%" />
              <col style="width: 35%" />
            </colgroup>
            <tbody>
              <tr>
                <td><strong>Departamento:</strong> ${escapeHtml(deptoSelecionado?.nome || "-")}</td>
                <td><strong>Sigla:</strong> ${escapeHtml(deptoSelecionado?.sigla || "-")}</td>
                <td><strong>Filtros:</strong> ${escapeHtml([filtroCurso, filtroProfessor].filter(Boolean).join(" / ") || "Todos")}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <table class="grade-table">
          <colgroup>
            <col class="coluna-horario" />
            ${diasFixos.map(() => "<col />").join("")}
          </colgroup>
          <thead>
            <tr>
              <th class="horario-th">Horário</th>
              ${diasFixos.map((dia) => `<th>${escapeHtml(dia.nome)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${horariosComDisciplinas.map((horario) => `
              <tr>
                <td class="horario"><div class="horario-conteudo">${escapeHtml(horario.descricao || "")}</div></td>
                ${diasFixos.map((dia) => {
                  const items = gradeMap[`${horario.id}-${dia.id}`] || [];
                  return `
                    <td class="celula-grade">
                      <div class="celula-conteudo">
                        ${items.map(renderDisciplinaPDF).join("")}
                      </div>
                    </td>
                  `;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        <footer>${escapeHtml(deptoSelecionado?.nome || "Grade Horária")}</footer>
    `;

    // O html2canvas não captura corretamente elementos posicionados fora do viewport.
    // Mantemos o container dentro da área visível, sem interação, e o removemos ao final.
    const containerOculto = document.createElement("div");
    containerOculto.style.position = "fixed";
    containerOculto.style.left = "0";
    containerOculto.style.top = "0";
    containerOculto.style.width = "1120px";
    containerOculto.style.maxWidth = "1120px";
    containerOculto.style.background = "#ffffff";
    containerOculto.style.zIndex = "2147483647";
    containerOculto.style.pointerEvents = "none";
    containerOculto.innerHTML = htmlTemplate;
    document.body.appendChild(containerOculto);

    const limpar = () => {
      if (containerOculto.parentNode) containerOculto.parentNode.removeChild(containerOculto);
      setExporting(false);
    };

    setExporting(true);

    // Cada página recebe o cabeçalho e o cabeçalho da tabela novamente.
    // Os horários são divididos somente entre linhas completas, nunca no meio de uma linha.
    const executarImpressao = async () => {
      const paginas = [];
      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const linhasOriginais = Array.from(containerOculto.querySelectorAll(".grade-table tbody tr"));
        const tabela = containerOculto.querySelector(".grade-table");
        if (!linhasOriginais.length || !tabela) {
          throw new Error("A grade não possui linhas renderizadas para exportação.");
        }

        const containerRect = containerOculto.getBoundingClientRect();
        const primeiraLinhaRect = linhasOriginais[0].getBoundingClientRect();
        const ultimaLinhaRect = linhasOriginais[linhasOriginais.length - 1].getBoundingClientRect();
        const alturaBase = Math.max(1, primeiraLinhaRect.top - containerRect.top);
        const alturaRodape = Math.max(0, containerRect.bottom - ultimaLinhaRect.bottom);
        const larguraPagina = 297;
        const alturaPagina = 210;
        const margem = 6;
        const larguraUtil = larguraPagina - (margem * 2);
        const alturaUtil = alturaPagina - (margem * 2);
        const larguraCSS = containerOculto.getBoundingClientRect().width || 1120;
        const alturaMaximaCSS = (alturaUtil / larguraUtil) * larguraCSS;
        const alturas = linhasOriginais.map((linha) => linha.getBoundingClientRect().height);
        const limiteLinhas = Math.max(1, alturaMaximaCSS - alturaBase - alturaRodape);

        let paginaAtual = [];
        let alturaPaginaAtual = 0;
        alturas.forEach((altura, indice) => {
          if (paginaAtual.length && alturaPaginaAtual + altura > limiteLinhas) {
            paginas.push(paginaAtual);
            paginaAtual = [];
            alturaPaginaAtual = 0;
          }
          paginaAtual.push(indice);
          alturaPaginaAtual += altura;
        });
        if (paginaAtual.length) paginas.push(paginaAtual);

        const pdf = new jsPDF({
          unit: "mm",
          format: "a4",
          orientation: "landscape",
          compress: true,
        });

        for (let paginaIndex = 0; paginaIndex < paginas.length; paginaIndex += 1) {
          const indicesPermitidos = new Set(paginas[paginaIndex]);
          const pagina = containerOculto.cloneNode(true);
          const linhasPagina = Array.from(pagina.querySelectorAll(".grade-table tbody tr"));
          linhasPagina.forEach((linha, indice) => {
            if (!indicesPermitidos.has(indice)) linha.remove();
          });

          pagina.style.position = "fixed";
          pagina.style.left = "0";
          pagina.style.top = "0";
          pagina.style.width = `${larguraCSS}px`;
          pagina.style.maxWidth = `${larguraCSS}px`;
          pagina.style.zIndex = "2147483646";
          pagina.style.pointerEvents = "none";
          pagina.style.background = "#ffffff";
          document.body.appendChild(pagina);

          await new Promise((resolve) => requestAnimationFrame(resolve));
          const canvas = await html2canvas(pagina, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            scrollX: 0,
            scrollY: 0,
            windowWidth: Math.ceil(larguraCSS),
            windowHeight: Math.ceil(pagina.scrollHeight || alturaMaximaCSS),
          });
          if (pagina.parentNode) pagina.parentNode.removeChild(pagina);

          if (!canvas.width || !canvas.height) {
            throw new Error(`A captura da página ${paginaIndex + 1} retornou uma imagem vazia.`);
          }

          const alturaProporcional = (canvas.height * larguraUtil) / canvas.width;
          const alturaImagem = Math.min(alturaProporcional, alturaUtil);
          if (paginaIndex > 0) pdf.addPage();
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.98),
            "JPEG",
            margem,
            margem,
            larguraUtil,
            alturaImagem,
            undefined,
            "FAST",
          );
        }

        // Download direto: não abre a pré-visualização do PDF no navegador.
        const nomeArquivo = `Grade_Semanal_${deptoSelecionado?.sigla || "Depto"}.pdf`;
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = nomeArquivo;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        limpar();
      } catch (error) {
        paginas.forEach(() => {});
        console.error("Erro ao gerar PDF paginado da grade semanal:", error);
        message.error("Erro ao gerar PDF. Verifique o console para mais detalhes.");
        limpar();
      }
    };

    executarImpressao().catch((error) => {
      console.error("Erro ao preparar PDF da grade semanal:", error);
      message.error("Erro ao preparar PDF.");
      limpar();
    });
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
              
              const depId = item.departamento_id || item.departamento?.id || departamentoId;
              const depCor = getDepartamentoCor(depId);

              return (
                  <div
                    key={item.id || `${item.horario_id}-${item.dia_semana_id}-${item.disciplina_id || idx}-${idx}`}
                    className="modern-card"
                    style={{ 
                      backgroundColor: depCor ? `${depCor}25` : "#ffffff", 
                      border: `1px solid ${THEME.borderColor}`, 
                      borderLeft: `4px solid ${depCor || THEME.primary}`, 
                      borderRadius: "6px", 
                      padding: "10px", 
                      textAlign: "left", 
                      cursor: "default", 
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

        /* Hover minimalista: apenas sinaliza a passagem do mouse, sem deslocar o bloco. */
        .modern-card {
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .modern-card:hover {
          background-color: #f8fafc !important;
          border-color: #94a3b8 !important;
          box-shadow: 0 2px 5px rgba(15, 23, 42, 0.08) !important;
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
        .ant-table-tbody > tr > td:first-child {
          border-right: 1px solid ${THEME.gridLine} !important;
        }
        
        .ant-table-thead > tr > th {
          border-right: 1px solid rgba(255, 255, 255, 0.3) !important; 
          border-bottom: 1px solid ${THEME.gridLine} !important;
        }
        
        .grid-row-even { background-color: ${THEME.rowEven}; }
        .grid-row-odd { background-color: ${THEME.rowOdd}; }
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
          
          <Space orientation="vertical" size={2}>
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

          <Space orientation="vertical" size={2}>
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

          <Space orientation="vertical" size={2}>
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
