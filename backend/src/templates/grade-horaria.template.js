function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
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
      font-size: 8px;
      -webkit-font-smoothing: antialiased;
      padding: 2mm 0;
    }

    .header {
      text-align: center;
      margin: 0 0 4px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .header h1 {
      margin: 0;
      color: #093e5e; 
      font-size: 11.5px;
      line-height: 1.1;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .header h2 {
      margin: 2px 0 0 0;
      color: #475569;
      font-size: 9.5px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info {
      width: 100%;
      margin: 0 0 4px 0;
      padding: 3px 5px;
      border: var(--espessura-grade) solid var(--cor-borda-grade); 
      border-radius: 4px;
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
      width: 16.66%;
      padding: 1px 2px;
      color: #334155;
      font-size: 8px;
      line-height: 1.1;
      text-align: left;
    }

    .info-table strong { 
      color: #093e5e; 
      font-weight: 600;
    }

    .semester {
      width: 100%;
    }

    .grade-table {
      width: 100%;
      border: var(--espessura-grade) solid var(--cor-borda-grade);
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

    .grade-table th,
    .grade-table td {
      border: var(--espessura-grade) solid var(--cor-borda-grade);
      padding: 0;
      vertical-align: top;
    }

    .grade-table th {
      height: 18px;
      padding: 2px;
      background: #093e5e; 
      color: #ffffff;
      font-size: 8px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      vertical-align: middle;
      text-align: center;
    }

    .coluna-horario { width: 68px; }
    .horario-th { width: 68px; }

    .horario {
      width: 68px;
      background: #093e5e;
      color: #ffffff;
      font-size: 7.5px;
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
      padding: 2px 1px;
      line-height: 1.15;
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
      padding: 2px; 
      gap: 2px;
    }

    .disciplina-item {
      flex: 1 1 0px; /* Divide o espaço da célula igualmente entre as disciplinas */
      min-width: 0;   /* Permite que o flex reduz o bloco sem estourar a tabela */
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin: 0;
      padding: 2px 3px;
      text-align: left;
      white-space: normal;
      border: 1px solid var(--cor-borda-bloco); 
      border-radius: 3px; 
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03); 
    }

    .disciplina-header {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-bottom: 1px;
      line-height: 1;
    }

    .tag-moderna {
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 2px;
      padding: 1px 2px;
      color: #1e293b;
      font-size: 6px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }

    .disciplina-nome {
      color: #0f172a;
      font-size: 7.5px;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 1px;
      word-break: break-word;
    }

    .disciplina-carga {
      color: #475569;
      font-weight: 500;
      font-size: 7px;
    }

    .disciplina-professor {
      color: #475569;
      font-size: 6.5px;
      font-weight: 500;
      line-height: 1.05;
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
      <tr>
        <td><strong>Curso:</strong> ${escapeHtml(curso || "-")}</td>
        <td><strong>Currículo:</strong> ${escapeHtml(curriculo || "-")}</td>
        <td><strong>Ano:</strong> ${escapeHtml(anoLetivo || "-")}</td>
        <td><strong>Coordenador:</strong> ${escapeHtml(coordenador || "-")}</td>
        <td><strong>Semestre:</strong> ${escapeHtml(semestreDescricao || "-")}</td>
        <td><strong>Turma:</strong> ${escapeHtml(turmaGrade || "-")}</td>
      </tr>
    </table>
  </div>

  ${listaSemestres.map(renderSemestre).join("")}

  <footer>${escapeHtml(universidade || "Universidade Federal de Ciências da Saúde de Porto Alegre")}</footer>
</body>
</html>`;
};