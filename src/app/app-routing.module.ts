import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ImageComponent } from "./components/image/image.component";
import { VideoComponent } from "./components/video/video.component";
import { WebcamComponent } from "./components/webcam/webcam.component";
import { ScreencapComponent } from "./components/screencap/screencap.component";

const routes: Routes = [
  { path: "screencap", component: ScreencapComponent },
  { path: "video", component: VideoComponent },
  { path: "image", component: ImageComponent },
  { path: "webcam", component: WebcamComponent },
  { path: "**",  redirectTo: "/image", pathMatch:"full"},
  { path: "", redirectTo: "/image", pathMatch:"full" },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
