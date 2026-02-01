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
  margin: 20mm 15mm 22mm 15mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11.5px;
  margin: 0;
  padding: 0;
  color: #093e5e; /* texto principal mais escuro */
}

/* ================= HEADER ================= */

.header {
  text-align: center;
  margin-bottom: 26px;
}

.logo {
  width: 102px;
  margin-bottom: 14px;
}

.header h1 {
  font-size: 14.5px;
  margin: 0;
  font-weight: bold;
  color: #093e5e;
}

.header h2 {
  font-size: 12.5px;
  margin-top: 8px;
  font-weight: normal;
  color: #093e5e;
}

/* ================= INFO ================= */

.info {
  margin: 0 auto 28px;
  padding: 10px 16px;
  background-color: #eef3f8; /* fundo claro e neutro */
  border-left: 4px solid #093e5e;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  row-gap: 8px;
  column-gap: 20px;
}

.info-item {
  font-size: 12px;
  line-height: 1.45;
  color: #093e5e;
}

.info-item strong {
  font-weight: bold;
}

/* ================= SEMESTRE + TABELA ================= */

.semester {
  margin-bottom: 32px;
  page-break-inside: avoid;
}

.semester-title {
  font-size: 12.5px;
  font-weight: bold;
  padding: 8px 10px;
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
  padding: 6px;
  text-align: center;
  vertical-align: middle;
  font-size: 10.5px;
  color: #0d3148;
}

/* Cabeçalho */
thead th {
  background-color: #ccdceb;
  font-weight: bold;
}

/* Horário */
th.horario,
td.horario {
  width: 80px;
  font-weight: bold;
  background-color: #ccdceb;
  white-space: nowrap;
}

/* Disciplinas */
td.disciplina {
  line-height: 1.35;
  word-wrap: break-word;
  white-space: normal;
  background-color: #ffffff;
}

/* Destaque leve sem perder leitura */
td.disciplina:not(:empty) {
  background-color: #f7f9fc;
}

/* Evita quebra feia */
tr {
  page-break-inside: avoid;
}

/* ================= FOOTER ================= */

footer {
  font-size: 9.5px;
  text-align: center;
  margin-top: 32px;
  color: #093e5e;
  border-top: 1px solid #7f96a9;
  padding-top: 6px;
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
              <td class="disciplina">${celula || ''}</td>
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