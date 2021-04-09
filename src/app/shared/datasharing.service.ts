import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataSharingService {
  CurrentPredictions = new BehaviorSubject([]);
  AllPredictions = new BehaviorSubject([]);
  ClearPredictions = new BehaviorSubject([]);
  Title = new BehaviorSubject('');
  Model = new BehaviorSubject(undefined);
  constructor() {
  }

  public UpdatePreditions = (predictions, highestcount, videoStatus) => {
    const classes = predictions.map(item => item["class"]);
    let removeDuplicates = new Set(classes);
    let uniqueArray = [...removeDuplicates];
    const countedclasses = uniqueArray.map(item => {
      const count = classes.filter(li => li === item).length;
      return { count, item }
    });
    countedclasses.forEach(({ count: ccount, item: citem }) => {
      let isnew = highestcount.filter(({ item: hitem }) => hitem === citem).length === 0
      if (isnew) {
        if (videoStatus != 'hasEnded') highestcount.push({ count: ccount, item: citem });
      } else {
        let updateindex = -1;
        let isupdating = false;
        highestcount.forEach(({ count: hcount, item: hitem }, i) => {
          if (isupdating) return;
          isupdating = (hitem === citem && hcount < ccount);
          if (isupdating) {
            updateindex = i;
          }
        });
        if (isupdating && videoStatus != 'hasEnded') {
          highestcount.splice(updateindex, 1)
          highestcount.push({ count: ccount, item: citem });
        }
      }
    });
    countedclasses.sort((a, b) => b.count - a.count);
    highestcount.sort((a, b) => b.count - a.count);
    this.CurrentPredictions.next(countedclasses);
    this.AllPredictions.next(highestcount);
  }
}
