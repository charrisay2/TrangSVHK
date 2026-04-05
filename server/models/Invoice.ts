import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface InvoiceAttributes {
  id: number;
  studentId: number;
  title: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid';
}

interface InvoiceCreationAttributes extends Optional<InvoiceAttributes, 'id'> {}

class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
  public id!: number;
  public studentId!: number;
  public title!: string;
  public amount!: number;
  public dueDate!: string;
  public status!: 'Paid' | 'Unpaid';

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invoice.init(
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
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('Paid', 'Unpaid'),
      allowNull: false,
      defaultValue: 'Unpaid',
    },
  },
  {
    sequelize,
    tableName: 'invoices',
  }
);

Invoice.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
User.hasMany(Invoice, { foreignKey: 'studentId', as: 'invoices' });

export default Invoice;
