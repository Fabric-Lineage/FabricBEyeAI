import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeContainerComponent } from './components/home-container/home-container.component';
import { HomeRoutingModule } from './home-routing.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@NgModule({
  declarations: [HomeContainerComponent],
  imports: [
    CommonModule,
    FormsModule,
    HomeRoutingModule,
    MatProgressSpinnerModule
  ]
})
export class HomeModule { }
