import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Course from './Course';

class Resource extends Model {
  public id!: number;
  public title!: string;
  public type!: string;
  public url!: string;
  public classId!: number;
  public uploadDate!: string;
}

Resource.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING, // PDF, SLIDE, DOC, etc.
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: 'id',
      },
    },
    uploadDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Resource',
  }
);

export default Resource;
