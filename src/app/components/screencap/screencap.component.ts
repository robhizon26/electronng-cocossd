import { AfterViewChecked, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import * as tf from "@tensorflow/tfjs";
import { Menu } from 'electron';

import { AdjustHeight, DrawPredictions, ElectronLogic, GetVideoStatus } from "../../shared/common";
import { DataSharingService } from "../../shared/datasharing.service";
import { NotifierService } from "src/app/shared/notifier.service";

@Component({
  selector: 'app-screencap',
  templateUrl: './screencap.component.html',
  styleUrls: ['./screencap.component.scss']
})

export class ScreencapComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild("vid", { static: false }) vid: ElementRef<HTMLVideoElement>;
  @ViewChild("canvas", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("subcontainer", { static: false }) subcontainer: ElementRef<HTMLDivElement>;
  @ViewChild("videostatus", { static: false }) videostatusElement: ElementRef<HTMLDivElement>;
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  subcontainerElement: HTMLDivElement;
  videoStatus: string = "";
  model;
  highestcount = [];
  localstream;
  Menu: typeof Menu;
  isloading: boolean = true;

  constructor(private DataSharing: DataSharingService, private notifierService: NotifierService) {
    this.DataSharing.Title.next('Screen Capture');
    if (ElectronLogic) {
      try {
        const { Menu } = ElectronLogic('electron').remote
        this.Menu = Menu
      } catch (error) {
        this.notifierService.showNotification('Error on Electron.', 'OK', 'error');
      }
    } else {
      console.warn('Logic can only run on Electron.')
      this.notifierService.showNotification('Logic can only run on Electron.', 'OK', 'error');
    }
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

    if (this.localstream) {
      this.videoElement.pause();
      this.localstream.getTracks()[0].stop();
      this.SetVideoStatus('hasEnded')
    }
  }

  ngAfterViewInit() {
    this.videoElement = this.vid.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.subcontainerElement = this.subcontainer.nativeElement;
    this.DataSharing.Model.subscribe(res => {
      this.model = res;
      if (this.model) {
        setTimeout(() => {
          this.isloading = false;
        })
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
    const ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#808080aa";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  ngAfterViewChecked() {
    AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
  }

  async onGetVideoSources() {
    if (ElectronLogic) {
      try {
        const inputSources = await ElectronLogic('electron').desktopCapturer.getSources({ types: ['window', 'screen'] });
        const videoOptionsMenu = this.Menu.buildFromTemplate(
          inputSources.map(source => {
            return {
              label: source.name,
              click: () => this.SelectSource(source)
            };
          })
        );
        videoOptionsMenu.popup();
      } catch (error) {
        this.notifierService.showNotification('Error on Electron.', 'OK', 'error');
      }
    } else {
      console.warn('Logic can only run on Electron.')
      this.notifierService.showNotification('Logic can only run on Electron.', 'OK', 'error');
    }
  }

  private async SelectSource(source) {
    try {
      this.SetVideoStatus('hasEnded')
      const btnforsrcs = document.getElementById('screencapsources');
      btnforsrcs.innerText = source.name;
      const constraints: any = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
      };
      this.localstream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.localstream;
      this.videoElement.play();
    } catch (error) {
      this.SetVideoStatus('screencapError')
      this.notifierService.showNotification('Screen Capture error.', 'OK', 'error');
    }
  }

  private onStartDetection() {
    this.highestcount = [];
    this.SetVideoStatus('isReady')
    this.detectFrame();
    const ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private async detectFrame() {
    try {
      AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
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

  private SetVideoStatus(videoStatus) {
    this.videoStatus = videoStatus;
    this.videostatusElement.nativeElement.innerHTML = GetVideoStatus(videoStatus, 'Screen Capture')
  }
}
