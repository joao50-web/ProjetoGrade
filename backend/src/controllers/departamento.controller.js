const { Departamento } = require('../models');

exports.findAll = async (req, res) => {
  try {
    const departamentos = await Departamento.findAll({
      order: [['nome', 'ASC']]
    });
    return res.json(departamentos);
  } catch (error) {
    console.error("Erro ao buscar departamentos:", error);
    return res.status(500).json({
      error: 'Erro interno ao buscar departamentos',
      details: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, sigla } = req.body;

    if (!nome || !sigla) {
      return res.status(400).json({
        error: 'Nome e Sigla são obrigatórios'
      });
    }

    const departamento = await Departamento.create({ nome, sigla });

    return res.status(201).json(departamento);
  } catch (error) {
    console.error("Erro ao criar departamento:", error);
    return res.status(500).json({
      error: 'Erro ao criar departamento',
      details: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, sigla } = req.body;

    const departamento = await Departamento.findByPk(id);

    if (!departamento) {
      return res.status(404).json({
        error: 'Departamento não encontrado'
      });
    }

    await departamento.update({ nome, sigla });

    return res.json(departamento);
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao atualizar',
      details: error.message
    });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    const departamento = await Departamento.findByPk(id);

    if (!departamento) {
      return res.status(404).json({
        error: 'Departamento não encontrado'
      });
    }

    await departamento.destroy();

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao remover',
      details: error.message
    });
  }
};