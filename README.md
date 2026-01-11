<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1naV0gmqEShRvW-Gy0VhrpeTAlJlpQVQh

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Build APK Locally

### Prerequisites

Before you begin, please ensure you have the following installed on your local machine:

*   **Git:** To clone your project repository.
*   **Node.js and npm:** To manage your web application's dependencies.
*   **Java Development Kit (JDK) version 17:** Make sure your `JAVA_HOME` environment variable is set to your JDK 17 installation directory.
*   **Android SDK:** You can install this through Android Studio.
*   **Capacitor CLI:** Install it globally using npm:
    ```bash
    npm install -g @capacitor/cli
    ```

### Step-by-Step Guide to Build the APK

**1. Get Your Project Code**

First, open your terminal or command prompt and navigate to the directory where you want to store your project. Then, clone your project from its Git repository.

```bash
# Replace <your-repository-url> with the actual URL of your Git repository
git clone <your-repository-url>

# Navigate into your project directory
cd libriseatpro
```

**2. Install Dependencies**

Install all the necessary Node.js packages for your web application.

```bash
npm install
```

**3. Build Your Web App**

Create a production build of your web application. This will generate the static files that will be bundled into your Android app.

```bash
npm run build
```

**4. Add the Android Platform**

If you haven't already, add the Android platform to your Capacitor project.

```bash
npx cap add android
```

**5. Sync Your Web App with the Android Project**

This command copies your web app's build output into the native Android project.

```bash
npx cap sync android
```

**6. Configure Your Android SDK Location**

The Android build process needs to know where your Android SDK is located.

*   **Find your SDK Path:** You can find your Android SDK location in Android Studio's settings. Common default paths are:
    *   **macOS:** `~/Library/Android/sdk`
    *   **Windows:** `%LOCALAPPDATA%\Android\Sdk`
    *   **Linux:** `~/Android/sdk`
*   **Create `local.properties` file:** Inside the `android` directory of your project, create a new file named `local.properties`.
*   **Add the SDK path to the file:** Add the following line to your `local.properties` file, replacing `<path-to-your-android-sdk>` with the actual path you found:

    ```
    sdk.dir=<path-to-your-android-sdk>
    ```
    For example, on Linux, it might look like this:
    ```
    sdk.dir=/home/your-username/Android/sdk
    ```

**7. Build the APK**

Now you're ready to build the APK.

*   Navigate into the `android` directory:
    ```bash
    cd android
    ```
*   Run the Gradle wrapper command to build the debug APK. This APK is suitable for testing and installing on your device.
    *   On **macOS or Linux**:
        ```bash
        ./gradlew assembleDebug
        ```
    *   On **Windows**:
        ```bash
        gradlew.bat assembleDebug
        ```

**8. Locate Your APK**

Once the build is complete, you will find your generated APK file in the following directory:

`android/app/build/outputs/apk/debug/app-debug.apk`
