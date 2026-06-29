import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.sass'
})
export class MenuComponent {
  logoutMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onLogout(event: Event): void {
    event.preventDefault();

    this.logoutMessage = 'Sikeres kijelentkezés! Átirányítás...';

    setTimeout(() => {
      this.authService.logout(); // Ez törli a localStorage-ból a tokent!
      this.router.navigate(['/info']);
    }, 1000);
  }
}
