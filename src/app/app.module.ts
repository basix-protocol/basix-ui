import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ClipboardModule } from 'ngx-clipboard';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { ProtocolComponent } from './protocol/protocol.component';
import { StakeComponent } from './stake/stake.component';

@NgModule({
  declarations: [
    AppComponent,
    TimeAgoPipe,
    StakeComponent,
    HomeComponent,
    ProtocolComponent,
  ],
  imports: [BrowserModule, CommonModule, AppRoutingModule, ClipboardModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
