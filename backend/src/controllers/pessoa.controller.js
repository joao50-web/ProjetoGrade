const { Pessoa, Cargo, Usuario } = require('../models');

/**
 * POST /pessoas
 */
exports.create = async (req, res) => {
  try {
    const pessoa = await Pessoa.create(req.body);
    return res.status(201).json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao criar pessoa' });
  }
};

/**
 * GET /pessoas
 */
exports.findAll = async (req, res) => {
  try {
    const pessoas = await Pessoa.findAll({
      include: [
        {
          model: Cargo,
          as: 'cargo' // 🔥 TEM que bater com models/index.js
        },
        {
          model: Usuario,
          as: 'usuario' // 🔥 TEM que bater com models/index.js
        }
      ],
      order: [['nome', 'ASC']]
    });

    return res.json(pessoas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pessoas' });
  }
};

/**
 * GET /pessoas/:id
 */
exports.findById = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [
        {
          model: Cargo,
          as: 'cargo'
        },
        {
          model: Usuario,
          as: 'usuario'
        }
      ]
    });

    if (!pessoa) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    return res.json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pessoa' });
  }
};

/**
 * PUT /pessoas/:id
 */
exports.update = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id);

    if (!pessoa) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    await pessoa.update(req.body);
    return res.json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
};

/**
 * GET /pessoas/coordenadores
 */
exports.findCoordenadores = async (req, res) => {
  try {
    const pessoas = await Pessoa.findAll({
      include: [
        {
          model: Cargo,
          as: 'cargo',
          where: {
            descricao: 'Coordenador'
          }
        }
      ],
      order: [['nome', 'ASC']]
    });

    return res.json(pessoas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar coordenadores' });
  }
};

/**
 * DELETE /pessoas/:id
 */
exports.remove = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: 'usuario'
        }
      ]
    });

    if (!pessoa) {
      return res.status(404).json({ error: 'Pessoa não encontrada' });
    }

    if (pessoa.usuario) {
      return res.status(400).json({
        error: 'Pessoa possui usuário e não pode ser removida'
      });
    }

    await pessoa.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao remover pessoa' });
  }
};