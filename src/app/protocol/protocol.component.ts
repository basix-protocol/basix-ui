import { Component, OnDestroy, OnInit } from '@angular/core';
declare let $: any;

@Component({
  selector: 'app-protocol',
  templateUrl: './protocol.component.html',
  styleUrls: ['./protocol.component.scss'],
})
export class ProtocolComponent implements OnInit, OnDestroy {

  ngOnInit(): void {
    $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=0.3');
  }

  ngOnDestroy(): void {
    $('meta[name=viewport]').attr('content', 'width=device-width, initial-scale=1');
  }
}
