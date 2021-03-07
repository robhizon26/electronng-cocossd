const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const url = require("url");
const dev = false

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  if (dev) {
    win.loadURL("http://localhost:4200");
    win.webContents.openDevTools();
    process.env.NODE_ENV = 'development'
  } else {
    // win.loadFile(path.join(__dirname, "ngbuild/index.html")); //<--alternative for prod
    win.loadURL(url.format({
      pathname: path.join(__dirname, "ngbuild/index.html"),
      protocol: 'file',
      slashes: true
    }));
    process.env.NODE_ENV = 'production'
  }

  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          click: () => {
            app.quit();
          },
        },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
