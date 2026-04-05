export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string | number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  role: UserRole;
  status?: 'ACTIVE' | 'RESERVED' | 'GRADUATED';
  avatar?: string;
  // Student specific
  studentId?: string;
  classId?: number;
  gpa?: number;
  cohort?: string;
  major?: any;
  majorId?: number;
  studentClass?: StudentClass;
  // Teacher specific
  teacherId?: string;
  departmentId?: number;
}

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface Major {
  id: number;
  code: string;
  name: string;
  departmentId: number;
}

export interface StudentClass {
  id: number;
  code: string;
  name: string;
  cohort: string;
  majorId: number;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  building: string;
}

export interface Semester {
  id: number;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface Class {
  id: string | number;
  name: string;
  code: string;
  teacherId: string | number;
  roomId?: number;
  schedule: string;
  students: (string | number)[]; // Array of student IDs
  type?: 'Standard' | 'Advanced'; // Standard: Theo kế hoạch, Advanced: Học vượt
  majorId?: number; // Ngành học mục tiêu
  classId?: number; // Lớp học mục tiêu
  credits?: number;
  capacity?: number;
  semesterId?: number;
  totalPeriods?: number;
  weeks?: number;
  room?: any;
  teacher?: any;
  targetClass?: any;
  targetCohort?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string | number;
  studentId: string | number;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface Grade {
  id: string;
  classId: string | number;
  studentId: string | number;
  midterm: number;
  final: number;
  semester: string;
}

export interface Resource {
  id: string;
  classId: string | number;
  title: string;
  type: 'PDF' | 'DOC' | 'SLIDE';
  url: string;
  uploadDate: string;
}

export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: 'Academic' | 'Finance' | 'General';
  content: string;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface Invoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Unpaid';
}
