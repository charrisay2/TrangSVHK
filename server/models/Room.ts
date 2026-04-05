import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface RoomAttributes {
  id: number;
  name: string;
  capacity: number;
  building: string;
  status: "ACTIVE" | "CLOSED"; // Thêm trạng thái
}

interface RoomCreationAttributes extends Optional<
  RoomAttributes,
  "id" | "status"
> {}

class Room
  extends Model<RoomAttributes, RoomCreationAttributes>
  implements RoomAttributes
{
  public id!: number;
  public name!: string;
  public capacity!: number;
  public building!: string;
  public status!: "ACTIVE" | "CLOSED";

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Room.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    building: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "CLOSED"),
      allowNull: false,
      defaultValue: "ACTIVE",
    },
  },
  {
    sequelize,
    modelName: "Room",
    tableName: "rooms",
  },
);

export default Room;
