const { Pessoa, Cargo, Usuario } = require("../models");
const { Op } = require("sequelize");

/* ================= CRIAR PESSOA ================= */
exports.create = async (req, res) => {
  try {
    const pessoa = await Pessoa.create(req.body);
    return res.status(201).json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar pessoa" });
  }
};

/* ================= LISTAR PESSOAS ================= */
exports.findAll = async (req, res) => {
  try {
    const pessoas = await Pessoa.findAll({
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "descricao"]
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "login"]
        }
      ],
      order: [["nome", "ASC"]]
    });

    return res.json(pessoas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar pessoas" });
  }
};

/* ================= BUSCAR POR ID ================= */
exports.findById = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "descricao"]
        },
        {
          model: Usuario,
          as: "usuario",
          attributes: ["id", "login"]
        }
      ]
    });

    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }

    return res.json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar pessoa" });
  }
};

/* ================= ATUALIZAR PESSOA ================= */
exports.update = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id);

    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }

    await pessoa.update(req.body);
    return res.json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar pessoa" });
  }
};

/* ================= COORDENADORES ================= */
exports.findCoordenadores = async (req, res) => {
  try {
    // Busca cargos que contenham "Coordenador" no nome
    const cargosCoordenador = await Cargo.findAll({
      where: {
        descricao: {
          [Op.like]: "%Coordenador%"
        }
      }
    });

    if (!cargosCoordenador.length) {
      return res.json([]);
    }

    const cargoIds = cargosCoordenador.map(c => c.id);

    const coordenadores = await Pessoa.findAll({
      where: {
        cargo_id: {
          [Op.in]: cargoIds
        }
      },
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "descricao"]
        }
      ],
      order: [["nome", "ASC"]]
    });

    return res.json(coordenadores);
  } catch (error) {
    console.error("Erro ao buscar coordenadores:", error);
    return res.status(500).json({ error: "Erro ao buscar coordenadores" });
  }
};

/* ================= REMOVER PESSOA ================= */
exports.remove = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [
        {
          model: Usuario,
          as: "usuario"
        }
      ]
    });

    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }

    if (pessoa.usuario) {
      return res.status(400).json({
        error: "Pessoa possui usuário e não pode ser removida"
      });
    }

    await pessoa.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao remover pessoa" });
  }
};
