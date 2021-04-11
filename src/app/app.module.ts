import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule} from '@angular/material/form-field';
import { MatToolbarModule, MatToolbarRow } from '@angular/material/toolbar';
import { MatGridListModule } from '@angular/material/grid-list'
import { MatSnackBarModule } from '@angular/material/snack-bar'

import { AppComponent } from './app.component';
import { TestGenComponent } from './test-gen/test-gen.component';
import { CuriousAuroraComponent } from './curious-aurora/curious-aurora.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { TableDemoComponent } from './table-demo/table-demo.component';
import { GridListDemoComponent } from './grid-list-demo/grid-list-demo.component'

@NgModule({
  declarations: [
    AppComponent,
    TestGenComponent,
    CuriousAuroraComponent,
    TableDemoComponent,
    GridListDemoComponent
  ],
  imports: [
    BrowserModule,
    MatSliderModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatGridListModule,
    MatSnackBarModule,
    MatTableModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
