import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ElectronLogic, ProcessPredictions2 } from "./../../shared/common";
import { DataSharingService } from './../../shared/datasharing.service';
import { NotifierService } from "./../../shared/notifier.service";

@Component({
  selector: "app-image",
  templateUrl: "./image.component.html",
  styleUrls: ["./image.component.scss"],
})
export class ImageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("imag", { static: false }) imag: ElementRef<HTMLImageElement>;
  @ViewChild("canvas", { static: false }) canvas: ElementRef<HTMLCanvasElement>;
  @ViewChild("imagestatus", { static: false }) imagestatusElement: ElementRef<HTMLDivElement>;
  highestcount = [];
  model;
  isloading: boolean = true;

  constructor(private DataSharing: DataSharingService, private notifierService: NotifierService) {
    this.DataSharing.Title.next('Image File');
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.DataSharing.Model.subscribe(res => {
      this.model = res;
      if (this.model) {
        setTimeout(() => {
          this.isloading = false;
        })
      }
    });
  }

  ngOnDestroy() {
    this.DataSharing.CurrentPredictions.next([]);
    this.DataSharing.AllPredictions.next([]);
    this.highestcount = [];
  }

  private onStartDetection(imgsrc, filePath) {
    let img0 = this.imag.nativeElement;
    this.highestcount = [];
    let img1 = new Image();
    img1.src = imgsrc;
    img1.crossOrigin = "anonymous";
    img1.onload = async () => {
      this.imagestatusElement.nativeElement.innerHTML = '<b>Image path:</b> <i>' + filePath + '</i>'
      document.getElementById('progressbar').style.display = 'none'
      const btnforsrc = document.getElementById('btnforsrc');
      let pathParts = filePath.split("\\");
      const name = pathParts[pathParts.length - 1];
      btnforsrc.innerText = name

      const canvas = this.canvas.nativeElement;
      const ctx = canvas.getContext('2d');
      ctx.canvas.width = 1200;
      ctx.canvas.height = 1200 * (img1.height / img1.width);

      const predictions = await this.model.detect(img1);
      this.DataSharing.UpdatePreditions(predictions, this.highestcount, null);

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(img1, 0, 0, ctx.canvas.width, ctx.canvas.height);
      // Font options.
      const font = "18px sans-serif";
      ctx.font = font;
      ctx.textBaseline = "top";
      const textHeight = parseInt(font, 10);

      const xfact = ctx.canvas.width / img1.width;
      const yfact = ctx.canvas.height / img1.height;
      ProcessPredictions2(predictions, ctx, xfact, yfact, textHeight)
      canvas.style.height = (canvas.offsetHeight + 1).toString() + 'px'
      img0.src = canvas.toDataURL();
      canvas.remove()
    }
  }

  async onImageLoad() {
    if (ElectronLogic) {
      try {
        const remote = ElectronLogic('electron').remote
        const dialog = remote.dialog
        const win = remote.getCurrentWindow();
        let options = {
          title: "Select image file",
          filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'jpeg', 'webp'] },
          ],
        }
        const filePath = (await dialog.showOpenDialog(win, options)).filePaths[0]
        if (!filePath) return
        this.imagestatusElement.nativeElement.innerHTML = 'Image is loading...'
        document.getElementById('progressbar').style.display = 'block'
        const fs = ElectronLogic('fs')
        fs.readFile(filePath, (err, data) => {
          if (err) throw err
          const imgsrc = URL.createObjectURL(new Blob([data]));
          if (this.model) this.onStartDetection(imgsrc, filePath);
        })
      } catch (error) {
        this.imagestatusElement.nativeElement.innerHTML = 'Error on loading image.'
        document.getElementById('progressbar').style.display = 'none'
        this.notifierService.showNotification('Error on loading image.', 'OK', 'error');
      }
    } else {
      console.warn('Logic can only run on Electron.')
      this.notifierService.showNotification('Logic can only run on Electron.', 'OK', 'error');
    }
  }
}
