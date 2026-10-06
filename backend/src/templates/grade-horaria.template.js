function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres,
  turmaGrade,
  coresDepartamentos = {},
}) {
  const PALETA_CORES = [
    "#dcfce7", "#dbeafe", "#fae8ff", "#fef3c7", "#fee2e2",
    "#ede9fe", "#e0f2fe", "#d1fae5", "#fce7f3", "#ffedd5",
  ];

  const diasPadrao = [
    "2ª feira", "3ª feira", "4ª feira",
    "5ª feira", "6ª feira", "Sábado",
  ];

  const obterCorPorDepartamento = (departamento) => {
    if (!departamento) return "#f1f5f9";

    const chave = String(departamento).trim();
    if (coresDepartamentos && coresDepartamentos[chave]) {
      return coresDepartamentos[chave];
    }

    let hash = 0;
    for (let i = 0; i < chave.length; i += 1) {
      hash = chave.charCodeAt(i) + ((hash << 5) - hash);
    }

    return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
  };

  const normalizarCelula = (celula) => {
    if (Array.isArray(celula)) {
      return celula.flat(Infinity).filter((item) => item && typeof item === "object");
    }
    if (celula && typeof celula === "object") return [celula];
    return [];
  };

  const temDisciplina = (celula) => {
    return normalizarCelula(celula).some((disciplina) => (
      disciplina.nome ||
      disciplina.codigo ||
      disciplina.professor ||
      disciplina.departamento ||
      disciplina.turma
    ));
  };

  const renderDisciplina = (disciplina) => {
    const departamento = disciplina.departamento || "";
    const fundo = obterCorPorDepartamento(departamento);
    const codigo = disciplina.codigo || "";
    const nome = disciplina.nome || "";
    const carga = disciplina.cargaHoraria || disciplina.carga_horaria || "";
    const professor = disciplina.professor || "";
    const turma = disciplina.turma || "";

    const temHeader = departamento || codigo || turma;

    return `
      <div class="disciplina-item" style="background-color: ${escapeHtml(fundo)};">
        ${temHeader ? `
        <div class="disciplina-header">
          ${departamento ? `<span class="tag-moderna">${escapeHtml(departamento)}</span>` : ""}
          ${codigo ? `<span class="tag-moderna">${escapeHtml(codigo)}</span>` : ""}
          ${turma ? `<span class="tag-moderna">T.${escapeHtml(turma)}</span>` : ""}
        </div>
        ` : ""}
        
        ${nome ? `
        <div class="disciplina-nome">
          ${escapeHtml(nome)}${carga ? ` <span class="disciplina-carga">(${escapeHtml(carga)}h)</span>` : ""}
        </div>
        ` : ""}
        
        ${professor ? `
        <div class="disciplina-professor">Prof. ${escapeHtml(professor)}</div>
        ` : ""}
      </div>
    `;
  };

  const renderSemestre = (semestre) => {
    const linhas = Array.isArray(semestre?.linhas) ? semestre.linhas : [];
    const dias = Array.isArray(semestre?.dias) && semestre.dias.length
      ? semestre.dias
      : diasPadrao;

    const linhasComAula = linhas.filter((linha) => (
      Array.isArray(linha?.celulas) && linha.celulas.some(temDisciplina)
    ));

    const linhasRenderizadas = linhasComAula.length > 0
      ? linhasComAula
      : [{ horario: "", celulas: dias.map(() => []) }];

    return `
      <section class="semester">
        <table class="grade-table">
          <colgroup>
            <col class="coluna-horario" />
            ${dias.map(() => "<col />").join("")}
          </colgroup>
          <thead>
            <tr>
              <th class="horario-th">Horário</th>
              ${dias.map((dia) => `<th>${escapeHtml(dia)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${linhasRenderizadas.map((linha) => `
              <tr>
                <td class="horario">
                  <div class="horario-conteudo">${escapeHtml(linha?.horario || "")}</div>
                </td>
                ${dias.map((_, indiceDia) => {
                  const disciplinas = normalizarCelula(linha?.celulas?.[indiceDia]);
                  return `
                    <td class="celula-grade">
                      <div class="celula-conteudo">
                        ${disciplinas.map(renderDisciplina).join("")}
                      </div>
                    </td>
                  `;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    `;
  };

  const listaSemestres = Array.isArray(semestres) ? semestres : [];
  const semestreDescricao = listaSemestres
    .map((semestre) => semestre?.descricao || semestre?.numero || semestre)
    .filter(Boolean)
    .join(" / ");
  const turmaGradeTexto = String(turmaGrade ?? "").trim();
  const largurasInfo = turmaGradeTexto
    ? [19, 13, 26, 11, 17, 14]
    : [22, 14, 31, 13, 20];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Grade Horária</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { box-sizing: border-box; }

    :root {
      --cor-borda-grade: #334155; 
      --espessura-grade: 2px;    
      --cor-borda-bloco: rgba(0, 0, 0, 0.18); 
    }

    @page {
      size: A4 landscape;
      margin: 4mm 6mm;
    }

    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #0f172a;
      font-size: 8.5px;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      padding: 0;
    }

    .header {
      text-align: center;
      margin: 0 0 4px;
      padding: 0 2px 3px;
      /* Reserva o espaço original, mas sem linha visível: o intervalo fica em branco. */
      border-bottom: 1px solid transparent;
      page-break-after: avoid;
      break-after: avoid;
    }

    /* A instituição fica como identificação secundária; o título da grade assume o foco. */
    .header h1 {
      margin: 0;
      color: #334155;
      font-size: 11px;
      line-height: 1.2;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1px;
      word-spacing: 0;
    }

    .header h2 {
      margin: 2px 0 0;
      color: #64748b;
      font-size: 9px;
      line-height: 1.2;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info {
      width: 100%;
      margin: 14px 0 9px;
      padding: 3px 0;
      border: 0;
      border-top: 1px solid #dbe3ec;
      border-bottom: 1px solid #dbe3ec;
      border-radius: 0;
      background: #f8fafc;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .info-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .info-table td {
      padding: 4px 6px;
      color: #475569;
      font-size: 8px;
      line-height: 1.25;
      text-align: left;
      vertical-align: middle;
      overflow-wrap: anywhere;
      border-right: 1px solid #e2e8f0;
    }

    .info-table td:last-child { border-right: 0; }

    /* Alternância bem sutil para separar visualmente cada campo de informação. */
    .info-row td:nth-child(odd) { background: #ffffff; }
    .info-row td:nth-child(even) { background: #fdfdfd; }

    .info-row strong {
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }

    .semester {
      width: 100%;
    }

    .grade-table {
      width: 100%;
      border: 2.4px solid #0b3d5c;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .grade-table thead { 
      display: table-header-group; 
    }

    .grade-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Altura mínima confortável para a leitura rápida dos horários. */
    .grade-table tbody tr {
      height: 25px;
    }

    .grade-table th,
    .grade-table td {
      /* Divisórias horizontais mais suaves; a moldura externa permanece mais forte. */
      border: 1.5px solid #94a3b8;
      padding: 0;
      vertical-align: top;
    }

    /* Reforça as divisórias verticais para separar com clareza os dias/colunas. */
    .grade-table th + th,
    .grade-table td + td {
      border-left: 2px solid #64748b;
    }

    .grade-table thead th {
      border-bottom: 2.5px solid #0b3d5c;
    }

    .grade-table th {
      height: 24px;
      padding: 4px 3px;
      background: #0b3d5c;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.35px;
      vertical-align: middle;
      text-align: center;
    }

    .coluna-horario { width: 68px; }
    .horario-th { width: 68px; }

    .horario {
      width: 68px;
      background: #0b3d5c;
      color: #ffffff;
      font-size: 8.8px;
      font-weight: 700;
      text-align: center;
      vertical-align: middle;
      padding: 0;
    }

    .horario-conteudo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      padding: 4px 2px;
      line-height: 1.25;
    }

    .celula-grade {
      background: #ffffff;
    }

    .celula-conteudo {
      display: flex;
      flex-direction: row; /* Alinha os itens lado a lado */
      justify-content: flex-start;
      align-items: stretch;
      width: 100%;
      height: 100%;
      padding: 4px;
      gap: 4px;
    }

    .disciplina-item {
      flex: 1 1 0px; /* Divide o espaço da célula igualmente entre as disciplinas */
      min-width: 0;   /* Permite que o flex reduz o bloco sem estourar a tabela */
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0;
      padding: 5px 6px;
      text-align: left;
      white-space: normal;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      box-shadow: none; 
    }

    .disciplina-header {
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      margin-bottom: 3px;
      line-height: 1.1;
    }

    .tag-moderna {
      background: #eef2f6;
      border: 1px solid #d8e0e8;
      border-radius: 3px;
      padding: 2px 4px;
      color: #1e293b;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15px;
      line-height: 1.15;
      overflow-wrap: anywhere;
    }

    .disciplina-nome {
      color: #0f172a;
      font-size: 9.5px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 3px;
      word-break: break-word;
    }

    .disciplina-carga {
      color: #475569;
      font-weight: 600;
      font-size: 8px;
    }

    .disciplina-professor {
      color: #334155;
      font-size: 7.5px;
      font-weight: 600;
      line-height: 1.2;
      word-break: break-word;
    }

    footer {
      margin-top: 4px;
      padding-top: 2px;
      background: #ffffff;
      color: #94a3b8;
      font-size: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: center;
      page-break-before: auto;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(universidade || "UNIVERSIDADE FEDERAL DE CIÊNCIAS DA SAÚDE DE PORTO ALEGRE")}</h1>
    <h2>Grade Horária</h2>
  </div>

  <div class="info">
    <table class="info-table">
      <colgroup>${largurasInfo.map((largura) => `<col style="width: ${largura}%" />`).join("")}</colgroup>
      <tbody>
        <tr class="info-row">
          <td><strong>Curso:</strong> ${escapeHtml(curso || "-")}</td>
          <td><strong>Currículo:</strong> ${escapeHtml(curriculo || "-")}</td>
          <td><strong>Coordenador(a):</strong> ${escapeHtml(coordenador || "-")}</td>
          <td><strong>Ano:</strong> ${escapeHtml(anoLetivo || "-")}</td>
          <td><strong>Semestre:</strong> ${escapeHtml(semestreDescricao || "-")}</td>
          ${turmaGradeTexto ? `<td><strong>Turma:</strong> ${escapeHtml(turmaGradeTexto)}</td>` : ""}
        </tr>
      </tbody>
    </table>
  </div>

  ${listaSemestres.map(renderSemestre).join("")}

  <footer>${escapeHtml(universidade || "Universidade Federal de Ciências da Saúde de Porto Alegre")}</footer>
</body>
</html>`;
};
