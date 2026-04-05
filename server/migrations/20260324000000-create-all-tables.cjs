"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Tạo bảng departments
    await queryInterface.createTable("departments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 2. Tạo bảng rooms
    await queryInterface.createTable("rooms", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      capacity: { type: Sequelize.INTEGER, allowNull: false },
      building: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM("ACTIVE", "CLOSED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 3. Tạo bảng semesters
    await queryInterface.createTable("semesters", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      year: { type: Sequelize.STRING, allowNull: false },
      startDate: { type: Sequelize.DATE, allowNull: false },
      endDate: { type: Sequelize.DATE, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 4. Tạo bảng majors
    await queryInterface.createTable("majors", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "departments", key: "id" },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 5. Tạo bảng classes (Cột cohort VẪN ĐƯỢC GIỮ LẠI Ở ĐÂY)
    await queryInterface.createTable("classes", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      cohort: { type: Sequelize.STRING, allowNull: false },
      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "majors", key: "id" },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 6. Tạo bảng subjects
    await queryInterface.createTable("subjects", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      name: { type: Sequelize.STRING, allowNull: false },
      credits: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "majors", key: "id" },
        onDelete: "CASCADE",
      },
      semesterNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      totalPeriods: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
      },
      weeks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 7. Tạo bảng curriculums
    await queryInterface.createTable("curriculums", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      majorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "majors", key: "id" },
        onDelete: "CASCADE",
      },
      subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "subjects", key: "id" },
        onDelete: "CASCADE",
      },
      semesterNumber: { type: Sequelize.INTEGER, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 8. Tạo bảng users (Đã xóa cột cohort ở đây)
    await queryInterface.createTable("users", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.STRING, allowNull: true },
      joinDate: { type: Sequelize.DATE, allowNull: true },
      role: {
        type: Sequelize.ENUM("ADMIN", "TEACHER", "STUDENT"),
        allowNull: false,
        defaultValue: "STUDENT",
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "RESERVED", "GRADUATED"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      avatar: { type: Sequelize.STRING, allowNull: true },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "classes", key: "id" },
        onDelete: "SET NULL",
      },
      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "departments", key: "id" },
        onDelete: "SET NULL",
      },
      majorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "majors", key: "id" },
        onDelete: "SET NULL",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 9. Tạo bảng courses
    await queryInterface.createTable("courses", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false },
      teacherId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      roomId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "rooms", key: "id" },
        onDelete: "SET NULL",
      },
      schedule: { type: Sequelize.STRING, allowNull: false },
      type: {
        type: Sequelize.ENUM("Standard", "Advanced"),
        defaultValue: "Standard",
      },
      majorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "majors", key: "id" },
        onDelete: "SET NULL",
      },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: "classes", key: "id" },
        onDelete: "SET NULL",
      },
      credits: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 3 },
      semesterId: { type: Sequelize.INTEGER, allowNull: true },
      totalPeriods: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
      },
      weeks: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 10. Tạo bảng attendances
    await queryInterface.createTable("attendances", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "courses", key: "id" },
        onDelete: "CASCADE",
      },
      date: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM("Present", "Absent", "Late"),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 11. Tạo bảng enrollments
    await queryInterface.createTable("enrollments", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "courses", key: "id" },
        onDelete: "CASCADE",
      },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.ENUM("Enrolled", "Dropped", "Completed"),
        defaultValue: "Enrolled",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 12. Tạo bảng Grades
    await queryInterface.createTable("Grades", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: { type: Sequelize.INTEGER, allowNull: false },
      courseId: { type: Sequelize.INTEGER, allowNull: false },
      midterm: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      final: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0 },
      semester: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 13. Tạo bảng invoices
    await queryInterface.createTable("invoices", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      title: { type: Sequelize.STRING, allowNull: false },
      amount: { type: Sequelize.FLOAT, allowNull: false },
      dueDate: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM("Paid", "Unpaid"),
        allowNull: false,
        defaultValue: "Unpaid",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 14. Tạo bảng notifications
    await queryInterface.createTable("notifications", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: true },
      message: { type: Sequelize.STRING, allowNull: false },
      type: {
        type: Sequelize.ENUM(
          "SYSTEM",
          "CLASS_UPDATE",
          "BROADCAST",
          "FEE_REMINDER",
        ),
        allowNull: false,
        defaultValue: "SYSTEM",
      },
      targetRole: {
        type: Sequelize.ENUM("ALL", "ADMIN", "TEACHER", "STUDENT"),
        allowNull: false,
        defaultValue: "ALL",
      },
      targetUserId: { type: Sequelize.INTEGER, allowNull: true },
      classId: { type: Sequelize.INTEGER, allowNull: true },
      isRead: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 15. Tạo bảng Resources
    await queryInterface.createTable("Resources", {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      url: { type: Sequelize.STRING, allowNull: false },
      classId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "courses", key: "id" },
      },
      uploadDate: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Resources");
    await queryInterface.dropTable("notifications");
    await queryInterface.dropTable("invoices");
    await queryInterface.dropTable("Grades");
    await queryInterface.dropTable("enrollments");
    await queryInterface.dropTable("attendances");
    await queryInterface.dropTable("courses");
    await queryInterface.dropTable("users");
    await queryInterface.dropTable("curriculums");
    await queryInterface.dropTable("subjects");
    await queryInterface.dropTable("classes");
    await queryInterface.dropTable("majors");
    await queryInterface.dropTable("semesters");
    await queryInterface.dropTable("rooms");
    await queryInterface.dropTable("departments");
  },
};
