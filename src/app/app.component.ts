import { Component, OnInit } from '@angular/core';
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { DataSharingService } from './shared/datasharing.service';
import { NotifierService } from './shared/notifier.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'COCO-SSD Object Detection';
  isModelLoaded = false;

  constructor(
    private DataSharing: DataSharingService,
    private notifierService: NotifierService,
  ) { }

  async ngOnInit() {
    try {
      const model = await cocoSsd.load();
      this.isModelLoaded = true;
      this.DataSharing.Model.next(model)
    } catch (error) {
      this.notifierService.showNotification('Cannot load model. Please ensure that you have internet connection.', 'OK', 'error');
    }
  }
}
