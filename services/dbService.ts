
import { Student, Booking, Settings } from '../types';
import localforage from 'localforage';

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
    // localforage doesn't use storage events, so we'll rely on our own notifications
  }

  private async notifyStudents() {
    const data = await this.getLocal<Student>(COLLECTIONS.STUDENTS);
    this.studentCallbacks.forEach(cb => cb(data));
  }

  private async notifyBookings() {
    const data = await this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    this.bookingCallbacks.forEach(cb => cb(data));
  }

  setConnectionCallback(cb: (active: boolean) => void) {
    this.onConnectionChange = cb;
    cb(false);
  }

  private async getLocal<T>(key: string): Promise<T[]> {
    const data = await localforage.getItem<T[]>(`libri_${key}`);
    return data || [];
  }

  private async setLocal<T>(key: string, data: T[]) {
    await localforage.setItem(`libri_${key}`, data);
  }

  async subscribeToStudents(callback: (students: Student[]) => void) {
    this.studentCallbacks.add(callback);
    const data = await this.getLocal<Student>(COLLECTIONS.STUDENTS);
    callback(data);
    return () => {
      this.studentCallbacks.delete(callback);
    };
  }

  async subscribeToBookings(callback: (bookings: Booking[]) => void) {
    this.bookingCallbacks.add(callback);
    const data = await this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    callback(data);
    return () => {
      this.bookingCallbacks.delete(callback);
    };
  }

  async saveStudent(student: Student): Promise<void> {
    const local = await this.getLocal<Student>(COLLECTIONS.STUDENTS);
    const index = local.findIndex(s => s.id === student.id);
    if (index > -1) local[index] = student;
    else local.push(student);
    await this.setLocal(COLLECTIONS.STUDENTS, local);
    this.notifyStudents();
  }

  async deleteStudent(id: string): Promise<void> {
    const local = (await this.getLocal<Student>(COLLECTIONS.STUDENTS)).filter(s => s.id !== id);
    await this.setLocal(COLLECTIONS.STUDENTS, local);
    
    const localBookings = (await this.getLocal<Booking>(COLLECTIONS.BOOKINGS)).filter(b => b.studentId !== id);
    await this.setLocal(COLLECTIONS.BOOKINGS, localBookings);
    
    this.notifyStudents();
    this.notifyBookings();
  }

  async saveBooking(booking: Booking): Promise<void> {
    const local = await this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    const index = local.findIndex(b => b.id === booking.id);
    if (index > -1) local[index] = booking;
    else local.push(booking);
    await this.setLocal(COLLECTIONS.BOOKINGS, local);
    this.notifyBookings();
  }

  async deleteBooking(id: string): Promise<void> {
    const local = (await this.getLocal<Booking>(COLLECTIONS.BOOKINGS)).filter(b => b.id !== id);
    await this.setLocal(COLLECTIONS.BOOKINGS, local);
    this.notifyBookings();
  }

  async getSettings(): Promise<Settings> {
    const localSettings = await localforage.getItem<Settings>(`libri_${COLLECTIONS.SETTINGS}`);
    return localSettings || defaultSettings;
  }

  async saveSettings(settings: Settings): Promise<void> {
    await localforage.setItem(`libri_${COLLECTIONS.SETTINGS}`, settings);
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
