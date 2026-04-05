import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';

export interface AttendanceAttributes {
  id: number;
  studentId: number;
  courseId: number;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface AttendanceCreationAttributes extends Omit<AttendanceAttributes, 'id'> {}

export class Attendance extends Model<AttendanceAttributes, AttendanceCreationAttributes> implements AttendanceAttributes {
  public id!: number;
  public studentId!: number;
  public courseId!: number;
  public date!: string;
  public status!: 'Present' | 'Absent' | 'Late';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Course,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Present', 'Absent', 'Late'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'attendances',
  }
);

Attendance.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Course.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendances' });

export default Attendance;
