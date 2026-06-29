import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.sass'
})
export class LoginComponent {
  name = '';
  password = '';

  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name || !this.password) {
      this.errorMessage = 'Kérlek, tölts ki minden mezőt!';
      return;
    }

    this.isLoading = true;

    this.authService.login({ name: this.name, password: this.password }).subscribe({
      
      next: () => {
        this.successMessage = 'Sikeres bejelentkezés! Átirányítás...';
        
        setTimeout(() => {
          this.isLoading = false;
          this.router.navigate(['/profil']);
        }, 1000);
      },

      error: (err) => {
        this.isLoading = false; 
        
        this.errorMessage = err.message; 
      }
    });
  }
}
