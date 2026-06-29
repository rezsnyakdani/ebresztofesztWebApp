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
import { adminGuard } from './helpers/admin.guard';
import { authGuard } from './helpers/auth.guard';



const routes: Routes = [
  { path: 'menu', component: MenuComponent },
  { path: 'program', component: ProgramComponent },
  { path: 'muhely', component: MuhelyComponent },
  { path: 'dal', component: DalComponent },
  { path: 'profil', component: ProfilComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'eloadas', component: EloadasComponent },
  { path: 'info', component: InfoComponent },
  { path: 'admin-profil', component: AdminProfilComponent, canActivate: [adminGuard] },
  { path: 'admin-dal', component: AdminDalComponent, canActivate: [adminGuard] },
  { path: 'admin-eloadas', component: AdminEloadasComponent, canActivate: [adminGuard] },
  { path: 'admin-info', component: AdminInfoComponent, canActivate: [adminGuard] },
  { path: 'admin-muhely', component: AdminMuhelyComponent, canActivate: [adminGuard] },
  { path: 'admin-program', component: AdminProgramComponent, canActivate: [adminGuard] },
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