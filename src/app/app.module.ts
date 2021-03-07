import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { AppRoutingModule } from "./app-routing.module";
import { HttpClientModule } from "@angular/common/http";
import { AppComponent } from "./app.component";
import { MaterialModule } from "./material";
import { NavComponent } from "./nav/nav.component";
import { ScreencapComponent } from "./components/screencap/screencap.component";
import { VideoComponent } from './components/video/video.component';
import { ImageComponent } from './components/image/image.component';
import { WebcamComponent } from './components/webcam/webcam.component';
import { NotifierComponent } from "./components/notifier/notifier.component";

@NgModule({
  declarations: [
    AppComponent,
    NavComponent,
    ScreencapComponent,
    VideoComponent,
    ImageComponent,
    WebcamComponent,
    NotifierComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents:[
    NotifierComponent
  ]
})
export class AppModule {}
