import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

export interface GradeAttributes {
  id: number;
  studentId: number;
  courseId: number;
  midterm: number;
  final: number;
  semester: string;
}

export interface GradeCreationAttributes extends Omit<GradeAttributes, 'id'> {}

export class Grade extends Model<GradeAttributes, GradeCreationAttributes> implements GradeAttributes {
  public id!: number;
  public studentId!: number;
  public courseId!: number;
  public midterm!: number;
  public final!: number;
  public semester!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Grade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    midterm: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    final: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    semester: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Grade',
  }
);
