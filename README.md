# ElectronNg-CocoSsd
The title stands for:
* [Electron](https://www.electronjs.org/) (or ElectronJS) is the main tool to create the desktop app.
* NG stands for [Angular](https://angular.io/). This project also uses [Angular Material](https://material.angular.io/). These are the framework used to create the contents of the web app.
* COCO-SSD is the model used for obtect detection. [COCO](https://cocodataset.org/#home) stands for `Common Object in Context` and SSD stands for `Single Shot (Multibox) Detection`. The model used here is a [Tensorflow.js](https://www.tensorflow.org/js/models) port of [COCO-SSD model](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd). 

![](others/WalkingTour.gif)
>*You can observe that the bounding boxes on the gif video above lags when people or cars are moving fast or the camera is panning hastily. I recorded the file above using a 7-year old laptop. The performance of object detection would increase dramatically if you run the app in a high-end and  high-performing desktop machine. Also, having a lower resolution on your video file or screen capture would also mean lesser processing time for inference testing and better performance on object detection predictions.*

![](others/office_ezgif.gif)
![](others/videomeeting_ezgif.gif)
![](others/stretching_ezgif.gif)
![](others/kinder.png)

## How to run the app
Run `npm install` on the terminal to install all required dependencies.

Run `npm run electron-aot` to optimize building the Angular app using AOT(Ahead-Of-Time) compiler, and dumping the transpiled web files (index.html, JS files, CSS, pluralmap.csv, etc) on `ngbuild` folder. It will first run CLI command `ng build --prod`. I changed the build folder from `dist` to `ngbuild` on angular.json. After this, it will run the Electron CLI command `electron .` to open the desktop app. 

##### **Please see package.json how I summarized CLI commands.**
```
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "test": "ng test",
    "lint": "ng lint",
    "e2e": "ng e2e",
    "electron": "electron .",
    "electron-dev": "ng build && electron .",
    "electron-aot": "ng build --prod && electron .",
    "package-mac": "electron-packager . --overwrite --platform=darwin --prune=true --out=packages",
    "package-win": "electron-packager . --overwrite --platform=win32 --prune=true --out=packages",
    "package-linux": "electron-packager . --overwrite --platform=linux --prune=true --out=packages"
  },
```

## How to run the app in development and debugging mode
You can run the Angular app using the default `ng serve` to spin off the internal dev server and see it on the browser on `http://localhost:4200/`. Here, all Electron/NodeJS logic will not be executed. If you just need to check on Angular Material or anything related to aesthetics this is just fine. 

Or you can also do debugging by going to the `main.js`, an Electron entry point, and change the `dev` variable to `true`. Then run `npm run electron`. This will run the Electron dekstop app and will display `http://localhost:4200/`. Everything you changed and saved on the Angular source files will be reloaded and updated immediately on the Electron app as if it was the browser.  

## How to package Electron as a standlone app
I summarize the commands on package.json on how to package the app as distributables. You could certainly add mode parameters to these as you want. Please refer to [Electron packager tutorial](https://www.christianengvall.se/electron-packager-tutorial/) and 
[electron-packager](https://electron.github.io/electron-packager/master/) for reference.

##### **Linux**
```
npm run package-linux
```
##### **Windows**
```
npm run package-win
```
>*There is a different procedure on how to package a Windows distributable on non-Windows platforms. You should see this [reference](https://github.com/electron/electron-packager#building-windows-apps-from-non-windows-platforms).*

##### **Mac**
```
npm run package-mac
```
The different packages for each of these OS platforms will be outputted on `packages` folder.

## My solution to node_module error
![](others/node_module_error.png)
If you encounter this error, this is just my take or work around on how I solved the issue. Please open the file in `node_modules\@tensorflow\tfjs-core\dist\platforms\platform_node.js` and make some minor changes on the code as shown below. I made changes on 2 lines of code.
##### **From this code**
![](others/FromThisCode.png)
##### **To this code**
![](others/ToThisCode.png)
## Description of the app
This object detection app is made from Electron so it can run as a desktop app in all three major OS platforms, that is Windows, Linux and Mac.  

Eventhough Tensorflow.js is made particularly for Javascript coding and deployed as a web app, this desktop app will have the ability to open an image file, video file, webcam, and screen capture for inference testing. A feature which is lacking on a typical wep application. 

The [COCO dataset](https://cocodataset.org/#home) consists of [80 classes of objects](https://github.com/tensorflow/tfjs-models/blob/master/coco-ssd/src/classes.ts). There is a feature on the app that I count the number of classes per prediction. I made sure that it can pluralize the class label if it is counted greater than 1. Prediction is done on a frame by frame basis in the case of a video file, webcam, or screen capture being loaded on the app. And a model prediction will return bounding boxes (x,y,width,and height in pixels) with class name and confidence level. It will then be drawn on a canvas, in realtime, and will be overlayed on the main video or image itself.

The underlying wep app on this Electron app is made from Angular and Angular Material. It has a special logic on how to execute NodeJS file system  within Angular.
##### **Everything within this block will be designated for Electron/NodeJS code**
```
if (ElectronLogic) {
  //Do Node JS file system
}
```
