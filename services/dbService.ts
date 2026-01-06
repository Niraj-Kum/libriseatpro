
/**
 * LIBRISEAT PRO - CLOUD DATABASE SERVICE
 * 
 * FIX: "Component firestore has not been registered yet"
 * This usually occurs if the Firestore SDK is accessed before the side-effect 
 * registration is completed or due to version mismatches in the registry.
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot,
  query,
  where,
  writeBatch,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { Student, Booking, Settings } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyCThRPucwvzGo7zchfbiu1UzR3ttoLRlsg",
  authDomain: "libriseat-pro.firebaseapp.com",
  projectId: "libriseat-pro",
  storageBucket: "libriseat-pro.firebasestorage.app",
  messagingSenderId: "653337637288",
  appId: "1:653337637288:web:6acb953b3f128a62c42d9d",
  measurementId: "G-3R93QQ4YV7"
}

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
  private db: Firestore | null = null;
  public isCloudActive: boolean = false;
  private onConnectionChange: ((active: boolean) => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      // 1. Initialize or Retrieve Firebase App
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      
      /**
       * 2. Initialize Firestore
       * We use initializeFirestore instead of getFirestore to explicitly define
       * settings and ensure a clean registration cycle.
       */
      try {
        this.db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
        console.log("Firestore Registry: Success (Advanced Mode)");
      } catch (e) {
        console.warn("Falling back to standard Firestore initialization...");
        this.db = getFirestore(app);
      }
      
      console.log("Firebase system initialized successfully.");
    } catch (e) {
      console.error("Firebase Critical Initialization Failure:", e);
      this.db = null;
    }
  }

  setConnectionCallback(cb: (active: boolean) => void) {
    this.onConnectionChange = cb;
  }

  private getLocal<T>(key: string): T[] {
    const data = localStorage.getItem(`libri_${key}`);
    return data ? JSON.parse(data) : [];
  }

  private setLocal<T>(key: string, data: T[]) {
    localStorage.setItem(`libri_${key}`, JSON.stringify(data));
  }

  subscribeToStudents(callback: (students: Student[]) => void) {
    if (!this.db) {
      callback(this.getLocal<Student>(COLLECTIONS.STUDENTS));
      return () => {};
    }

    return onSnapshot(collection(this.db, COLLECTIONS.STUDENTS), 
      (snapshot) => {
        this.isCloudActive = true;
        this.onConnectionChange?.(true);
        const students = snapshot.docs.map(doc => doc.data() as Student);
        this.setLocal(COLLECTIONS.STUDENTS, students);
        callback(students);
      },
      (error) => {
        console.warn("Student Sync Link Issue:", error.code);
        if (error.code === 'permission-denied') {
          this.isCloudActive = false;
          this.onConnectionChange?.(false);
        }
        callback(this.getLocal<Student>(COLLECTIONS.STUDENTS));
      }
    );
  }

  subscribeToBookings(callback: (bookings: Booking[]) => void) {
    if (!this.db) {
      callback(this.getLocal<Booking>(COLLECTIONS.BOOKINGS));
      return () => {};
    }

    return onSnapshot(collection(this.db, COLLECTIONS.BOOKINGS), 
      (snapshot) => {
        this.isCloudActive = true;
        this.onConnectionChange?.(true);
        const bookings = snapshot.docs.map(doc => doc.data() as Booking);
        this.setLocal(COLLECTIONS.BOOKINGS, bookings);
        callback(bookings);
      },
      (error) => {
        console.warn("Booking Sync Link Issue:", error.code);
        if (error.code === 'permission-denied') {
          this.isCloudActive = false;
          this.onConnectionChange?.(false);
        }
        callback(this.getLocal<Booking>(COLLECTIONS.BOOKINGS));
      }
    );
  }

  async saveStudent(student: Student): Promise<void> {
    const local = this.getLocal<Student>(COLLECTIONS.STUDENTS);
    const index = local.findIndex(s => s.id === student.id);
    if (index > -1) local[index] = student;
    else local.push(student);
    this.setLocal(COLLECTIONS.STUDENTS, local);

    if (this.db) {
      try {
        await setDoc(doc(this.db, COLLECTIONS.STUDENTS, student.id), student);
      } catch (e) {
        console.error("Cloud update failed, data remains in local cache.");
      }
    }
  }

  async deleteStudent(id: string): Promise<void> {
    const local = this.getLocal<Student>(COLLECTIONS.STUDENTS).filter(s => s.id !== id);
    this.setLocal(COLLECTIONS.STUDENTS, local);

    if (this.db) {
      try {
        const batch = writeBatch(this.db);
        batch.delete(doc(this.db, COLLECTIONS.STUDENTS, id));
        const bookingsQuery = query(collection(this.db, COLLECTIONS.BOOKINGS), where("studentId", "==", id));
        const bookingsSnapshot = await getDocs(bookingsQuery);
        bookingsSnapshot.forEach((bookingDoc) => batch.delete(bookingDoc.ref));
        await batch.commit();
      } catch (e) {
        console.error("Cloud deletion deferred.");
      }
    }
  }

  async saveBooking(booking: Booking): Promise<void> {
    const local = this.getLocal<Booking>(COLLECTIONS.BOOKINGS);
    const index = local.findIndex(b => b.id === booking.id);
    if (index > -1) local[index] = booking;
    else local.push(booking);
    this.setLocal(COLLECTIONS.BOOKINGS, local);

    if (this.db) {
      try {
        await setDoc(doc(this.db, COLLECTIONS.BOOKINGS, booking.id), booking);
      } catch (e) {
        console.error("Cloud booking sync failed.");
      }
    }
  }

  async deleteBooking(id: string): Promise<void> {
    const local = this.getLocal<Booking>(COLLECTIONS.BOOKINGS).filter(b => b.id !== id);
    this.setLocal(COLLECTIONS.BOOKINGS, local);

    if (this.db) {
      try {
        await deleteDoc(doc(this.db, COLLECTIONS.BOOKINGS, id));
      } catch (e) {
        console.error("Cloud deletion failed.");
      }
    }
  }

  async getSettings(): Promise<Settings> {
    const localSettings = localStorage.getItem(`libri_${COLLECTIONS.SETTINGS}`);
    const parsedLocal = localSettings ? JSON.parse(localSettings) : defaultSettings;

    if (this.db) {
      try {
        const docSnap = await getDoc(doc(this.db, COLLECTIONS.SETTINGS, 'global'));
        if (docSnap.exists()) {
          return docSnap.data() as Settings;
        }
      } catch (e) {
        console.warn("Settings sync failed, using local.");
      }
    }
    return parsedLocal;
  }

  async saveSettings(settings: Settings): Promise<void> {
    localStorage.setItem(`libri_${COLLECTIONS.SETTINGS}`, JSON.stringify(settings));
    if (this.db) {
      try {
        await setDoc(doc(this.db, COLLECTIONS.SETTINGS, 'global'), settings);
      } catch (e) {
        console.error("Cloud settings update deferred.");
      }
    }
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
