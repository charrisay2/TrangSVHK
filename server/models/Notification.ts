import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { EventEmitter } from 'events';

interface NotificationAttributes {
  id: number;
  title?: string;
  message: string;
  type: 'SYSTEM' | 'CLASS_UPDATE' | 'BROADCAST' | 'FEE_REMINDER';
  targetRole: 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  targetUserId?: number; // If specific to a user
  classId?: number; // If related to a specific class
  isRead: boolean;
  createdAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'isRead'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number;
  public title?: string;
  public message!: string;
  public type!: 'SYSTEM' | 'CLASS_UPDATE' | 'BROADCAST' | 'FEE_REMINDER';
  public targetRole!: 'ALL' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  public targetUserId?: number;
  public classId?: number;
  public isRead!: boolean;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('SYSTEM', 'CLASS_UPDATE', 'BROADCAST', 'FEE_REMINDER'),
      allowNull: false,
      defaultValue: 'SYSTEM',
    },
    targetRole: {
      type: DataTypes.ENUM('ALL', 'ADMIN', 'TEACHER', 'STUDENT'),
      allowNull: false,
      defaultValue: 'ALL',
    },
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'notifications',
    hooks: {
      afterCreate: (notification) => {
        if (!global.notificationEmitter) {
          global.notificationEmitter = new EventEmitter();
        }
        global.notificationEmitter.emit('new_notification', notification);
      }
    }
  }
);

export default Notification;
