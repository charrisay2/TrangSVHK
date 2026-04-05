import { Request, Response } from "express";
import Course from "../models/Course";
import User from "../models/User";
import Invoice from "../models/Invoice";
import Notification from "../models/Notification";
import Enrollment from "../models/Enrollment";
import Room from "../models/Room";
import Major from "../models/Major";
import Class from "../models/Class";
import Semester from "../models/Semester";

import { Op } from "sequelize";

// @desc    Get available resources (rooms and teachers)
// @route   GET /api/courses/available-resources
// @access  Private
export const getAvailableResources = async (req: Request, res: Response) => {
  try {
    const { schedule, semesterId, excludeCourseId, majorId } = req.query;

    if (!schedule || !semesterId) {
      return res
        .status(400)
        .json({ message: "Missing schedule or semesterId" });
    }

    // Find all courses with the same schedule in the same semester
    const whereClause: any = {
      schedule: schedule as string,
      semesterId: semesterId as string,
    };

    if (excludeCourseId) {
      whereClause.id = { [Op.ne]: excludeCourseId };
    }

    const conflictingCourses = await Course.findAll({
      where: whereClause,
      attributes: ["roomId", "teacherId"],
    });

    const occupiedRoomIds = conflictingCourses
      .map((c) => c.roomId)
      .filter(Boolean);
    const occupiedTeacherIds = conflictingCourses
      .map((c) => c.teacherId)
      .filter(Boolean);

    // Get all rooms not in occupiedRoomIds
    const roomWhereClause: any = {
      status: "ACTIVE",
    };
    if (occupiedRoomIds.length > 0) {
      roomWhereClause.id = { [Op.notIn]: occupiedRoomIds };
    }

    const availableRooms = await Room.findAll({
      where: roomWhereClause,
    });

    // Determine department filter based on majorId
    let departmentIdFilter: any = undefined;
    if (majorId) {
      const major = await Major.findByPk(majorId as string);
      if (major) {
        departmentIdFilter = major.departmentId;
      }
    }

    // Get all teachers not in occupiedTeacherIds, and optionally filter by department
    const teacherWhereClause: any = {
      role: "TEACHER",
      ...(occupiedTeacherIds.length > 0
        ? { id: { [Op.notIn]: occupiedTeacherIds } }
        : {}),
    };

    if (departmentIdFilter) {
      teacherWhereClause.departmentId = departmentIdFilter;
    }

    const availableTeachers = await User.findAll({
      where: teacherWhereClause,
      attributes: ["id", "name", "email"],
    });

    res.json({
      rooms: availableRooms,
      teachers: availableTeachers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.findAll({
      include: [
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    const formattedCourses = courses.map((c) => {
      const plain = c.get({ plain: true }) as any;
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
      return plain;
    });

    res.json(formattedCourses);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "teacher",
          attributes: ["id", "name", "email"],
        },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    if (course) {
      const plain = course.get({ plain: true }) as any;
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Admin/Teacher
export const createCourse = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      teacherId,
      roomId,
      schedule,
      type,
      majorId,
      classId,
      credits,
      semesterId,
      totalPeriods,
      weeks,
    } = req.body;

    const course = await Course.create({
      name,
      code,
      teacherId,
      roomId,
      schedule,
      type,
      majorId,
      classId,
      credits: credits || 3,
      semesterId,
      totalPeriods: totalPeriods || 45,
      weeks: weeks || 10,
    });

    const createdCourse = await Course.findByPk(course.id, {
      include: [
        { model: User, as: "teacher", attributes: ["id", "name", "email"] },
        { model: Room, as: "room" },
        { model: Major, as: "major" },
        { model: Class, as: "targetClass" },
        { model: Semester, as: "semester" },
        {
          model: User,
          as: "enrolledStudents",
          attributes: ["id"],
          through: { attributes: [] },
        },
      ],
    });

    const plain = createdCourse?.get({ plain: true }) as any;
    if (plain) {
      plain.students = plain.enrolledStudents
        ? plain.enrolledStudents.map((s: any) => s.id)
        : [];
      delete plain.enrolledStudents;
    }

    res.status(201).json(plain);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin/Teacher
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);

    if (course) {
      course.name = req.body.name || course.name;
      course.code = req.body.code || course.code;
      course.teacherId = req.body.teacherId || course.teacherId;
      course.roomId = req.body.roomId || course.roomId;
      course.schedule = req.body.schedule || course.schedule;
      course.type = req.body.type || course.type;
      course.majorId = req.body.majorId || course.majorId;
      course.classId = req.body.classId || course.classId;
      course.credits = req.body.credits || course.credits;
      course.semesterId = req.body.semesterId || course.semesterId;
      course.totalPeriods = req.body.totalPeriods || course.totalPeriods;
      course.weeks = req.body.weeks || course.weeks;

      await course.save();

      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }

      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Register for a course
// @route   POST /api/courses/:id/register
// @access  Private/Student
export const registerCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const studentId = req.user?.id;

    console.log(
      `Registration attempt: studentId=${studentId}, courseId=${req.params.id}`,
    );

    if (!studentId) {
      console.log("Registration failed: User not authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (course) {
      console.log(`Course found: ${course.id}, name: ${course.name}`);
      const existingEnrollment = await Enrollment.findOne({
        where: { courseId: course.id, studentId },
      });

      if (existingEnrollment) {
        console.log("Registration failed: Already registered");
        return res
          .status(400)
          .json({ message: "Already registered for this course" });
      }

      await Enrollment.create({
        courseId: course.id,
        studentId,
        status: "Enrolled",
      });
      console.log("Enrollment created");

      // Create invoice for the course
      const credits = course.credits || 3;
      let amount = 0;
      if (credits === 2) {
        amount = 2000;
      } else if (credits === 3) {
        amount = 3000;
      } else {
        amount = credits * 1000;
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // Due in 14 days

      await Invoice.create({
        studentId,
        title: `Học phí môn ${course.name} (${course.code})`,
        amount,
        dueDate: dueDate.toLocaleDateString("vi-VN"),
        status: "Unpaid",
      });

      await Notification.create({
        message: `Bạn có hóa đơn học phí mới cho môn ${course.name}`,
        type: "FEE_REMINDER",
        targetRole: "STUDENT",
        targetUserId: studentId,
        isRead: false,
      });

      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }

      console.log("Registration successful");
      res.json(plain);
    } else {
      console.log("Registration failed: Course not found");
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Unregister from a course
// @route   POST /api/courses/:id/unregister
// @access  Private/Student
export const unregisterCourse = async (req: Request, res: Response) => {
  try {
    const course = await Course.findByPk(req.params.id);
    const studentId = req.user?.id;

    if (!studentId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (course) {
      const enrollment = await Enrollment.findOne({
        where: { courseId: course.id, studentId },
      });

      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }

      // Check 3-hour restriction
      const now = new Date();
      const createdAt = new Date(enrollment.createdAt);
      const diffInHours =
        (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (diffInHours > 3) {
        return res
          .status(400)
          .json({
            message: "Không thể hủy đăng ký sau 3 giờ kể từ khi đăng ký",
          });
      }

      await enrollment.destroy();

      // Find and delete the unpaid invoice for this course
      const invoiceTitle = `Học phí môn ${course.name} (${course.code})`;
      await Invoice.destroy({
        where: {
          studentId,
          title: invoiceTitle,
          status: "Unpaid",
        },
      });

      const updatedCourse = await Course.findByPk(course.id, {
        include: [
          { model: User, as: "teacher", attributes: ["id", "name", "email"] },
          { model: Room, as: "room" },
          { model: Major, as: "major" },
          { model: Class, as: "targetClass" },
          { model: Semester, as: "semester" },
          {
            model: User,
            as: "enrolledStudents",
            attributes: ["id"],
            through: { attributes: [] },
          },
        ],
      });

      const plain = updatedCourse?.get({ plain: true }) as any;
      if (plain) {
        plain.students = plain.enrolledStudents
          ? plain.enrolledStudents.map((s: any) => s.id)
          : [];
        delete plain.enrolledStudents;
      }

      res.json(plain);
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Unregistration error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    console.log(`Attempting to delete course with ID: ${req.params.id}`);
    const course = await Course.findByPk(req.params.id);

    if (course) {
      await course.destroy();
      console.log(`Course ${req.params.id} deleted successfully`);
      res.json({ message: "Course removed" });
    } else {
      res.status(404).json({ message: "Course not found" });
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
