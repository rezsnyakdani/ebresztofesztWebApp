import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MenuComponent } from './features/menu/menu.component';
import { ProgramComponent } from './features/program/program.component';
import { MuhelyComponent } from './features/muhely/muhely.component';
import { DalComponent } from './features/dal/dal.component';
import { ProfilComponent } from './features/profil/profil.component';
import { LoginComponent } from './features/login/login.component';
import { EloadasComponent } from './features/eloadas/eloadas.component';
import { InfoComponent } from './features/info/info.component';


const routes: Routes = [
  { path: 'menu', component: MenuComponent },
  { path: 'program', component: ProgramComponent },
  { path: 'muhely', component: MuhelyComponent },
  { path: 'dal', component: DalComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'login', component: LoginComponent },
  { path: 'eloadas', component: EloadasComponent },
  { path: 'info', component: InfoComponent },
  { path: '', redirectTo: '/info', pathMatch: 'full' },
  { path: '**', redirectTo: '/info' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { 
      anchorScrolling: 'enabled',
      scrollPositionRestoration: 'enabled',
      scrollOffset: [0, 20]
    })],
  exports: [RouterModule]
})
export class AppRoutingModule { }