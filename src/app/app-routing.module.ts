import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProtocolComponent } from './protocol/protocol.component';
import { SaleComponent } from './sale/sale.component';
import { StakeComponent } from './stake/stake.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'stake',
    component: StakeComponent,
  },
  /* {
    path: 'sale',
    component: SaleComponent,
  }, */
  {
    path: 'protocol',
    component: ProtocolComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
