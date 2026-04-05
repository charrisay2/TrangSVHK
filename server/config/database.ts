import { Sequelize } from "sequelize";

const sequelize = new Sequelize("database_development", "root", "123456", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

export default sequelize;
