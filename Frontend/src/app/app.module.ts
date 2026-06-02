import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DalComponent } from './features/dal/dal.component';
import { EloadasComponent } from './features/eloadas/eloadas.component';
import { InfoComponent } from './features/info/info.component';
import { MuhelyComponent } from './features/muhely/muhely.component';
import { NavbarComponent } from './features/navbar/navbar.component';
import { ProgramComponent } from './features/program/program.component';
import { ProfilComponent } from './features/profil/profil.component';

@NgModule({
  declarations: [
    AppComponent,
    DalComponent,
    EloadasComponent,
    InfoComponent,
    MuhelyComponent,
    NavbarComponent,
    ProgramComponent,
    ProfilComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
