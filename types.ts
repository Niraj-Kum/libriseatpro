
export type FeeStatus = 'Paid' | 'Due' | 'Partial';

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  defaultPrice?: number;
}

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  seatNumber: number;
  startDate: string; // ISO YYYY-MM-DD
  endDate: string;   // ISO YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  daysOfWeek: number[]; // 0 (Sun) - 6 (Sat)
  amount: number;
  paidAmount: number;
  feeStatus: FeeStatus;
  createdAt: string;
}

export interface Settings {
  totalSeats: number;
}

export interface DashboardStats {
  totalSeats: number;
  liveOccupancy: number;
  totalRevenue: number;
  totalDues: number;
}
