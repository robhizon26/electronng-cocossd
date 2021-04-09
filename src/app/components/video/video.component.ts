import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import * as tf from "@tensorflow/tfjs";

import { AdjustHeight, DrawPredictions, ElectronLogic, GetVideoStatus } from "./../../shared/common";
import { DataSharingService } from "./../../shared/datasharing.service";
import { NotifierService } from "./../../shared/notifier.service";

@Component({
  selector: 'app-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})

export class VideoComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild("vid", { static: false }) vid: ElementRef<HTMLVideoElement>;
  @ViewChild("canvas", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("subcontainer", { static: false }) subcontainer: ElementRef<HTMLDivElement>;
  @ViewChild("videostatus", { static: false }) videostatusElement: ElementRef<HTMLDivElement>;
  @ViewChild("videopath", { static: false }) videopathElement: ElementRef<HTMLDivElement>;

  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  subcontainerElement: HTMLDivElement;
  videoStatus: string = "";
  model;
  highestcount = [];
  filePath;
  isloading: boolean = true;
  detectionInterval: number = 10;

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

  ngAfterViewInit() {
    this.canvasElement = this.canvas.nativeElement;
    this.subcontainerElement = this.subcontainer.nativeElement;
    this.SetVideoStatus('')
    this.DataSharing.Model.subscribe(res => {
      this.model = res;
      this.videoElement = this.vid.nativeElement;
      if (this.model) {
        setTimeout(() => {
          this.isloading = false;
        }, 0)
      }
    });
    this.videoElement.onloadedmetadata = () => {
      AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
      this.SetVideoStatus('isReady')
    };
    this.videoElement.onloadeddata = () => {
      if (this.model) this.onStartDetection();
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
  }

  ngAfterViewChecked() {
    AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
  }

  private onStartDetection() {
    this.highestcount = [];
    this.SetVideoStatus('isReady')
    this.detectFrame();

    this.videopathElement.nativeElement.innerHTML = '<b>Video path: </b> <i>' + this.filePath + '</i>'
    document.getElementById('progressbar').style.display = 'none'
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
        }, this.detectionInterval);
      })
    } catch (error) {
      this.notifierService.showNotification('Error on object detection.', 'OK', 'error');
    }
  }

  onPlayOrPause() {
    if (this.videoStatus === '') return;
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
        document.getElementById('progressbar').style.display='block'

        setTimeout(() => {
          const fs = ElectronLogic('fs')
          const file: Buffer = fs.readFileSync(this.filePath);
          const vidsrc = URL.createObjectURL(new Blob([file]));
          this.videoElement.src = vidsrc
          this.videoElement.play();
          this.detectionInterval = file.length / 120000;
          this.detectionInterval = this.detectionInterval > 300 ? 300 : this.detectionInterval
          console.log({ detectionInterval: this.detectionInterval })
        }, 0)
      } catch (error) {
        this.videostatusElement.nativeElement.innerHTML = 'Error on loading video.'
        document.getElementById('progressbar').style.display='none'
        this.notifierService.showNotification('Error on Electron.', 'OK', 'error');
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
}
