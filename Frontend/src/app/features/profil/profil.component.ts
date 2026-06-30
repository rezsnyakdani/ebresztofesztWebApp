import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfilService, ProfileGetByIdDto, ChangePasswordDto } from '../../services/profil.service';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-profil',
  standalone: false,
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.sass'
})
export class ProfilComponent implements OnInit, OnDestroy {
  private userId: string | null = null;
  private signalrSub = new Subscription();

  logoutMessage = '';

  profile: ProfileGetByIdDto | null = null;
  isLoading = false;
  errorMessage = '';

  isChangingPassword = false;
  isSavingPassword = false;
  passwordErrorMessage = '';
  passwordSuccessMessage = '';
  passwordForm: ChangePasswordDto = this.getUresJelszoForm();

  constructor(
    private authService: AuthService,
    private profilService: ProfilService,
    private router: Router,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();

    if (!this.userId) {
      this.errorMessage = 'Nem található a bejelentkezett felhasználó azonosítója.';
      return;
    }

    this.loadProfile();
    this.signalrSub.add(this.signalrService.profilesChanged$.subscribe(() => this.loadProfile()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  private loadProfile(): void {
    if (!this.userId) return;
    this.isLoading = true;
    this.profilService.getById(this.userId).subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  onLogout(): void {
    this.logoutMessage = 'Sikeres kijelentkezés! Átirányítás...';

    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/info']);
    }, 1000);
  }

  openPasswordForm(): void {
    this.isChangingPassword = true;
  }

  savePassword(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.passwordErrorMessage = 'Nem található a bejelentkezett felhasználó azonosítója.';
      return;
    }

    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
    this.isSavingPassword = true;

    this.profilService.changePassword(userId, this.passwordForm).subscribe({
      next: () => {
        this.passwordSuccessMessage = 'A jelszó megváltoztatása sikeres!';
        this.isSavingPassword = false;
        this.passwordForm = this.getUresJelszoForm();

        setTimeout(() => {
          this.isChangingPassword = false;
          this.passwordSuccessMessage = '';
        }, 2000);
      },
      error: (err) => {
        this.passwordErrorMessage = err.message;
        this.isSavingPassword = false;
      }
    });
  }

  cancelPasswordForm(): void {
    this.isChangingPassword = false;
    this.passwordForm = this.getUresJelszoForm();
    this.passwordErrorMessage = '';
    this.passwordSuccessMessage = '';
  }

  private getUresJelszoForm(): ChangePasswordDto {
    return {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: ''
    };
  }
}
