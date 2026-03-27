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
  coordenador, // nome do coordenador
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
  margin: 6mm 2mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 10px;
  color: #1f2d3d;
}

.header {
  text-align: center;
  margin-bottom: 38px;
}

.logo {
  width: 60px;
  margin-bottom: 6px;
}

.header h1 {
  margin: 0;
  font-size: 14px;
  color: #093e5e;
  font-weight: 600;
}

.header h2 {
  margin: 2px 0 0;
  font-size: 11px;
  color: #4a5d6a;
}

.info {
  border: 1px solid #b5b5b5;
  background: #f5f3ff;
  padding: 6px 10px;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px 14px;
}

.info strong {
  color: #093e5e;
  font-weight: 600;
}

/* destaque especial para coordenador */
.info .coordenador {
  font-weight: 600;
  color: #1a5f3a;
}

/* semestre e tabela */
.semester {
  margin-bottom: 14px;
  page-break-inside: avoid;
}

.semester + .semester {
  page-break-before: always;
}

.semester-title {
  font-weight: 600;
  color: #093e5e;
  margin-bottom: 4px;
  font-size: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  border: 1.5px solid #000; 
}

thead th {
  background: #093e5e;
  color: #fff;
  font-weight: 600;
  font-size: 9.5px;
  padding: 5px;
  border: 1px solid #000;
}

th, td {
  border: 1px solid #444; 
  padding: 4px;
  text-align: center;
  font-size: 9px;
}

th.horario,
td.horario {
  width: 48px;
  font-size: 8.5px;
  background: #093e5e;
  color: #ffffff;
  font-weight: 600;
  border: 1px solid #000;
}

td.disciplina {
  height: 30px;
  vertical-align: middle;
  background: #ffffff;
}

tbody tr td.disciplina {
  background: #ffffff;
}

.legend {
  margin-top: 6px;
  font-size: 8.5px;
}

.legend-title {
  font-weight: 600;
  color: #5b4b8a;
  margin-bottom: 3px;
}

.legend-item {
  margin-bottom: 2px;
}

footer {
  margin-top: 16px;
  border-top: 1px solid #999;
  padding-top: 5px;
  text-align: center;
  font-size: 7.5px;
  color: #6b7c8a;
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
    <div><strong>Coordenação:</strong> <span class="coordenador">${coordenador || '-'}</span></div>
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
          ${linha.celulas.map(c => `<td class="disciplina">${c || ''}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${semestre.professores && semestre.professores.length ? `
  <div class="legend">
    <div class="legend-title">Legenda</div>
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
  Universidade Federal de Ciências da Saúde de Porto Alegre
</footer>

</body>
</html>
  `;
};