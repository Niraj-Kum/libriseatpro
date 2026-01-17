/* global gapi */

const API_KEY = 'YOUR_API_KEY'; // Replace with your Google API Key
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your Google Client ID

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: google.accounts.oauth2.TokenClient;

export const initGoogleDrive = (onSignedIn: (isSignedIn: boolean) => void) => {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    gapi.load('client', async () => {
      await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: DISCOVERY_DOCS,
      });

      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            gapi.client.setToken(tokenResponse);
            onSignedIn(true);
          }
        },
      });

      // Check if the user is already signed in
      const token = gapi.client.getToken();
      if (token) {
        onSignedIn(true);
      } else {
        onSignedIn(false);
      }
    });
  };
  document.body.appendChild(script);
};

export const signIn = () => {
  tokenClient.requestAccessToken();
};

export const signOut = () => {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {
      gapi.client.setToken(null);
    });
  }
};


export const uploadToDrive = async (fileName: string, content: string) => {
  const fileMetadata = {
    name: fileName,
    parents: ['appDataFolder'],
  };
  const media = {
    mimeType: 'application/json',
    body: content,
  };

  try {
    // Check if the file already exists
    const existingFiles = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: `name='${fileName}'`,
      fields: 'files(id, name)',
    });

    if (existingFiles.result.files && existingFiles.result.files.length > 0) {
      // File exists, update it
      const fileId = existingFiles.result.files[0].id;
      await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: { uploadType: 'media' },
        body: content,
      });
    } else {
      // File does not exist, create it
      await gapi.client.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
      });
    }
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw error;
  }
};

export const restoreFromDrive = async (fileName: string): Promise<string | null> => {
  try {
    const response = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: `name='${fileName}'`,
      fields: 'files(id, name)',
    });

    if (response.result.files && response.result.files.length > 0) {
      const fileId = response.result.files[0].id;
      if (fileId) {
        const fileResponse = await gapi.client.drive.files.get({
          fileId: fileId,
          alt: 'media',
        });
        return fileResponse.body;
      }
    }
    return null;
  } catch (error) {
    console.error('Error restoring from Google Drive:', error);
    return null;
  }
};
