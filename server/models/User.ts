import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import bcrypt from "bcryptjs";
import Class from "./Class";
import Department from "./Department";
import Major from "./Major";

interface UserAttributes {
  id: number;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate?: string | Date;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  status: "ACTIVE" | "RESERVED" | "GRADUATED";
  avatar?: string;
  classId?: number;
  departmentId?: number;
  majorId?: number;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  "id" | "status"
> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: number;
  public username!: string;
  public password!: string;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public joinDate!: string | Date;
  public role!: "ADMIN" | "TEACHER" | "STUDENT";
  public status!: "ACTIVE" | "RESERVED" | "GRADUATED";
  public avatar!: string;
  public classId!: number;
  public departmentId!: number;
  public majorId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    joinDate: { type: DataTypes.DATE, allowNull: true },
    role: {
      type: DataTypes.ENUM("ADMIN", "TEACHER", "STUDENT"),
      allowNull: false,
      defaultValue: "STUDENT",
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "RESERVED", "GRADUATED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
    avatar: { type: DataTypes.STRING, allowNull: true },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Class, key: "id" },
      onDelete: "SET NULL",
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Department, key: "id" },
      onDelete: "SET NULL",
    },
    majorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: Major, key: "id" },
      onDelete: "SET NULL",
    },
  },
  {
    sequelize,
    tableName: "users",
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  },
);

Class.hasMany(User, { foreignKey: "classId", as: "students" });
User.belongsTo(Class, { foreignKey: "classId", as: "studentClass" });

Department.hasMany(User, { foreignKey: "departmentId", as: "teachers" });
User.belongsTo(Department, { foreignKey: "departmentId", as: "department" });

Major.hasMany(User, { foreignKey: "majorId", as: "students" });
User.belongsTo(Major, { foreignKey: "majorId", as: "major" });

export default User;
