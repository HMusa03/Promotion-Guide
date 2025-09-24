const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
const licenseFile = path.join(app.getPath("userData"), "license.json");

/******************************
 * MAIN WINDOW
 ******************************/
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    icon: path.join(__dirname, "images/COA.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,  // ⚠ consider disabling in production for security
      contextIsolation: false
    }
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // ✅ Check license status
  try {
    if (fs.existsSync(licenseFile)) {
      const license = JSON.parse(fs.readFileSync(licenseFile, "utf8"));
      if (license && license.expiry && new Date(license.expiry) > new Date()) {
        mainWindow.loadFile("index.html"); // valid license
      } else {
        console.log("⚠ License expired or invalid");
        mainWindow.loadFile("activation.html");
      }
    } else {
      console.log("⚠ No license found");
      mainWindow.loadFile("activation.html");
    }
  } catch (err) {
    console.error("❌ Error reading license file:", err);
    mainWindow.loadFile("activation.html");
  }
}

/******************************
 * IPC: Save Activation
 ******************************/
ipcMain.on("save-activation", (event, licenseData) => {
  try {
    fs.writeFileSync(licenseFile, JSON.stringify(licenseData, null, 2), "utf8");
    console.log("✅ License saved:", licenseData);
  } catch (err) {
    console.error("❌ Error saving license:", err);
  }
});

ipcMain.on("activation-success", () => {
  if (mainWindow) {
    console.log("✅ Activation successful, loading app...");
    mainWindow.loadFile("index.html");
  }
});

/******************************
 * APP LIFECYCLE
 ******************************/
app.on("ready", createMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
