import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataSharingService } from '../shared/datasharing.service';
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { NotifierService } from '../shared/notifier.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit {
  @ViewChild("current", { static: false }) currentPredictions: ElementRef<HTMLDivElement>;
  @ViewChild("all", { static: false }) allPredictions: ElementRef<HTMLDivElement>;

  title: string = "";
  isModelLoaded = false;
  constructor(private DataSharing: DataSharingService, private notifierService: NotifierService) { }

  async ngOnInit() {
    this.DataSharing.Title.subscribe((res: string) => this.title = res)
    try {
      const model = await cocoSsd.load();
      this.isModelLoaded = true;
      this.DataSharing.Model.next(model)
    } catch (error) {
      this.notifierService.showNotification('Cannot load model. Please ensure that you have internet connection.', 'OK', 'error');
    }
  }

  ngAfterViewInit() {
    this.DataSharing.CurrentPredictions.subscribe((current: any[]) => {
      if (this.currentPredictions && current) {
        this.currentPredictions.nativeElement.innerHTML = '';
        current.forEach(prediction => {
          const div = <HTMLDivElement>(document.createElement('div'));
          div.innerHTML = `${prediction.count} ${prediction.item}`;
          this.currentPredictions.nativeElement.appendChild(div);
        })
      }
    })
    this.DataSharing.AllPredictions.subscribe((all: any[]) => {
      if (this.allPredictions && all) {
        this.allPredictions.nativeElement.innerHTML = '';
        all.forEach(prediction => {
          const div = <HTMLDivElement>(document.createElement('div'));
          div.innerHTML = `${prediction.count} ${prediction.item}`;
          this.allPredictions.nativeElement.appendChild(div)
        })
      }
    })
  }

  onClearHighestPredictions() {
    this.DataSharing.ClearPredictions.next([]);
    this.DataSharing.CurrentPredictions.next([]);
    this.DataSharing.AllPredictions.next([]);
  }
}
