import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Major from './Major';
import Subject from './Subject';

interface CurriculumAttributes {
  id: number;
  majorId: number;
  subjectId: number;
  semesterNumber: number; // 1 to 8
}

interface CurriculumCreationAttributes extends Optional<CurriculumAttributes, 'id'> {}

class Curriculum extends Model<CurriculumAttributes, CurriculumCreationAttributes> implements CurriculumAttributes {
  public id!: number;
  public majorId!: number;
  public subjectId!: number;
  public semesterNumber!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Curriculum.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Subject,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    semesterNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 8,
      },
    },
  },
  {
    sequelize,
    tableName: 'curriculums',
  }
);

Major.hasMany(Curriculum, { foreignKey: 'majorId', as: 'curriculums' });
Curriculum.belongsTo(Major, { foreignKey: 'majorId', as: 'major' });

Subject.hasMany(Curriculum, { foreignKey: 'subjectId', as: 'curriculums' });
Curriculum.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });

export default Curriculum;
