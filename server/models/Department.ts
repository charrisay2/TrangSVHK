import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface DepartmentAttributes {
  id: number;
  code: string;
  name: string;
}

interface DepartmentCreationAttributes extends Optional<DepartmentAttributes, 'id'> {}

class Department extends Model<DepartmentAttributes, DepartmentCreationAttributes> implements DepartmentAttributes {
  public id!: number;
  public code!: string;
  public name!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'departments',
  }
);

export default Department;
