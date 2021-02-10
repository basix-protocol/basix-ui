import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import * as Parallax from 'parallax-js';

declare var Parallax: any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChild('scene') scene: ElementRef;

  ngAfterViewInit() {
    new Parallax(this.scene.nativeElement, {
      relativeInput: true,
      hoverOnly: true,
    });
  }
}
