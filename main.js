const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const url = require("url");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  // win.loadFile(path.join(__dirname, "ngbuild/index.html"));
  win.loadURL("http://localhost:4200");
  // win.loadURL(url.format({
  //   pathname:path.join(__dirname, "ngbuild/index.html"),
  //   protocol:'file',
  //   slashes:true
  // }));
  win.webContents.openDevTools();

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
