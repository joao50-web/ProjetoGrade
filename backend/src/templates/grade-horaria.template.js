module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres,
}) {
  const HORARIOS = [
    "08:00-08:50",
    "08:50-09:40",
    "09:40-10:30",
    "10:30-11:20",
    "11:20-12:10",
    "13:20-14:10",
    "14:10-15:00",
    "15:00-15:50",
    "15:50-16:40",
    "16:40-17:30",
    "17:30-18:20",
    "18:20-19:10",
    "19:10-20:00",
    "20:00-20:50",
    "20:50-21:40",
    "21:40-22:30",
  ];

  return `
<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="utf-8" />

<style>

@page {
  size: A4 landscape;
  margin: 2.5mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 8.5px;
  color: #1f2d3d;
  margin: 0;
  padding: 0;
}

/* ======================================================
   HEADER
====================================================== */

.header {
  text-align: center;
  margin-bottom: 4px;
}

.header h1 {
  margin: 0;
  font-size: 11px;
  color: #093e5e;
}

.header h2 {
  margin: 1px 0 0 0;
  font-size: 9px;
}

/* ======================================================
   INFO
====================================================== */

.info {
  border: 1px solid #bbb;
  padding: 4px 6px;
  margin-bottom: 4px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px 6px;
  font-size: 7.5px;
}

/* ======================================================
   SEMESTRE
====================================================== */

.semester {
  margin-bottom: 4px;
  page-break-inside: avoid;
}

.semester-title {
  font-weight: bold;
  margin-bottom: 2px;
  font-size: 8px;
  color: #093e5e;
}

/* ======================================================
   TABELA
====================================================== */

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #000;
}

th,
td {
  border: 1px solid #444;
  text-align: center;
  padding: 1px;
  overflow: hidden;
}

thead th {
  background: #093e5e;
  color: #fff;
  font-size: 7.8px;
  padding: 3px 1px;
}

/* ======================================================
   HORÁRIO
====================================================== */

th.horario,
td.horario {
  width: 60px;
  min-width: 60px;
  max-width: 60px;

  background: #093e5e;
  color: #fff;

  font-weight: bold;
  font-size: 7px;
}

/* ======================================================
   DISCIPLINA
====================================================== */

td.disciplina {
  height: 30px;
  min-height: 30px;
  max-height: 30px;

  /* Alterado para centralizar verticalmente o conteúdo */
  vertical-align: middle; 

  line-height: 1.1;

  word-break: break-word;
  overflow-wrap: break-word;

  padding: 2px;
}

/* Container flex para centralizar conteúdo */
.celula-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
}

/* ======================================================
   TEXTO
====================================================== */

.linha1 {
  font-weight: bold;
  font-size: 7.8px;
  color: #000;
  margin-bottom: 1px;
}

.linha2 {
  font-size: 7.8px;
  color: #1f2937;
  margin-bottom: 1px;
}

.linha3 {
  font-size: 7px;
  color: #4b5563;
  font-weight: bold;
}

/* ======================================================
   FOOTER
====================================================== */

footer {
  margin-top: 2px;
  text-align: center;
  font-size: 6px;
}

</style>
</head>

<body>

<div class="header">
  <h1>${universidade || "-"}</h1>
  <h2>Grade Horária</h2>
</div>

<div class="info">
  <div class="info-grid">
    <div><strong>Curso:</strong> ${curso || "-"}</div>
    <div><strong>Currículo:</strong> ${curriculo || "-"}</div>
    <div><strong>Ano:</strong> ${anoLetivo || "-"}</div>
    <div><strong>Coord:</strong> ${coordenador || "-"}</div>

    <div>
      <strong>Sem:</strong>
      ${
        Array.isArray(semestres)
          ? semestres.map((s) => s.descricao).join(" / ")
          : "-"
      }
    </div>
  </div>
</div>

${(semestres || [])
  .map(
    (semestre) => `
<div class="semester">

<div class="semester-title">
  ${semestre.descricao || "-"}
</div>

<table>

<thead>
<tr>

<th class="horario">
  Horário
</th>

${(semestre.dias || []).map((d) => `<th>${d}</th>`).join("")}

</tr>
</thead>

<tbody>

${HORARIOS.map((horario) => {
  const linha = (semestre.linhas || []).find((l) => l.horario === horario);

  return `
  <tr>

  <td class="horario">
    ${horario}
  </td>

  ${(semestre.dias || [])
    .map((_, colIndex) => {
      const celula = linha?.celulas?.[colIndex] || {};

      /* =========================================
       IGNORA DISCIPLINA INVÁLIDA
    ========================================= */

      const disciplinaValida =
        celula &&
        (celula.nome ||
          celula.codigo ||
          celula.professor ||
          celula.departamento);

      if (!disciplinaValida) {
        return `
      <td class="disciplina">
      </td>
      `;
      }

      return `
    <td class="disciplina">
      <div class="celula-container">
        ${
          celula.codigo || celula.departamento
            ? `<div class="linha1">
                ${celula.departamento || ""}
                ${celula.codigo ? ` (${celula.codigo})` : ""}
              </div>`
            : ""
        }

        ${
          celula.nome
            ? `<div class="linha2">
              ${celula.nome}
              ${celula.cargaHoraria ? ` (${celula.cargaHoraria}h)` : ""}
            </div>`
            : ""
        }
        
        ${
          celula.professor
            ? `<div class="linha3">
                ${celula.professor}
              </div>`
            : ""
        }
      </div>
    </td>
    `;
    })
    .join("")}

  </tr>
  `;
}).join("")}

</tbody>
</table>
</div>
`,
  )
  .join("")}

<footer>
Universidade Federal de Ciências da Saúde de Porto Alegre
</footer>

</body>
</html>
`;
};