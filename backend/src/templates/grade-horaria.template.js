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

/* Garante cálculo exato de alturas e larguras incluindo paddings/borders */
* {
  box-sizing: border-box;
}

@page {
  size: A4 landscape;
  margin: 4mm 4mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5px;
  color: #1f2d3d;
  margin: 0;
  padding: 0;
  padding-bottom: 20px; /* Espaço extra para o rodapé fixo não cobrir a tabela */
  background-color: #ffffff;
}

/* ======================================================
   HEADER
====================================================== */

.header {
  text-align: center;
  margin-bottom: 15px;
}

.header h1 {
  margin: 0;
  font-size: 13px;
  color: #093e5e;
}

.header h2 {
  margin: 1px 0 0 0;
  font-size: 10.5px;
}

/* ======================================================
   INFO
====================================================== */

.info {
  border: 1px solid #bbb;
  padding: 4px 6px;
  margin-bottom: 15px;
  background-color: #f8fafc; /* Fundo bem leve para o cabeçalho de informações */
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px 6px;
  font-size: 8.5px;
}

/* ======================================================
   SEMESTRE
====================================================== */

.semester {
  margin-bottom: 15px;
  page-break-inside: avoid; /* Evita que a tabela quebre no meio da página no PDF */
}

.semester-title {
  background-color: #e2e8f0;
  color: #093e5e;
  font-weight: bold;
  font-size: 10px;
  padding: 3px 6px;
  border: 1px solid #000;
  border-bottom: none; /* Conecta o título visualmente à tabela */
  text-transform: uppercase;
  text-align: center;
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
  font-size: 9px;
  padding: 4px 1px;
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
  font-size: 8px;
}

/* ======================================================
   DISCIPLINA
====================================================== */

td.disciplina {
  height: 40px; 
  min-height: 40px;
  max-height: 40px;
  vertical-align: middle; 
  line-height: 1.1;
  word-break: break-word;
  overflow-wrap: break-word;
  padding: 1px 2px;
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
  font-size: 8.5px;
  color: #000;
  margin-bottom: 1px;
}

.linha2 {
  font-size: 8.5px;
  color: #1f2937;
  margin-bottom: 1px;
}

.linha3 {
  font-size: 7.8px;
  color: #4b5563;
  font-weight: bold;
}

/* ======================================================
   FOOTER
====================================================== */

footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 7.5px;
  padding-bottom: 0px;
  background-color: #ffffff; /* Evita conflitos com conteúdo que ultrapasse as margens */
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

${HORARIOS.filter((horario) => {
  // Encontra os dados desse horário no semestre
  const linha = (semestre.linhas || []).find((l) => l.horario === horario);
  
  if (!linha || !linha.celulas) return false;

  // Verifica se tem aula em algum dia neste horário (segunda a sábado/domingo)
  const temAulaNaSemana = linha.celulas.some(celula => 
    celula && (celula.nome || celula.codigo || celula.professor || celula.departamento)
  );

  // Retorna verdadeiro (mantém a linha) apenas se houver pelo menos uma aula
  return temAulaNaSemana;

}).map((horario) => {
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
         IGNORA DISCIPLINA INVÁLIDA (DIA VAZIO)
      ========================================= */

      const disciplinaValida =
        celula &&
        (celula.nome ||
          celula.codigo ||
          celula.professor ||
          celula.departamento);

      if (!disciplinaValida) {
        return `
      <!-- Mantém o espaço em branco apenas se os outros dias tiverem aula -->
      <td class="disciplina" style="background-color: #ffffff;">
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