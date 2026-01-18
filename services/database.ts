
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

const DB_NAME = 'my_database';

let db: SQLiteDBConnection | null = null;
let sqlite: SQLiteConnection | null = null;
let initializationPromise: Promise<SQLiteDBConnection | null> | null = null;

const initialize = async (): Promise<SQLiteDBConnection | null> => {
    try {
        const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
        const ret = await sqliteConnection.checkConnectionsConsistency();
        const isConn = ret.result;
        let connection: SQLiteDBConnection;
        if (isConn) {
            connection = await sqliteConnection.retrieveConnection(DB_NAME, false);
        } else {
            connection = await sqliteConnection.createConnection(DB_NAME, false, 'no-encryption', 1, false);
        }
        await connection.open();

        const schema = `
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            defaultPrice REAL
          );
          CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY NOT NULL,
            studentId TEXT NOT NULL,
            studentName TEXT NOT NULL,
            seatNumber INTEGER NOT NULL,
            startDate TEXT NOT NULL,
            endDate TEXT NOT NULL,
            startTime TEXT NOT NULL,
            endTime TEXT NOT NULL,
            daysOfWeek TEXT NOT NULL,
            amount REAL NOT NULL,
            paidAmount REAL NOT NULL,
            feeStatus TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE
          );
        `;
        await connection.execute(schema);
        sqlite = sqliteConnection;
        return connection;
    } catch (err) {
        console.error("Error initializing database", err);
        return null;
    }
};

export const openDatabase = async (): Promise<SQLiteDBConnection | null> => {
  if (db) {
    return db;
  }
  if (initializationPromise === null) {
    initializationPromise = initialize();
  }
  db = await initializationPromise;
  return db;
};


export const exportDatabase = async () => {
    const db = await openDatabase();
    if (!db) return null;
    return await db.exportToJson('full');
};

export const importDatabase = async (json: any) => {
    const db = await openDatabase();
    if (!db || !sqlite) return;

    // Close the existing connection
    await sqlite.closeConnection(DB_NAME, false);

    // Import the database
    const jsonToImport = JSON.parse(json);
    const result = await sqlite.importFromJson(JSON.stringify(jsonToImport));
    
    // Re-open the connection
    await openDatabase();

    return result.changes;
};

export const addUser = async (user: any) => {
  const db = await openDatabase();
  if (!db) return;
  try {
    await db.run('INSERT INTO users (email, password) VALUES (?, ?)', [user.email, user.password]);
  } catch (err) {
    console.error('Error adding user', err);
    throw err;
  }
};

export const findUser = async (user: any) => {
    const db = await openDatabase();
    if (!db) return null;
    const result = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [user.email, user.password]);
    return result.values && result.values.length > 0 ? result.values[0] : null;
};

export const getStudents = async () => {
  const db = await openDatabase();
  if (!db) return [];
  const result = await db.query('SELECT * FROM students');
  return result.values || [];
};

export const getBookings = async () => {
  const db = await openDatabase();
  if (!db) return [];
  const result = await db.query('SELECT * FROM bookings');
  return (result.values || []).map(b => ({ ...b, daysOfWeek: JSON.parse(b.daysOfWeek) }));
};

export const addStudent = async (student: any) => {
  const db = await openDatabase();
  if (!db) return;
  await db.run(
    'INSERT INTO students (id, name, phone, defaultPrice) VALUES (?, ?, ?, ?)',
    [student.id, student.name, student.phone, student.defaultPrice]
  );
};

export const addBooking = async (booking: any) => {
  const db = await openDatabase();
  if (!db) return;
  await db.run(
    'INSERT INTO bookings (id, studentId, studentName, seatNumber, startDate, endDate, startTime, endTime, daysOfWeek, amount, paidAmount, feeStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      booking.id,
      booking.studentId,
      booking.studentName,
      booking.seatNumber,
      booking.startDate,
      booking.endDate,
      booking.startTime,
      booking.endTime,
      JSON.stringify(booking.daysOfWeek),
      booking.amount,
      booking.paidAmount,
      booking.feeStatus,
      booking.createdAt,
    ]
  );
};

export const updateBooking = async (booking: any) => {
  const db = await openDatabase();
  if (!db) return;
  await db.run(
    'UPDATE bookings SET studentId = ?, studentName = ?, seatNumber = ?, startDate = ?, endDate = ?, startTime = ?, endTime = ?, daysOfWeek = ?, amount = ?, paidAmount = ?, feeStatus = ? WHERE id = ?',
    [
      booking.studentId,
      booking.studentName,
      booking.seatNumber,
      booking.startDate,
      booking.endDate,
      booking.startTime,
      booking.endTime,
      JSON.stringify(booking.daysOfWeek),
      booking.amount,
      booking.paidAmount,
      booking.feeStatus,
      booking.id,
    ]
  );
};

export const deleteBooking = async (bookingId: string) => {
  const db = await openDatabase();
  if (!db) return;
  await db.run('DELETE FROM bookings WHERE id = ?', [bookingId]);
};

export const deleteStudent = async (studentId: string) => {
  const db = await openDatabase();
  if (!db) return;
  // Bookings are deleted automatically by CASCADE
  await db.run('DELETE FROM students WHERE id = ?', [studentId]);
};

export const factoryReset = async () => {
  const db = await openDatabase();
  if (!db) return;
  await db.execute(`
    DELETE FROM bookings;
    DELETE FROM students;
    DELETE FROM users;
  `);
};
