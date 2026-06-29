import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.sass'
})
export class ProfilComponent {
  logoutMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogout(): void {
    this.logoutMessage = 'Sikeres kijelentkezés! Átirányítás...';

    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/info']);
    }, 1000);
  }
}
