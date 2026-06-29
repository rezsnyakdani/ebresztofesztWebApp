import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
//import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';


import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DalComponent } from './features/dal/dal.component';
import { EloadasComponent } from './features/eloadas/eloadas.component';
import { InfoComponent } from './features/info/info.component';
import { MuhelyComponent } from './features/muhely/muhely.component';
import { NavbarComponent } from './features/navbar/navbar.component';
import { ProgramComponent } from './features/program/program.component';
import { ProfilComponent } from './features/profil/profil.component';
import { MenuComponent } from './features/menu/menu.component';
import { LoginComponent } from './features/login/login.component';
import { AdminDalComponent } from './features/szervezoknek/admin-dal/admin-dal.component';
import { AdminEloadasComponent } from './features/szervezoknek/admin-eloadas/admin-eloadas.component';
import { AdminInfoComponent } from './features/szervezoknek/admin-info/admin-info.component';
import { AdminMuhelyComponent } from './features/szervezoknek/admin-muhely/admin-muhely.component';
import { AdminProfilComponent } from './features/szervezoknek/admin-profil/admin-profil.component';
import { AdminProgramComponent } from './features/szervezoknek/admin-program/admin-program.component';
import { AdminNabarComponent } from './features/szervezoknek/admin-nabar/admin-nabar.component';
import { jwtInterceptor } from './helpers/jwt.interceptor';
import { errorInterceptor } from './helpers/error.interceptor';


@NgModule({
  declarations: [
    AppComponent,
    DalComponent,
    EloadasComponent,
    InfoComponent,
    MuhelyComponent,
    NavbarComponent,
    ProgramComponent,
    ProfilComponent,
    MenuComponent,
    LoginComponent,
    AdminDalComponent,
    AdminEloadasComponent,
    AdminInfoComponent,
    AdminMuhelyComponent,
    AdminProfilComponent,
    AdminProgramComponent,
    AdminNabarComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    provideHttpClient(withInterceptors([jwtInterceptor, errorInterceptor]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
