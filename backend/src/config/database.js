const { Sequelize } = require("sequelize");

function firstDefined(...values) {
  return values.find(
    value => value !== undefined &&
             value !== null &&
             String(value).trim() !== ""
  );
}

const databaseUrl = firstDefined(
  process.env.DATABASE_URL,
  process.env.MYSQL_URL
);

const host = firstDefined(
  process.env.MYSQLHOST,
  process.env.DB_HOST
);

const port = Number(firstDefined(
  process.env.MYSQLPORT,
  process.env.DB_PORT,
  3306
));

const database = firstDefined(
  process.env.MYSQLDATABASE,
  process.env.DB_NAME
);

const username = firstDefined(
  process.env.MYSQLUSER,
  process.env.DB_USER
);

const password = firstDefined(
  process.env.MYSQLPASSWORD,
  process.env.DB_PASSWORD
);

const sslEnabled = ["1", "true", "yes", "sim"].includes(
  String(process.env.DB_SSL || "").trim().toLowerCase()
);

const dialectOptions = {
  connectTimeout: 10000
};

if (sslEnabled) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: String(
      process.env.DB_SSL_REJECT_UNAUTHORIZED || "false"
    ).toLowerCase() === "true"
  };
}

const config = {
  dialect: "mysql",
  logging: false,
  dialectOptions
};

let sequelize;

if (databaseUrl) {
  sequelize = new Sequelize(databaseUrl, config);
  console.log("Modo de conexão com o banco: URL");
} else {
  if (!host || !database || !username) {
    throw new Error(
      "Configuração do banco incompleta. Verifique MYSQLHOST, MYSQLDATABASE, MYSQLUSER e MYSQLPASSWORD."
    );
  }

  sequelize = new Sequelize(database, username, password, {
    ...config,
    host,
    port
  });

  console.log("Modo de conexão com o banco: variáveis individuais");
}

console.log("Host do banco:", host || "definido pela URL");
console.log("Porta do banco:", port);
console.log("SSL do banco:", sslEnabled ? "habilitado" : "desabilitado");

module.exports = sequelize;
