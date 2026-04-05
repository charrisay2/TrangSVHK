import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Course from './Course';

interface EnrollmentAttributes {
  id: number;
  courseId: number;
  studentId: number;
  status: 'Enrolled' | 'Dropped' | 'Completed';
}

interface EnrollmentCreationAttributes extends Optional<EnrollmentAttributes, 'id' | 'status'> {}

class Enrollment extends Model<EnrollmentAttributes, EnrollmentCreationAttributes> implements EnrollmentAttributes {
  public id!: number;
  public courseId!: number;
  public studentId!: number;
  public status!: 'Enrolled' | 'Dropped' | 'Completed';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    status: {
      type: DataTypes.ENUM('Enrolled', 'Dropped', 'Completed'),
      defaultValue: 'Enrolled',
    },
  },
  {
    sequelize,
    tableName: 'enrollments',
  }
);

// Thiết lập mối quan hệ N-N giữa User (Student) và Course thông qua Enrollment
User.belongsToMany(Course, { through: Enrollment, as: 'enrolledCourses', foreignKey: 'studentId' });
Course.belongsToMany(User, { through: Enrollment, as: 'enrolledStudents', foreignKey: 'courseId' });

export default Enrollment;
