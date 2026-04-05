import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Major from './Major';

interface ClassAttributes {
  id: number;
  code: string;
  name: string;
  cohort: string;
  majorId: number;
}

interface ClassCreationAttributes extends Optional<ClassAttributes, 'id'> {}

class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public cohort!: string;
  public majorId!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Class.init(
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
    cohort: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    majorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Major,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Class',
    tableName: 'classes',
  }
);

Major.hasMany(Class, { foreignKey: 'majorId', as: 'classes' });
Class.belongsTo(Major, { foreignKey: 'majorId', as: 'major' });

export default Class;
