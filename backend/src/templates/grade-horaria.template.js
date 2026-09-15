module.exports = function renderGradeHTML({
  universidade,
  curso,
  curriculo,
  coordenador,
  anoLetivo,
  semestres,
  coresDepartamentos = {},
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

  // Paleta Pastel Suave
  const PALETA_CORES = [
    "#FFF6DF", // Creme
    "#F9EBCF", // Bege
    "#F3DDB5", // Areia
    "#EBD3A9", // Ocre claro
    "#F8D8C2", // Pêssego
    "#F2C6B5", // Salmão claro
    "#F2D5D5", // Rosa claro
    "#EBD9E8", // Lilás claro
    "#DED7ED", // Roxo pastel
    "#D4DDF0", // Azul claro 1
    "#C9DFED", // Azul claro 2
    "#C4DDE3", // Azul claro 3
    "#B3E5FC", // Azul pastel 4
    "#BBDEFB", // Azul pastel 5
    "#D0E8F2", // Azul pastel 6
    "#E2E1DC", // Cinza claro
  ];

  // Função para obter uma cor pastel consistente por departamento
  function obterCorPorDepartamento(dep) {
    if (!dep) return "#E2E1DC";
    let hash = 0;
    for (let i = 0; i < dep.length; i++) {
      hash = dep.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % PALETA_CORES.length;
    return PALETA_CORES[index];
  }

  // Obter a cor da célula (da propriedade ou calculada)
  function getCorCelula(celula) {
    if (!celula) return "transparent";
    if (celula.cor) return celula.cor;
    if (celula.corFundo) return celula.corFundo;
    if (celula.corDepartamento) return celula.corDepartamento;
    if (celula.departamentoCor) return celula.departamentoCor;
    if (celula.backgroundColor) return celula.backgroundColor;
    if (celula.bg) return celula.bg;

    const dep = celula.departamento;
    if (dep && coresDepartamentos && coresDepartamentos[dep]) {
      return coresDepartamentos[dep];
    }

    if (dep) {
      return obterCorPorDepartamento(dep);
    }

    return "#E2E1DC";
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">

<head>
<meta charset="utf-8" />

<style>
* {
  box-sizing: border-box;
}

@page {
  size: A4 landscape;
  margin: 6mm 6mm;
}

body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5px;
  color: #1e293b;
  margin: 0;
  padding: 0;
  padding-bottom: 20px;
  background-color: #ffffff;
}

/* ======================================================
   HEADER
====================================================== */

.header {
  text-align: center;
  margin-top: 4px;
  margin-bottom: 18px;
}

.header h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #093e5e;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  line-height: 1.3;
}

.header h2 {
  margin: 6px 0 0 0;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.4px;
}

/* ======================================================
   INFO
====================================================== */

.info {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 8px 12px;
  margin-bottom: 20px;
  background-color: #f8fafc;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  border: none;
  font-size: 9px;
}

.info-table td {
  border: none;
  padding: 2px 6px;
  text-align: left;
  color: #334155;
}

.info-table strong {
  color: #093e5e;
}

/* ======================================================
   SEMESTRE
====================================================== */

.semester {
  margin-bottom: 16px;
  page-break-inside: avoid;
}

/* ======================================================
   TABELA (LINHAS FINAS E PRETAS)
====================================================== */

table.grade-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  border: 1px solid #000000;
}

table.grade-table th,
table.grade-table td {
  border: 1px solid #000000;
  text-align: center;
  padding: 0;
  overflow: hidden;
}

table.grade-table thead th {
  background: #093e5e;
  color: #ffffff;
  font-size: 8.5px;
  font-weight: 600;
  padding: 5px 2px;
}

/* ======================================================
   HORÁRIO
====================================================== */

th.horario,
td.horario {
  width: 65px;
  min-width: 65px;
  max-width: 65px;
  background: #093e5e;
  color: #ffffff;
  font-weight: bold;
  font-size: 8px;
  vertical-align: middle;
  text-align: center;
  padding: 2px 1px;
}

/* ======================================================
   DISCIPLINA
====================================================== */

td.disciplina {
  height: 40px; 
  min-height: 40px;
  max-height: 40px;
  vertical-align: middle; 
  line-height: 1.15;
  word-break: break-word;
  overflow-wrap: break-word;
  padding: 3px 2px;
  background-color: #ffffff;
}

.celula-content {
  text-align: center;
}

/* ======================================================
   TEXTO
====================================================== */

.linha1 {
  font-size: 8.2px;
  color: #0f172a;
  margin-bottom: 2px;
}

.linha2 {
  font-size: 8px;
  color: #1e293b;
  margin-bottom: 1px;
}

.linha3 {
  font-size: 7.5px;
  color: #334155;
  font-weight: 600;
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
  color: #64748b;
  padding-bottom: 2px;
  background-color: #ffffff;
}

</style>
</head>

<body>

<div class="header">
  <h1>${universidade || "Universidade Federal de Ciências da Saúde de Porto Alegre"}</h1>
  <h2>Grade Horária</h2>
</div>

<div class="info">
  <table class="info-table">
    <tr>
      <td><strong>Curso:</strong> ${curso || "-"}</td>
      <td><strong>Currículo:</strong> ${curriculo || "-"}</td>
      <td><strong>Ano:</strong> ${anoLetivo || "-"}</td>
      <td><strong>Coord:</strong> ${coordenador || "-"}</td>
      <td>
        <strong>Sem:</strong>
        ${
          Array.isArray(semestres)
            ? semestres.map((s) => s.descricao || s.numero || s).join(" / ")
            : "-"
        }
      </td>
    </tr>
  </table>
</div>

${(semestres || [])
  .map((semestre) => {
    const horariosComAula = HORARIOS.filter((horario) => {
      const linha = (semestre.linhas || []).find((l) => l.horario === horario);
      if (!linha || !linha.celulas) return false;
      return linha.celulas.some(
        (celula) =>
          celula && (celula.nome || celula.codigo || celula.professor || celula.departamento)
      );
    });

    return `
<div class="semester">
  <table class="grade-table">
    <thead>
      <tr>
        <th class="horario">Horário</th>
        ${(semestre.dias || []).map((d) => `<th>${d}</th>`).join("")}
      </tr>
    </thead>

    <tbody>
      ${horariosComAula
        .map((horario) => {
          const linha = (semestre.linhas || []).find((l) => l.horario === horario);

          return `
      <tr>
        <td class="horario">${horario}</td>

        ${(semestre.dias || [])
          .map((_, colIndex) => {
            const celula = linha?.celulas?.[colIndex] || {};

            const disciplinaValida =
              celula &&
              (celula.nome ||
                celula.codigo ||
                celula.professor ||
                celula.departamento);

            if (!disciplinaValida) {
              return `<td class="disciplina"></td>`;
            }

            const corDep = getCorCelula(celula);

            return `
        <td class="disciplina" style="background-color: ${corDep};">
          <div class="celula-content">
            <div class="linha1">
              ${celula.departamento ? `<strong>${celula.departamento}</strong>` : ""}
              ${celula.codigo ? ` (${celula.codigo})` : ""}
              ${celula.turma ? ` - ${celula.turma}` : ""}
            </div>

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
        })
        .join("")}
    </tbody>
  </table>
</div>
`;
  })
  .join("")}

<footer>
  ${universidade || "Universidade Federal de Ciências da Saúde de Porto Alegre"}
</footer>

</body>
</html>
`;
};