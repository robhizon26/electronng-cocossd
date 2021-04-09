import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DataSharingService } from '../shared/datasharing.service';
import { NotifierService } from '../shared/notifier.service';
import { HttpClient } from "@angular/common/http";
import { CreatePluralMapKVP } from '../shared/common';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
})
export class NavComponent implements OnInit, AfterViewInit {
  @ViewChild("current", { static: false }) currentPredictions: ElementRef<HTMLDivElement>;
  @ViewChild("all", { static: false }) allPredictions: ElementRef<HTMLDivElement>;
  @ViewChild("middlepane", { static: false }) middlepane: ElementRef<HTMLTableCellElement>;
  @ViewChild("rightpane", { static: false }) rightpane: ElementRef<HTMLTableCellElement>;

  title: string = "";
  luralmapkvp
  isMouseDown = false;
  fullPanelWidth = 0;

  constructor(
    private DataSharing: DataSharingService,
    private notifierService: NotifierService,
    private httpClient: HttpClient) { }

  async ngOnInit() {
    this.DataSharing.Title.subscribe((res: string) => this.title = res)
    try {
      const pluralmappath = 'assets/'
      const pluralmap = await this.httpClient.get(`${pluralmappath}pluralmap.csv`, { responseType: "text" }).toPromise();
      this.luralmapkvp = CreatePluralMapKVP(pluralmap)
    } catch (error) {
      this.notifierService.showNotification('Error on pluralmap.csv.', 'OK', 'error');
    }
  }

  async ngAfterViewInit() {
    this.DataSharing.CurrentPredictions.subscribe((current: any[]) => {
      if (this.currentPredictions && current) {
        this.currentPredictions.nativeElement.innerHTML = '';
        current.forEach(prediction => {
          const div = <HTMLDivElement>(document.createElement('div'));
          div.innerHTML = this.GetCountLabels(prediction.count, prediction.item)
          this.currentPredictions.nativeElement.appendChild(div);
        })
      }
    })
    this.DataSharing.AllPredictions.subscribe((all: any[]) => {
      if (this.allPredictions && all) {
        this.allPredictions.nativeElement.innerHTML = '';
        all.forEach(prediction => {
          const div = <HTMLDivElement>(document.createElement('div'));
          div.innerHTML = this.GetCountLabels(prediction.count, prediction.item)
          this.allPredictions.nativeElement.appendChild(div)
        })
      }
    })
  }

  GetCountLabels(count, label) {
    let newlabel = this.luralmapkvp[label]
    if (count === 1 || !newlabel) newlabel = label;
    return `${count} ${newlabel}`
  }

  onClearHighestPredictions() {
    this.DataSharing.ClearPredictions.next([]);
    this.DataSharing.CurrentPredictions.next([]);
    this.DataSharing.AllPredictions.next([]);
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    this.fullPanelWidth = this.rightpane.nativeElement.offsetWidth + this.middlepane.nativeElement.offsetWidth;
  }
  onMouseMove(e) {
    const x = e.clientX - 150
    if (!this.isMouseDown) return;
    this.rightpane.nativeElement.style.width = `${100 - (x / this.fullPanelWidth) * 100}%`
    this.middlepane.nativeElement.style.width = `${(x / this.fullPanelWidth) * 100}%`
  }
}
