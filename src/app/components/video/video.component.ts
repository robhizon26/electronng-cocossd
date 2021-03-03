import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import * as tf from "@tensorflow/tfjs";

import { AdjustHeight, DrawPredictions, ElectronLogic, GetModelStatus, GetVideoStatus } from "./../../shared/common";
import { DataSharingService } from "./../../shared/datasharing.service";
import { NotifierService } from "src/app/shared/notifier.service";

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})

export class VideoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("vid", { static: false }) vid: ElementRef<HTMLVideoElement>;
  @ViewChild("src", { static: false }) src: ElementRef<HTMLSourceElement>;
  @ViewChild("canvas", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("subcontainer", { static: false }) subcontainer: ElementRef<HTMLDivElement>;
  @ViewChild("modelstatus", { static: false }) modelstatusElement: ElementRef<HTMLDivElement>;
  @ViewChild("videostatus", { static: false }) videostatusElement: ElementRef<HTMLDivElement>;
  @ViewChild("videopath", { static: false }) videopathElement: ElementRef<HTMLDivElement>;

  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  subcontainerElement: HTMLDivElement;
  videoStatus: string = "";
  modelStatus: string = "";
  model;
  highestcount = [];
  filePath;
  isloading: boolean = true;

  constructor(private DataSharing: DataSharingService, private notifierService: NotifierService) {
    this.DataSharing.Title.next('Video File');
  }

  ngOnInit() {
    this.DataSharing.ClearPredictions.subscribe(res => this.highestcount = [])
    this.DataSharing.CurrentPredictions.next([]);
    this.DataSharing.AllPredictions.next([]);
  }

  ngOnDestroy() {
    this.DataSharing.CurrentPredictions.next([]);
    this.DataSharing.AllPredictions.next([]);
    this.highestcount = [];

    this.videoElement.pause();
    this.SetVideoStatus('hasEnded')
  }

  @HostListener('window:resize')
  onWindowResize() { AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement); }

  ngAfterViewInit() {
    this.videoElement = this.vid.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.subcontainerElement = this.subcontainer.nativeElement;
    this.SetModelStatus('')
    this.SetVideoStatus('')
    this.DataSharing.Model.subscribe(res => {
      this.model = res;
      if (this.model) {
        this.SetModelStatus('hasLoaded')
        setTimeout(() => {
          this.isloading = false;
        })
      }
    });
    this.videoElement.onloadeddata = () => {
      AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
      if (this.model) this.onStartDetection();
      this.SetVideoStatus('isReady')
    };
    this.videoElement.onplaying = () => {
      this.SetVideoStatus('isPlaying')
      this.detectFrame()
    };
    this.videoElement.onended = () => {
      this.SetVideoStatus('hasEnded')
    };
    const ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#808080aa";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
  }

  private onStartDetection() {
    this.highestcount = [];
    this.SetModelStatus('hasLoaded')
    this.SetVideoStatus('isReady')
    this.detectFrame();

    this.videopathElement.nativeElement.innerHTML = '<b>Video path: </b> <i>' + this.filePath + '</i>'
    document.getElementById('progressbar').setAttribute('style', 'display:none');
    const btnforsrc = document.getElementById('btnforsrc');
    let pathParts = this.filePath.split("\\");
    const name = pathParts[pathParts.length - 1];
    btnforsrc.innerText = name
  }

  private async detectFrame() {
    try {
      tf.tidy(() => {
        setTimeout(async () => {
          tf.engine().startScope();
          const pixels = await tf.browser.fromPixels(this.videoElement);
          const predictions = await this.model.detect(pixels);
          DrawPredictions(this.canvasElement, predictions, pixels.shape);
          this.DataSharing.UpdatePreditions(predictions, this.highestcount, this.videoStatus);
          tf.engine().endScope();
          if (this.videoStatus === 'isPlaying') requestAnimationFrame(() => this.detectFrame());
        }, 50);
      })
    } catch (error) {
      this.notifierService.showNotification('Error on object detection.', 'OK', 'error');
    }
  }

  onPlayOrPause() {
    if (this.videoStatus === '' || this.modelStatus === '') return;
    if (this.videoStatus != 'isPlaying') {
      this.videoElement.play();
      this.SetVideoStatus('isPlaying')
    }
    else {
      this.videoElement.pause();
      this.SetVideoStatus('isPaused')
    }
  }

  async onVideoLoad() {
    if (ElectronLogic) {
      try {
        this.SetVideoStatus('isPaused')
        this.videoElement.pause();
        const remote = ElectronLogic('electron').remote
        const dialog = remote.dialog
        const win = remote.getCurrentWindow();
        let options = {
          title: "Select video file",
          filters: [
            { name: 'Movies', extensions: ['mkv', 'mp4', 'ogv', 'webm', 'mov'] }
          ],
        }
        this.filePath = (await dialog.showOpenDialog(win, options)).filePaths[0]
        if (!this.filePath) return

        const ctx = this.canvasElement.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        this.SetVideoStatus('hasEnded')
        this.videostatusElement.nativeElement.innerHTML = 'Video is loading...'
        document.getElementById('progressbar').setAttribute('style', 'display:block');
        const fs = ElectronLogic('fs')

        const file: Buffer = fs.readFileSync(this.filePath);
        const vidsrc = URL.createObjectURL(new Blob([file]));
        this.videoElement.src = vidsrc
        this.videoElement.play();
      } catch (error) {
        this.videostatusElement.nativeElement.innerHTML = 'Error on loading video.'
        document.getElementById('progressbar').setAttribute('style', 'display:none');
        throw error
      }
    } else {
      console.warn('Logic can only run on Electron.')
      this.notifierService.showNotification('Logic can only run on Electron.', 'OK', 'error');
    }
  }

  private SetVideoStatus(videoStatus) {
    this.videoStatus = videoStatus;
    this.videostatusElement.nativeElement.innerHTML = GetVideoStatus(videoStatus, 'Video')
  }

  private SetModelStatus(modelStatus) {
    this.modelStatus = modelStatus;
    this.modelstatusElement.nativeElement.innerHTML = GetModelStatus(modelStatus);
  }
}
