
import { Student, Booking, Settings } from '../types';

const COLLECTIONS = {
  STUDENTS: 'students',
  BOOKINGS: 'bookings',
  SETTINGS: 'settings'
};

const defaultSettings: Settings = {
  totalSeats: 40,
  allowPastDates: false,
  pricePerSession: 150
};

class DatabaseManager {
  public isCloudActive: boolean = false;
  private onConnectionChange: ((active: boolean) => void) | null = null;
  private studentCallbacks: Set<(students: Student[]) => void> = new Set();
  private bookingCallbacks: Set<(bookings: Booking[]) => void> = new Set();

  constructor() {
    // Local storage based manager doesn't need external init
    window.addEventListener('storage', (e) => {
      if (e.key === `libri_${COLLECTIONS.STUDENTS}`) {
        this.notifyStudents();
      }
      if (e.key === `libri_${COLLECTIONS.BOOKINGS}`) {
        this.notifyBookings();
      }
    });
  }

  private notifyStudents() {
    const data = this.getLocal<Student>(COLLECTIONS.STUDENTS);
    this.studentCallbacks.forEach(cb => cb(data));
  }

  private notifyBookings() {
    const data = this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    this.bookingCallbacks.forEach(cb => cb(data));
  }

  setConnectionCallback(cb: (active: boolean) => void) {
    this.onConnectionChange = cb;
    // Always false now since we removed Cloud
    cb(false);
  }

  private getLocal<T>(key: string): T[] {
    const data = localStorage.getItem(`libri_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setLocal<T>(key: string, data: T[]) {
    localStorage.setItem(`libri_${key}`, JSON.stringify(data));
  }

  subscribeToStudents(callback: (students: Student[]) => void) {
    this.studentCallbacks.add(callback);
    callback(this.getLocal<Student>(COLLECTIONS.STUDENTS));
    return () => {
      this.studentCallbacks.delete(callback);
    };
  }

  subscribeToBookings(callback: (bookings: Booking[]) => void) {
    this.bookingCallbacks.add(callback);
    callback(this.getLocal<Booking>(COLLECTIONS.BOOKINGS));
    return () => {
      this.bookingCallbacks.delete(callback);
    };
  }

  async saveStudent(student: Student): Promise<void> {
    const local = this.getLocal<Student>(COLLECTIONS.STUDENTS);
    const index = local.findIndex(s => s.id === student.id);
    if (index > -1) local[index] = student;
    else local.push(student);
    this.setLocal(COLLECTIONS.STUDENTS, local);
    this.notifyStudents();
  }

  async deleteStudent(id: string): Promise<void> {
    const local = this.getLocal<Student>(COLLECTIONS.STUDENTS).filter(s => s.id !== id);
    this.setLocal(COLLECTIONS.STUDENTS, local);
    
    // Also cleanup bookings for this student
    const localBookings = this.getLocal<Booking>(COLLECTIONS.BOOKINGS).filter(b => b.studentId !== id);
    this.setLocal(COLLECTIONS.BOOKINGS, localBookings);
    
    this.notifyStudents();
    this.notifyBookings();
  }

  async saveBooking(booking: Booking): Promise<void> {
    const local = this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    const index = local.findIndex(b => b.id === booking.id);
    if (index > -1) local[index] = booking;
    else local.push(booking);
    this.setLocal(COLLECTIONS.BOOKINGS, local);
    this.notifyBookings();
  }

  async deleteBooking(id: string): Promise<void> {
    const local = this.getLocal<Booking>(COLLECTIONS.BOOKINGS).filter(b => b.id !== id);
    this.setLocal(COLLECTIONS.BOOKINGS, local);
    this.notifyBookings();
  }

  async getSettings(): Promise<Settings> {
    const localSettings = localStorage.getItem(`libri_${COLLECTIONS.SETTINGS}`);
    return localSettings ? JSON.parse(localSettings) : defaultSettings;
  }

  async saveSettings(settings: Settings): Promise<void> {
    localStorage.setItem(`libri_${COLLECTIONS.SETTINGS}`, JSON.stringify(settings));
  }

  getOccupancyStatus(bookings: Booking[], date: string, time: string): Map<number, Booking> {
    const map = new Map<number, Booking>();
    const dayIdx = new Date(date).getDay();
    
    bookings.forEach(b => {
      const isDateActive = b.startDate <= date && b.endDate >= date;
      const isDayActive = b.daysOfWeek.includes(dayIdx);
      const isTimeActive = time >= b.startTime && time <= b.endTime;
      
      if (isDateActive && isDayActive && isTimeActive) {
        map.set(b.seatNumber, b);
      }
    });
    return map;
  }
}

export const dbService = new DatabaseManager();
