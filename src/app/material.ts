import { NgModule } from '@angular/core';
import {
  MatButtonModule, MatCheckboxModule, MatToolbarModule, MatSidenavModule, MatIconModule, MatProgressSpinnerModule,
  MatListModule, MatGridListModule, MatCardModule, MatMenuModule, MatSpinner, MatProgressBarModule, MatSnackBarModule
} from '@angular/material';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { LayoutModule } from "@angular/cdk/layout";
@NgModule({
  imports: [MatButtonModule, MatCheckboxModule, MatToolbarModule, MatSidenavModule, MatIconModule, MatProgressSpinnerModule,
    MatListModule, MatGridListModule, MatCardModule, MatMenuModule, LayoutModule, BrowserAnimationsModule, MatProgressBarModule,
    MatSnackBarModule],
  exports: [MatButtonModule, MatCheckboxModule, MatToolbarModule, MatSidenavModule, MatIconModule, MatProgressSpinnerModule,
    MatListModule, MatGridListModule, MatCardModule, MatMenuModule, LayoutModule, BrowserAnimationsModule, MatProgressBarModule,
    MatSnackBarModule]
})

export class MaterialModule { }
