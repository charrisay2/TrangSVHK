import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Department from './Department';

interface MajorAttributes {
  id: number;
  code: string;
  name: string;
  departmentId: number;
}

interface MajorCreationAttributes extends Optional<MajorAttributes, 'id'> {}

class Major extends Model<MajorAttributes, MajorCreationAttributes> implements MajorAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public departmentId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Major.init(
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
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Department,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'majors',
  }
);

Department.hasMany(Major, { foreignKey: 'departmentId', as: 'majors' });
Major.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

export default Major;
