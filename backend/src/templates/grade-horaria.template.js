const fs = require('fs');
const path = require('path');

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
  margin: 0;
  padding: 0;
  color: #093e5e;
  line-height: 1.3;
}

/* ================= HEADER ================= */
.header {
  text-align: center;
  margin-bottom: 14px;
}
.logo {
  width: 80px;
  margin-bottom: 6px;
}
.header h1 {
  font-size: 13px;
  margin: 0;
  font-weight: bold;
}
.header h2 {
  font-size: 11px;
  margin-top: 2px;
  font-weight: normal;
}

/* ================= INFO ================= */
.info {
  margin: 0 auto 16px;
  padding: 6px 12px;
  background-color: #eef3f8;
  border-left: 3px solid #093e5e;
}
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  row-gap: 4px;
  column-gap: 16px;
}
.info-item {
  font-size: 10px;
}
.info-item strong {
  font-weight: bold;
}

/* ================= SEMESTRE ================= */
.semester {
  margin-bottom: 18px;
  page-break-inside: avoid;
}
.semester-title {
  font-size: 11px;
  font-weight: bold;
  padding: 5px 8px;
  background-color: #093e5e;
  color: #ffffff;
}

/* ================= TABLE ================= */
table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

th, td {
  border: 1px solid #3f5261;
  padding: 4px 5px;
  text-align: center;
  vertical-align: middle;
  font-size: 9px;
  color: #0d3148;
  word-break: break-word;
}

thead th {
  background-color: #ccdceb;
  font-weight: bold;
}

th.horario,
td.horario {
  width: 60px;
  font-weight: bold;
  background-color: #ccdceb;
  white-space: nowrap;
}

td.disciplina {
  background-color: #ffffff;
  min-height: 22px;
}
td.disciplina:not(:empty) {
  background-color: #f7f9fc;
}

tr {
  page-break-inside: avoid;
}

/* ================= FOOTER ================= */
footer {
  font-size: 8px;
  text-align: center;
  margin-top: 16px;
  color: #093e5e;
  border-top: 1px solid #7f96a9;
  padding-top: 4px;
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
    <div class="info-item"><strong>Curso:</strong> ${curso}</div>
    <div class="info-item"><strong>Currículo:</strong> ${curriculo}</div>
    <div class="info-item"><strong>Ano Letivo:</strong> ${anoLetivo}</div>
    <div class="info-item"><strong>Coordenação:</strong> ${coordenador}</div>
  </div>
</div>

${semestres.map(semestre => `
  <div class="semester">
    <div class="semester-title">${semestre.descricao}</div>

    <table>
      <thead>
        <tr>
          <th class="horario">Horário</th>
          ${semestre.dias.map(dia => `<th>${dia}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${semestre.linhas.map(linha => `
          <tr>
            <td class="horario">${linha.horario}</td>
            ${linha.celulas.map(celula => `
              <td class="disciplina">
                ${(celula || '')
                  .split('<br>')[0]
                  .split('\\n')[0]
                }
              </td>
            `).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`).join('')}

<footer>
  Documento gerado automaticamente pelo sistema acadêmico
</footer>

</body>
</html>
`;
};