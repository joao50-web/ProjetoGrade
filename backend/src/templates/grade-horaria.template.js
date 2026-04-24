module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres,
}) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 6mm 2mm; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10px;
    color: #1f2d3d;
  }

  .header {
    text-align: center;
    margin-bottom: 25px;
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
    margin-bottom: 10px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px 14px;
  }

  .info strong { color: #093e5e; }

  .info .coordenador {
    font-weight: 600;
    color: #1a5f3a;
  }

  .semester {
    margin-bottom: 12px;
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
    font-size: 8.5px;
    padding: 4px;
    border: 1px solid #000;
  }

  th, td {
    border: 1px solid #444;
    padding: 10px;
    text-align: center;
    font-size: 8px;
  }

  th.horario, td.horario {
    width: 90px;
    background: #093e5e;
    color: #fff;
    font-weight: 600;
    font-size: 8px;
    border: 1px solid #000;
  }

  td.disciplina {
    height: 5px;
    padding: 3px 3px;
    font-size: 8.8px;
    line-height: 1.05;
    vertical-align: middle;
    background: #fff;
  }

  footer {
    margin-top: 10px;
    border-top: 1px solid #999;
    padding-top: 4px;
    text-align: center;
    font-size: 7.5px;
    color: #6b7c8a;
  }
</style>
</head>
<body>

<div class="header">
  <h1>${universidade}</h1>
  <h2>Grade Horária</h2>
</div>

<div class="info">
  <div class="info-grid">
    <div><strong>Curso:</strong> ${curso}</div>
    <div><strong>Currículo:</strong> ${curriculo}</div>
    <div><strong>Ano Letivo:</strong> ${anoLetivo}</div>
    <div>
      <strong>Coordenação:</strong>
      <span class="coordenador">${coordenador}</span>
    </div>
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
      ${[
        // ===== HORÁRIOS COMPLETOS =====
        '08:00-08:50',
        '08:50-09:40',
        '09:40-10:30',
        '10:30-11:20',
        '11:20-12:10',

        '13:20-14:10',
        '14:10-15:00',
        '15:00-15:50',
        '15:50-16:40',
        '16:40-17:30',
        '17:30-18:20',

        '18:20-19:10',
        '19:10-20:00',
        '20:00-20:50',
        '20:50-21:40',
        '21:40-22:30'
      ].map((horario, i) => `
        <tr>
          <td class="horario">${horario}</td>

          ${semestre.dias.map((_, colIndex) => {
            const linha = semestre.linhas[i];
            const celula = linha?.celulas?.[colIndex];

            const limpo = celula
              ? celula.replace(/\s*\(teste\s*\d*\)/gi, '').trim()
              : '';

            return `<td class="disciplina">${limpo || ''}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
</div>
`).join('')}

<footer>Universidade Federal de Ciências da Saúde de Porto Alegre</footer>

</body>
</html>
  `;
};