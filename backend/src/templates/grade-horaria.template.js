const fs = require('fs');
const path = require('path');

// Carrega o logo em Base64
const logoBase64 = fs.readFileSync(
  path.resolve(__dirname, '../../assets/logo-ufcspa.png'),
  { encoding: 'base64' }
);

module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres
}) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />

<style>
@page {
  size: A4;
  margin: 14mm 12mm 16mm 12mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  color: #093e5e;
}

/* ================= CABEÇALHO ================= */

.header {
  text-align: center;
  margin-bottom: 14px;
}

.logo {
  width: 80px;
  margin-bottom: 26px; /* Aumentei o espaçamento do logo */
}

.header h1 {
  margin: 0;
  margin-bottom: 10px; /* Espaço entre universidade e título */
}

.header h2 {
  margin: 10;
}

.info {
  background: #eef3f8;
  padding: 6px 12px;
  margin-bottom: 16px;
  border-left: 3px solid #093e5e;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 4px 16px;
}

/* ================= SEMESTRES ================= */

.semester {
  margin-bottom: 18px;
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Somente a partir do 2º semestre quebra página */
.semester + .semester {
  page-break-before: always;
}

.semester-title {
  background: #093e5e;
  color: #fff;
  padding: 5px 8px;
  font-weight: bold;
}

/* ================= TABELA ================= */

table {
  width: 100%;
  border-collapse: collapse;
  page-break-inside: avoid;
  break-inside: avoid;
}

thead {
  display: table-header-group;
}

tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

th, td {
  border: 1px solid #3f5261;
  padding: 4px;
  text-align: center;
  font-size: 9px;
}

th.horario,
td.horario {
  width: 60px;
  background: #ccdceb;
  font-weight: bold;
}

td.disciplina {
  background: #f7f9fc;
  min-height: 22px;
  white-space: normal;
}

/* ================= LEGENDA ================= */

.legend {
  margin-top: 8px;
  background: #eef3f8;
  padding: 6px 8px;
  border-left: 3px solid #093e5e;
  font-size: 9px;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.legend-item {
  margin-bottom: 2px;
}

/* ================= RODAPÉ ================= */

footer {
  font-size: 8px;
  text-align: center;
  margin-top: 16px;
}
</style>
</head>

<body>

<div class="header">
  <img class="logo" src="data:image/png;base64,${logoBase64}" />
  <h1>${universidade}</h1>
  <h2>Grade Horária</h2>
</div>

<div class="info">
  <div class="info-grid">
    <div><strong>Curso:</strong> ${curso}</div>
    <div><strong>Currículo:</strong> ${curriculo}</div>
    <div><strong>Ano Letivo:</strong> ${anoLetivo}</div>
    <div><strong>Coordenação:</strong> ${coordenador || ''}</div>
  </div>
</div>

${semestres.map(semestre => `
<div class="semester">
  <div class="semester-title">${semestre.descricao}</div>

  <table>
    <thead>
      <tr>
        <th class="horario">Horário</th>
        ${semestre.dias.map(d => `<th>${d}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${semestre.linhas.map(linha => `
        <tr>
          <td class="horario">${linha.horario}</td>
          ${linha.celulas.map(c => `
            <td class="disciplina">${c || ''}</td>
          `).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${semestre.professores && semestre.professores.length ? `
  <div class="legend">
    <div class="legend-title">Legenda de Professores</div>
    ${semestre.professores.map(p => `
      <div class="legend-item">
        <strong>${p.disciplina}</strong> — ${p.professor}
      </div>
    `).join('')}
  </div>
  ` : ''}
</div>
`).join('')}

<footer>
  UFCSPA - Universidade Federal de Ciências da Saúde de Porto Alegre
</footer>

</body>
</html>
  `;
};