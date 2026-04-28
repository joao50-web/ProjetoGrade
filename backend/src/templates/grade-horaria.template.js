module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres,
}) {
  const HORARIOS = [
    "08:00-08:50","08:50-09:40","09:40-10:30","10:30-11:20",
    "11:20-12:10","13:20-14:10","14:10-15:00","15:00-15:50",
    "15:50-16:40","16:40-17:30","17:30-18:20","18:20-19:10",
    "19:10-20:00","20:00-20:50","20:50-21:40","21:40-22:30",
  ];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 landscape; margin: 4mm 3mm; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9px;
    color: #1f2d3d;
  }

  .header {
    text-align: center;
    margin-bottom: 8px;
  }

  .header h1 {
    margin: 0;
    font-size: 12px;
    color: #093e5e;
  }

  .header h2 {
    margin: 0;
    font-size: 10px;
  }

  .info {
    border: 1px solid #bbb;
    padding: 5px 8px;
    margin-bottom: 6px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 3px 10px;
  }

  .semester {
    margin-bottom: 6px;
    page-break-inside: avoid;
  }

  .semester-title {
    font-weight: bold;
    margin-bottom: 3px;
    font-size: 9px;
    color: #093e5e;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
  }

  th, td {
    border: 1px solid #444;
    padding: 3px;
    text-align: center;
    font-size: 7.5px;
  }

  thead th {
    background: #093e5e;
    color: #fff;
    font-size: 7.5px;
    padding: 3px;
  }

  th.horario, td.horario {
    width: 75px;
    background: #093e5e;
    color: #fff;
    font-weight: bold;
    font-size: 7px;
  }

  td.disciplina {
    height: 18px;
    line-height: 1.1;
  }

  .linha1 {
    font-weight: bold;
  }

  .linha2 {
    font-size: 7px;
    color: #444;
  }

  footer {
    margin-top: 4px;
    text-align: center;
    font-size: 6.5px;
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
    <div><strong>Ano:</strong> ${anoLetivo}</div>
    <div><strong>Coord:</strong> ${coordenador}</div>
    <div><strong>Sem:</strong> ${semestres.map(s => s.descricao).join(" / ")}</div>
  </div>
</div>

${semestres.map(semestre => `
<div class="semester">
  <div class="semester-title">${semestre.descricao}</div>

  <table>
    <thead>
      <tr>
        <th class="horario">Horário</th>
        ${semestre.dias.map(d => `<th>${d}</th>`).join("")}
      </tr>
    </thead>

    <tbody>
      ${HORARIOS.map(horario => {
        const linha = semestre.linhas.find(l => l.horario === horario);

        return `
        <tr>
          <td class="horario">${horario}</td>

          ${semestre.dias.map((_, colIndex) => {
            const celula = linha?.celulas?.[colIndex] || "";

            let linha1 = "";
            let linha2 = "";

            if (celula) {
              const match = celula.match(/^([A-Z0-9]+)\s*-\s*(.*?)\s*\((.*?)\)$/);

              if (match) {
                linha1 = match[1] + " - " + match[2];
                linha2 = match[3];
              } else {
                linha1 = celula;
              }
            }

            return `
              <td class="disciplina">
                ${linha1 ? `<div class="linha1">${linha1}</div>` : ""}
                ${linha2 ? `<div class="linha2">${linha2}</div>` : ""}
              </td>
            `;
          }).join("")}
        </tr>
        `;
      }).join("")}
    </tbody>
  </table>
</div>
`).join("")}

<footer>Universidade Federal de Ciências da Saúde de Porto Alegre</footer>

</body>
</html>
  `;
};