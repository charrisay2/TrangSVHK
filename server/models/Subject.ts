import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Major from './Major';

interface SubjectAttributes {
  id: number;
  code: string;
  name: string;
  credits: number;
  majorId: number;
  semesterNumber: number;
  totalPeriods: number;
  weeks: number;
}

interface SubjectCreationAttributes extends Optional<SubjectAttributes, 'id'> {}

class Subject extends Model<SubjectAttributes, SubjectCreationAttributes> implements SubjectAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public credits!: number;
  public majorId!: number;
  public semesterNumber!: number;
  public totalPeriods!: number;
  public weeks!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subject.init(
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
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    majorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Major,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    semesterNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalPeriods: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 45,
    },
    weeks: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
  },
  {
    sequelize,
    tableName: 'subjects',
  }
);

// Thiết lập mối quan hệ (1 Ngành có nhiều Môn học gốc)
Subject.belongsTo(Major, { foreignKey: 'majorId', as: 'major' });
Major.hasMany(Subject, { foreignKey: 'majorId', as: 'subjects' });

export default Subject;
