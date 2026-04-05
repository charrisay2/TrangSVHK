import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SemesterAttributes {
  id: number;
  name: string;
  year: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

interface SemesterCreationAttributes extends Optional<SemesterAttributes, 'id' | 'isActive'> {}

class Semester extends Model<SemesterAttributes, SemesterCreationAttributes> implements SemesterAttributes {
  public id!: number;
  public name!: string;
  public year!: string;
  public startDate!: Date;
  public endDate!: Date;
  public isActive!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Semester.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    year: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'semesters',
  }
);

export default Semester;
