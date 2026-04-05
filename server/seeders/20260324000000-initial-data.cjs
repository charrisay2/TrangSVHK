"use strict";
const bcrypt = require("bcryptjs");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const hashedPw = await bcrypt.hash("123", 10);
    const joinDateDefault = new Date("2025-08-15");

    // ==========================================
    // 1. DEPARTMENTS & MAJORS
    // ==========================================
    await queryInterface.bulkInsert("departments", [
      {
        id: 1,
        code: "CNTT",
        name: "Khoa Công nghệ thông tin",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        code: "KT",
        name: "Khoa Kinh tế",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert("majors", [
      {
        id: 1,
        code: "IT",
        name: "Công nghệ thông tin",
        departmentId: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        code: "ECO",
        name: "Kinh tế",
        departmentId: 2,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Tạo 20 lớp (10 lớp IT, 10 lớp ECO) để chứa 800 sinh viên. Lớp vẫn giữ lại Khóa (cohort)
    const classes = [];
    for (let i = 1; i <= 10; i++) {
      classes.push({
        id: i,
        code: `K65-IT${i}`,
        name: `Lớp CNTT ${i} K65`,
        cohort: "K65",
        majorId: 1,
        createdAt: now,
        updatedAt: now,
      });
      classes.push({
        id: i + 10,
        code: `K65-ECO${i}`,
        name: `Lớp Kinh tế ${i} K65`,
        cohort: "K65",
        majorId: 2,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert("classes", classes);

    // ==========================================
    // 2. GENERATE SUBJECTS
    // ==========================================
    const subjects = [];
    const curriculums = [];
    let subjectIdCounter = 1;

    const generalSubjects = [
      "Toán cao cấp A1",
      "Toán cao cấp A2",
      "Vật lý đại cương 1",
      "Vật lý đại cương 2",
      "Triết học Mác - Lênin",
      "Tư tưởng Hồ Chí Minh",
      "Pháp luật đại cương",
      "Tiếng Anh 1",
      "Tiếng Anh 2",
      "Tiếng Anh 3",
      "Giáo dục thể chất",
      "Quốc phòng an ninh",
    ];
    const itSubjects = [
      "Nhập môn lập trình",
      "Kỹ thuật lập trình",
      "Cấu trúc dữ liệu và giải thuật",
      "Kiến trúc máy tính",
      "Hệ điều hành",
      "Mạng máy tính",
      "Cơ sở dữ liệu",
      "Phân tích thiết kế hệ thống",
      "Công nghệ phần mềm",
      "Lập trình Web",
      "Lập trình hướng đối tượng",
      "Trí tuệ nhân tạo",
      "An toàn thông tin",
      "Lập trình di động",
      "Hệ quản trị CSDL",
      "Điện toán đám mây",
      "Học máy",
      "Khai phá dữ liệu",
      "Thực tập chuyên ngành",
      "Đồ án tốt nghiệp",
    ];
    const ecoSubjects = [
      "Kinh tế vi mô",
      "Kinh tế vĩ mô",
      "Nguyên lý kế toán",
      "Toán kinh tế",
      "Thống kê kinh tế",
      "Kinh tế lượng",
      "Quản trị học",
      "Marketing căn bản",
      "Kế toán tài chính",
      "Tài chính tiền tệ",
      "Luật kinh tế",
      "Kinh tế quốc tế",
      "Tài chính doanh nghiệp",
      "Quản trị nhân sự",
      "Quản trị chuỗi cung ứng",
      "Giao dịch thương mại",
      "Thương mại điện tử",
      "Phân tích tài chính",
      "Thực tập chuyên ngành",
      "Khóa luận tốt nghiệp",
    ];

    for (let majorId = 1; majorId <= 2; majorId++) {
      const isIT = majorId === 1;
      const corePool = isIT ? itSubjects : ecoSubjects;
      const prefix = isIT ? "IT" : "ECO";

      for (let sem = 1; sem <= 8; sem++) {
        const numSubjects = sem % 2 === 0 ? 4 : 5;
        for (let i = 0; i < numSubjects; i++) {
          let subjName =
            sem <= 2
              ? i < 2
                ? generalSubjects[(sem - 1) * 2 + i]
                : corePool[(sem - 1) * 3 + (i - 2)]
              : corePool[(sem * 2 + i) % corePool.length] +
                (sem > 6 ? " nâng cao" : "");
          subjects.push({
            id: subjectIdCounter,
            code: `${prefix}${sem}0${i + 1}`,
            name: subjName,
            credits: 3,
            majorId: majorId,
            semesterNumber: sem,
            totalPeriods: 45,
            weeks: 10,
            createdAt: now,
            updatedAt: now,
          });
          curriculums.push({
            id: subjectIdCounter,
            majorId: majorId,
            subjectId: subjectIdCounter,
            semesterNumber: sem,
            createdAt: now,
            updatedAt: now,
          });
          subjectIdCounter++;
        }
      }
    }
    await queryInterface.bulkInsert("subjects", subjects);
    await queryInterface.bulkInsert("curriculums", curriculums);

    // ==========================================
    // 3. GENERATE USERS (Đã xóa cohort)
    // ==========================================
    const users = [
      {
        id: 1,
        username: "admin",
        password: hashedPw,
        name: "Quản Trị Viên",
        email: "admin@uni.edu.vn",
        phone: "0999999999",
        address: "Phòng Hành chính, Tòa A1",
        joinDate: joinDateDefault,
        role: "ADMIN",
        status: "ACTIVE",
        avatar:
          "https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const lastNames = [
      "Nguyễn",
      "Trần",
      "Lê",
      "Phạm",
      "Hoàng",
      "Huỳnh",
      "Phan",
      "Vũ",
      "Võ",
      "Đặng",
      "Bùi",
      "Đỗ",
      "Hồ",
      "Ngô",
      "Dương",
      "Lý",
    ];
    const middleNames = [
      "Văn",
      "Thị",
      "Hữu",
      "Thanh",
      "Minh",
      "Thu",
      "Đức",
      "Ngọc",
      "Hải",
      "Xuân",
    ];
    const firstNames = [
      "Anh",
      "Bình",
      "Cường",
      "Dũng",
      "Vy",
      "Phong",
      "Giang",
      "Hà",
      "Hải",
      "Linh",
      "Nhung",
      "Khoa",
      "Long",
      "Nam",
      "Nghĩa",
      "Phúc",
      "Quân",
      "Sơn",
      "Tài",
      "Tuấn",
      "Tiên",
      "Yến",
    ];
    const streets = [
      "Lê Lợi",
      "Nguyễn Huệ",
      "Trần Phú",
      "Hai Bà Trưng",
      "Nguyễn Trãi",
      "Lý Thường Kiệt",
      "Lê Duẩn",
      "Hoàng Hoa Thám",
      "Phan Đình Phùng",
      "Điện Biên Phủ",
    ];
    const cities = [
      "Hà Nội",
      "TP. Hồ Chí Minh",
      "Đà Nẵng",
      "Cần Thơ",
      "An Giang",
      "Bình Dương",
      "Đồng Nai",
      "Thừa Thiên Huế",
      "Hải Phòng",
      "Quảng Ninh",
    ];
    const phonePrefixes = [
      "090",
      "091",
      "098",
      "097",
      "032",
      "033",
      "086",
      "089",
      "070",
      "079",
    ];

    let userIdCounter = 2;
    // --- Teachers ---
    for (let i = 1; i <= 50; i++) {
      users.push({
        id: userIdCounter++,
        username: `teacher_it_${i}`,
        password: hashedPw,
        name: `${lastNames[i % lastNames.length]} ${middleNames[i % middleNames.length]} ${firstNames[i % firstNames.length]}`,
        email: `it_teacher${i}@uni.edu.vn`,
        phone:
          phonePrefixes[0] +
          String(Math.floor(1000000 + Math.random() * 9000000)).substring(1, 8),
        address: `Khoa CNTT, Tòa A2`,
        joinDate: joinDateDefault,
        role: "TEACHER",
        status: "ACTIVE",
        departmentId: 1,
        avatar: `https://ui-avatars.com/api/?name=IT+Teacher+${i}&background=random`,
        createdAt: now,
        updatedAt: now,
      });
      users.push({
        id: userIdCounter++,
        username: `teacher_eco_${i}`,
        password: hashedPw,
        name: `${lastNames[(i + 5) % lastNames.length]} ${middleNames[(i + 2) % middleNames.length]} ${firstNames[(i + 1) % firstNames.length]}`,
        email: `eco_teacher${i}@uni.edu.vn`,
        phone:
          phonePrefixes[1] +
          String(Math.floor(1000000 + Math.random() * 9000000)).substring(1, 8),
        address: `Khoa Kinh tế, Tòa A3`,
        joinDate: joinDateDefault,
        role: "TEACHER",
        status: "ACTIVE",
        departmentId: 2,
        avatar: `https://ui-avatars.com/api/?name=ECO+Teacher+${i}&background=random`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // --- Students ---
    for (let i = 1; i <= 400; i++) {
      const itCode = `25${String(i).padStart(4, "0")}`;
      users.push({
        id: userIdCounter++,
        username: itCode,
        password: hashedPw,
        name: `${lastNames[i % lastNames.length]} ${middleNames[(i * 2) % middleNames.length]} ${firstNames[(i * 3) % firstNames.length]}`,
        email: `${itCode}@student.edu.vn`,
        phone:
          phonePrefixes[i % phonePrefixes.length] +
          String(Math.floor(1000000 + Math.random() * 9000000)).substring(1, 8),
        address: `Số ${Math.floor(Math.random() * 200) + 1} ${streets[i % streets.length]}, ${cities[(i * 2) % cities.length]}`,
        joinDate: joinDateDefault,
        role: "STUDENT",
        status: "ACTIVE",
        majorId: 1,
        classId: (i % 10) + 1,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${itCode}`,
        createdAt: now,
        updatedAt: now,
      });

      const ecoCode = `25${String(i + 400).padStart(4, "0")}`;
      users.push({
        id: userIdCounter++,
        username: ecoCode,
        password: hashedPw,
        name: `${lastNames[(i + 10) % lastNames.length]} ${middleNames[(i * 3) % middleNames.length]} ${firstNames[(i * 2) % firstNames.length]}`,
        email: `${ecoCode}@student.edu.vn`,
        phone:
          phonePrefixes[(i + 3) % phonePrefixes.length] +
          String(Math.floor(1000000 + Math.random() * 9000000)).substring(1, 8),
        address: `Số ${Math.floor(Math.random() * 200) + 1} ${streets[(i + 5) % streets.length]}, ${cities[(i * 3) % cities.length]}`,
        joinDate: joinDateDefault,
        role: "STUDENT",
        status: "ACTIVE",
        majorId: 2,
        classId: (i % 10) + 11,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ecoCode}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert("users", users);

    // ==========================================
    // 4. ROOMS, SEMESTERS, COURSES
    // ==========================================
    const rooms = [];
    let roomIdCounter = 1;
    for (let b of ["A1", "A2", "A3"]) {
      for (let i = 1; i <= 10; i++) {
        rooms.push({
          id: roomIdCounter++,
          name: `${b}.${i < 10 ? `00${i}` : `010`}`,
          capacity: 40,
          building: b,
          status: "ACTIVE",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await queryInterface.bulkInsert("rooms", rooms);

    await queryInterface.bulkInsert("semesters", [
      {
        id: 1,
        name: "Học kỳ 1",
        year: "2024",
        startDate: new Date("2024-09-01"),
        endDate: new Date("2025-01-15"),
        isActive: false,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: "Học kỳ 2",
        year: "2024",
        startDate: new Date("2025-02-01"),
        endDate: new Date("2025-06-15"),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("courses", null, {});
    await queryInterface.bulkDelete("semesters", null, {});
    await queryInterface.bulkDelete("rooms", null, {});
    await queryInterface.bulkDelete("users", null, {});
    await queryInterface.bulkDelete("curriculums", null, {});
    await queryInterface.bulkDelete("subjects", null, {});
    await queryInterface.bulkDelete("classes", null, {});
    await queryInterface.bulkDelete("majors", null, {});
    await queryInterface.bulkDelete("departments", null, {});
  },
};
