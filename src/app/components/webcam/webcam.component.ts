import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from "@angular/core";
import * as tf from "@tensorflow/tfjs";

import { AdjustHeight, DrawPredictions, GetModelStatus, GetVideoStatus } from "./../../shared/common";
import { DataSharingService } from "./../../shared/datasharing.service";
import { NotifierService } from "src/app/shared/notifier.service";

@Component({
  selector: "app-webcam",
  templateUrl: "./webcam.component.html",
  styleUrls: ["./webcam.component.scss"],
})
export class WebcamComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("vid", { static: false }) vid: ElementRef<HTMLVideoElement>;
  @ViewChild("canvas", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("subcontainer", { static: false }) subcontainer: ElementRef<HTMLDivElement>;
  @ViewChild("modelstatus", { static: false }) modelstatusElement: ElementRef<HTMLDivElement>;
  @ViewChild("videostatus", { static: false }) videostatusElement: ElementRef<HTMLDivElement>;

  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  subcontainerElement: HTMLDivElement;
  videoStatus: string = "";
  modelStatus: string = "";
  model;
  highestcount = [];
  localstream;

  constructor(private DataSharing: DataSharingService, private notifierService: NotifierService) {
    this.DataSharing.Title.next('Webcam');
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

    //turn off webcam
    if (this.localstream) {
      this.videoElement.pause();
      this.localstream.getTracks()[0].stop();
      this.SetVideoStatus('hasEnded')
    }
  }

  @HostListener('window:resize')
  onWindowResize() { AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement); }

  ngAfterViewInit() {
    this.videoElement = this.vid.nativeElement;
    this.canvasElement = this.canvas.nativeElement;
    this.subcontainerElement = this.subcontainer.nativeElement;
    this.SetVideoStatus('')
    this.SetModelStatus('')
    this.subcontainerElement.setAttribute('style', 'height:' + (this.videoElement.offsetHeight).toString() + 'px');
    this.onEnableCamera();
    const ctx = this.canvasElement.getContext('2d');
    ctx.fillStyle = "#808080aa";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.DataSharing.Model.subscribe(res => {
      this.model = res;
      if (this.model) {
        this.SetModelStatus('hasLoaded')
        if (this.videoStatus === 'isReady') this.onStartDetection();
      }
    });
    this.videoElement.onloadeddata = () => {
      AdjustHeight(this.subcontainerElement, this.videoElement, this.canvasElement);
      this.SetVideoStatus('isReady')
      if (this.model) this.onStartDetection();
      document.getElementById('progressbar').setAttribute('style', 'display:none');
    };
    this.videoElement.onplaying = () => {
      this.SetVideoStatus('isPlaying')
      this.detectFrame()
    };
  }

  private async onEnableCamera() {
    const constraints = {
      audio: false,
      video: { facingMode: "environment" }
    };
    try {
      this.localstream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.localstream;
      this.videoElement.play();
    } catch (error) {
      this.SetVideoStatus('webcamError')
      this.notifierService.showNotification('Webcam error.', 'OK', 'error');
    }
  }

  private onStartDetection() {
    this.highestcount = [];
    this.SetVideoStatus('isPlaying')
    this.SetModelStatus('hasLoaded')
    this.detectFrame()
    const ctx = this.canvasElement.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private async detectFrame() {
    try {
      tf.tidy(() => {
        setTimeout(async () => {
          tf.engine().startScope();
          const pixels = await tf.browser.fromPixels(this.videoElement);
          if (this.model && pixels) {
            const predictions = await this.model.detect(pixels);
            DrawPredictions(this.canvasElement, predictions, pixels.shape);
            this.DataSharing.UpdatePreditions(predictions, this.highestcount, this.videoStatus);
            tf.engine().endScope();
            if (this.videoStatus === 'isPlaying') requestAnimationFrame(() => this.detectFrame());
          }
        }, 50);
      })
    } catch (error) {
      alert(error + ' : Error on object detection')
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

  private SetVideoStatus(videoStatus) {
    this.videoStatus = videoStatus;
    this.videostatusElement.nativeElement.innerHTML = GetVideoStatus(videoStatus, 'Webcam')
  }

  private SetModelStatus(modelStatus) {
    this.modelStatus = modelStatus;
    this.modelstatusElement.nativeElement.innerHTML = GetModelStatus(modelStatus);
  }
}
