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
<html>
<head>
<meta charset="utf-8" />

<style>
@page {
  size: A4;
  margin: 18mm 15mm 22mm 15mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11px;
  margin: 0;
  padding: 0;
  color: #000;
}

/* ================= HEADER ================= */

.header {
  text-align: center;
  margin-bottom: 10px;
}

.logo {
  width: 65px;
  margin-bottom: 6px;
}

.header h1 {
  font-size: 14px;
  margin: 0;
}

.header h2 {
  font-size: 12px;
  margin: 2px 0 8px;
  font-weight: normal;
}

/* ================= INFO ================= */

.info {
  margin-bottom: 12px;
}

.info div {
  margin-bottom: 2px;
}

/* ================= SEMESTRE ================= */

.semester-title {
  margin-top: 14px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: bold;
  border-bottom: 1px solid #999;
  padding-bottom: 3px;
  color: #333;
}

/* ================= TABLE ================= */

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
  table-layout: fixed; /* 🔥 ISSO resolve o problema do meio */
  page-break-inside: avoid;
}

th, td {
  border: 1px solid #444;
  padding: 6px 6px;
  text-align: center;
  vertical-align: middle;
  font-size: 10px;
}

/* Cabeçalho */
thead th {
  background-color: #e4f0fb;
  color: #000;
  font-weight: bold;
}

/* Coluna de horário */
th.horario,
td.horario {
  background-color: #e4f0fb;
  font-weight: bold;
  width: 80px;              /* largura fixa */
  white-space: nowrap;
}

/* Disciplinas */
td.disciplina {
  line-height: 1.25;
  white-space: normal;
  word-wrap: break-word;
  padding: 6px;
}

/* Evita quebra feia no PDF */
tr {
  page-break-inside: avoid;
}

/* ================= FOOTER ================= */

footer {
  font-size: 9px;
  text-align: center;
  margin-top: 20px;
  color: #666;
  border-top: 1px solid #cccccc;
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
  <div><strong>Curso:</strong> ${curso}</div>
  <div><strong>Currículo:</strong> ${curriculo}</div>
  <div><strong>Ano Letivo:</strong> ${anoLetivo}</div>
  <div><strong>Coordenador:</strong> ${coordenador}</div>
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
  </div>
`).join('')}

<footer>
  Documento gerado automaticamente pelo sistema acadêmico
</footer>

</body>
</html>
`;
};