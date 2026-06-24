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
import { AdminProfilComponent } from './features/szervezoknek/admin-profil/admin-profil.component';
import { AdminDalComponent } from './features/szervezoknek/admin-dal/admin-dal.component';
import { AdminEloadasComponent } from './features/szervezoknek/admin-eloadas/admin-eloadas.component';
import { AdminInfoComponent } from './features/szervezoknek/admin-info/admin-info.component';
import { AdminMuhelyComponent } from './features/szervezoknek/admin-muhely/admin-muhely.component';
import { AdminProgramComponent } from './features/szervezoknek/admin-program/admin-program.component';


const routes: Routes = [
  { path: 'menu', component: MenuComponent },
  { path: 'program', component: ProgramComponent },
  { path: 'muhely', component: MuhelyComponent },
  { path: 'dal', component: DalComponent },
  { path: 'profil', component: ProfilComponent },
  { path: 'login', component: LoginComponent },
  { path: 'eloadas', component: EloadasComponent },
  { path: 'info', component: InfoComponent },
  { path: 'admin-profil', component: AdminProfilComponent },
  { path: 'admin-dal', component: AdminDalComponent },
  { path: 'admin-eloadas', component: AdminEloadasComponent },
  { path: 'admin-info', component: AdminInfoComponent },
  { path: 'admin-muhely', component: AdminMuhelyComponent },
  { path: 'admin-program', component: AdminProgramComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
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