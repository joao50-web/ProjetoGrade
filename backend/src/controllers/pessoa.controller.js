const { Pessoa, Cargo, Usuario } = require("../models");
const { Op } = require("sequelize");

/* ================= HELPER ================= */
const tratarEmail = (email) => {
  if (!email || email.trim() === "") return null;
  return email.trim();
};

/* ================= CRIAR PESSOA ================= */
exports.create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      email: tratarEmail(req.body.email), // ✅ CORREÇÃO
    };

    const pessoa = await Pessoa.create(data);
    return res.status(201).json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar pessoa" });
  }
};

/* ================= PROFESSORES ================= */
exports.findProfessores = async (req, res) => {
  try {
    const professores = await Pessoa.findAll({
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: [],
          where: {
            descricao: { [Op.like]: "%Professor%" },
          },
        },
      ],
      attributes: ["id", "nome"],
      order: [["nome", "ASC"]],
    });

    return res.json(professores);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar professores" });
  }
};

/* ================= LISTAR ================= */
exports.findAll = async (req, res) => {
  try {
    const pessoas = await Pessoa.findAll({
      include: [
        { model: Cargo, as: "cargo", attributes: ["id", "descricao"] },
        { model: Usuario, as: "usuario", attributes: ["id", "login"] },
      ],
      order: [["nome", "ASC"]],
    });

    return res.json(pessoas);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar pessoas" });
  }
};

/* ================= BUSCAR ================= */
exports.findById = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [
        { model: Cargo, as: "cargo", attributes: ["id", "descricao"] },
        { model: Usuario, as: "usuario", attributes: ["id", "login"] },
      ],
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

/* ================= ATUALIZAR ================= */
exports.update = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id);

    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }

    const data = {
      ...req.body,
      email: tratarEmail(req.body.email), // ✅ CORREÇÃO
    };

    await pessoa.update(data);
    return res.json(pessoa);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao atualizar pessoa" });
  }
};

/* ================= COORDENADORES ================= */
exports.findCoordenadores = async (req, res) => {
  try {
    const coordenadores = await Pessoa.findAll({
      include: [
        {
          model: Cargo,
          as: "cargo",
          attributes: ["id", "descricao"],
          where: {
            descricao: { [Op.like]: "%Coordenador%" },
          },
        },
      ],
      attributes: ["id", "nome"],
      order: [["nome", "ASC"]],
    });

    return res.json(coordenadores);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao buscar coordenadores" });
  }
};

/* ================= REMOVER ================= */
exports.remove = async (req, res) => {
  try {
    const pessoa = await Pessoa.findByPk(req.params.id, {
      include: [{ model: Usuario, as: "usuario" }],
    });

    if (!pessoa) {
      return res.status(404).json({ error: "Pessoa não encontrada" });
    }

    if (pessoa.usuario) {
      return res.status(400).json({
        error: "Pessoa possui usuário e não pode ser removida",
      });
    }

    await pessoa.destroy();
    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao remover pessoa" });
  }
};