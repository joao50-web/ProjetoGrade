const { Curriculo } = require('../models');

function normalizarDescricao(valor) {
  if (valor === undefined || valor === null) return null;
  return String(valor).trim();
}

exports.getOrCreate = async (req, res) => {
  try {
    const descricao = normalizarDescricao(req.body.descricao);

    if (!descricao) {
      return res.status(400).json({ error: 'Currículo obrigatório' });
    }

    if (!/^\d{4}$/.test(descricao)) {
      return res.status(400).json({ error: 'Currículo inválido (use YYYY)' });
    }

    const [curriculo] = await Curriculo.findOrCreate({
      where: { descricao },
      defaults: { descricao }
    });

    return res.json(curriculo);
  } catch (error) {
    console.error('Erro ao processar currículo:', error);
    return res.status(500).json({ error: 'Erro ao processar currículo' });
  }
};

exports.findAll = async (req, res) => {
  try {
    const curriculos = await Curriculo.findAll({
      order: [['descricao', 'DESC']]
    });

    return res.json(curriculos);
  } catch (error) {
    console.error('Erro ao listar currículos:', error);
    return res.status(500).json({ error: 'Erro ao listar currículos' });
  }
};
