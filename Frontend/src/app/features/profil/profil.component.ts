import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfilService, ProfileGetByIdDto, ChangePasswordDto } from '../../services/profil.service';
import { MuhelyService, WorkshopGetDto, WorkshopRegistrationGetDto, WorkshopSessionGetDto, RegistrationParticipantDto } from '../../services/muhely.service';
import { SignalrService } from '../../services/signalr.service';

export interface EnrichedRegistration {
  reg: WorkshopRegistrationGetDto;
  session: WorkshopSessionGetDto | null;
  workshopTitle: string;
  lecturer: string;
}

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

  registrations: EnrichedRegistration[] = [];
  expandedIds = new Set<string>();

  constructor(
    private authService: AuthService,
    private profilService: ProfilService,
    private muhelyService: MuhelyService,
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
    this.loadRegistrations();

    this.signalrSub.add(this.signalrService.profilesChanged$.subscribe(() => this.loadProfile()));
    this.signalrSub.add(this.signalrService.workshopsChanged$.subscribe(() => this.loadRegistrations()));
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

  private loadRegistrations(): void {
    if (!this.userId) return;
    this.muhelyService.getRegistrationsByProfileId(this.userId).subscribe({
      next: (regs) => {
        this.muhelyService.getAll().subscribe({
          next: (workshops) => this.enrichRegistrations(regs, workshops),
          error: () => {
            this.registrations = regs.map(reg => ({ reg, session: null, workshopTitle: reg.workshopTitle, lecturer: '' }));
          }
        });
      },
      error: () => {}
    });
  }

  private enrichRegistrations(regs: WorkshopRegistrationGetDto[], workshops: WorkshopGetDto[]): void {
    const sessionMap = new Map<string, { session: WorkshopSessionGetDto; workshopTitle: string; lecturer: string }>();
    for (const w of workshops) {
      for (const s of w.sessions) {
        sessionMap.set(s.id, { session: s, workshopTitle: w.title, lecturer: w.lecturer });
      }
    }
    this.registrations = regs.map(reg => {
      const found = sessionMap.get(reg.workshopSessionId);
      return {
        reg,
        session: found?.session ?? null,
        workshopTitle: found?.workshopTitle ?? reg.workshopTitle,
        lecturer: found?.lecturer ?? ''
      };
    });
  }

  toggleParticipants(regId: string): void {
    if (this.expandedIds.has(regId)) {
      this.expandedIds.delete(regId);
    } else {
      this.expandedIds.add(regId);
    }
  }

  isExpanded(regId: string): boolean {
    return this.expandedIds.has(regId);
  }

  sortedParticipants(participants: RegistrationParticipantDto[]): RegistrationParticipantDto[] {
    return [...participants].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  }

  getNapNev(dateStr: string): string {
    const napok = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
    return napok[new Date(dateStr).getDay()];
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${this.pad(d.getMonth() + 1)}.${this.pad(d.getDate())}.`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
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
    return { oldPassword: '', newPassword: '', newPasswordConfirm: '' };
  }
}
