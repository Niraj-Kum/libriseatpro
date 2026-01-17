
import { useState, useEffect } from 'react';
import { exportDatabase, importDatabase } from '../services/database';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { initGoogleDrive, signIn, uploadToDrive, restoreFromDrive } from '../services/googleDrive';

const BackupRestore = () => {
  const [message, setMessage] = useState('');
  const [isGoogleDriveReady, setIsGoogleDriveReady] = useState(false);

  useEffect(() => {
    initGoogleDrive((isSignedIn) => {
      setIsGoogleDriveReady(isSignedIn);
    });
  }, []);

  const handleBackup = async () => {
    try {
      const data = await exportDatabase();
      const jsonString = JSON.stringify(data, null, 2);
      
      const result = await Filesystem.writeFile({
        path: 'database_backup.json',
        data: jsonString,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      setMessage(`Backup created successfully at: ${result.uri}`);
    } catch (err) {
      console.error('Error creating backup', err);
      setMessage('Error creating backup');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await Filesystem.readFile({
        path: 'database_backup.json',
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      await importDatabase(result.data as string);
      setMessage('Database restored successfully');
    } catch (err) {
      console.error('Error restoring database', err);
      setMessage('Error restoring database');
    }
  };

  const handleGoogleDriveBackup = async () => {
    try {
      const data = await exportDatabase();
      const jsonString = JSON.stringify(data, null, 2);
      await uploadToDrive('database_backup.json', jsonString);
      setMessage('Backup to Google Drive successful!');
    } catch (err) {
      console.error('Error backing up to Google Drive', err);
      setMessage('Error backing up to Google Drive');
    }
  };

  const handleGoogleDriveRestore = async () => {
    try {
      const data = await restoreFromDrive('database_backup.json');
      if (data) {
        await importDatabase(data);
        setMessage('Database restored successfully from Google Drive');
      } else {
        setMessage('No backup found in Google Drive');
      }
    } catch (err) {
      console.error('Error restoring from Google Drive', err);
      setMessage('Error restoring from Google Drive');
    }
  };


  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Backup & Restore</h2>
      <div className="space-y-4">
        <button 
          onClick={handleBackup}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Backup to Device
        </button>
        <button 
          onClick={handleRestore}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4"
        >
          Restore from Device
        </button>
        
        {!isGoogleDriveReady ? (
          <button 
            onClick={signIn}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Connect to Google Drive
          </button>
        ) : (
          <>
            <button
              onClick={handleGoogleDriveBackup}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            >
              Backup to Google Drive
            </button>
            <button
              onClick={handleGoogleDriveRestore}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ml-4 mt-4"
            >
              Restore from Google Drive
            </button>
          </>
        )}

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default BackupRestore;
