import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MuhelyService, WorkshopGetDto, WorkshopRegistrationGetDto, WorkshopSessionGetDto, RegistrationParticipantDto } from '../../services/muhely.service';
import { SignalrService } from '../../services/signalr.service';

interface SessionMessage {
  success: string;
  error: string;
}

@Component({
  selector: 'app-muhely',
  standalone: false,
  templateUrl: './muhely.component.html',
  styleUrl: './muhely.component.sass'
})
export class MuhelyComponent implements OnInit, OnDestroy {
  private signalrSub = new Subscription();

  workshops: WorkshopGetDto[] = [];
  isLoading = false;
  errorMessage = '';

  isLoggedIn = false;
  userId: string | null = null;
  myRegistrations: WorkshopRegistrationGetDto[] = [];

  expandedSessionIds = new Set<string>();
  sessionMessages: { [sessionId: string]: SessionMessage } = {};

  constructor(
    private muhelyService: MuhelyService,
    private authService: AuthService,
    private signalrService: SignalrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.isLoggedIn = !!this.userId;

    this.loadAll();

    this.signalrSub.add(this.signalrService.workshopsChanged$.subscribe(() => this.loadAll()));
    this.signalrSub.add(this.signalrService.sessionRegistrationChanged$.subscribe(data => {
      for (const workshop of this.workshops) {
        const session = workshop.sessions.find(s => s.id === data.sessionId);
        if (session) {
          session.participants = data.participants;
          break;
        }
      }
      if (this.isLoggedIn && this.userId) this.loadMyRegistrations();
    }));
    this.signalrSub.add(this.signalrService.profilesChanged$.subscribe(() => {
      if (this.isLoggedIn && this.userId) this.loadMyRegistrations();
    }));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  private loadAll(): void {
    this.loadWorkshops();
    if (this.isLoggedIn && this.userId) this.loadMyRegistrations();
  }

  loadWorkshops(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.muhelyService.getAll().subscribe({
      next: (data) => {
        this.workshops = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  loadMyRegistrations(): void {
    if (!this.userId) return;
    this.muhelyService.getRegistrationsByProfileId(this.userId).subscribe({
      next: (data) => { this.myRegistrations = data; },
      error: () => {}
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  sortedSessions(workshop: WorkshopGetDto): WorkshopSessionGetDto[] {
    return [...workshop.sessions].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  sortedParticipants(session: WorkshopSessionGetDto): RegistrationParticipantDto[] {
    return [...session.participants].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  }

  getMyRegistration(sessionId: string): WorkshopRegistrationGetDto | undefined {
    return this.myRegistrations.find(r => r.workshopSessionId === sessionId);
  }

  isRegistered(sessionId: string): boolean {
    return !!this.getMyRegistration(sessionId);
  }

  register(sessionId: string): void {
    if (!this.userId) return;
    this.setMessage(sessionId, '', '');

    this.muhelyService.createRegistration({ profileId: this.userId, workshopSessionId: sessionId }).subscribe({
      next: (reg) => {
        this.myRegistrations = [...this.myRegistrations, reg];
        this.setMessage(sessionId, 'Sikeresen jelentkeztél a műhelyre!', '');
        setTimeout(() => this.clearSuccess(sessionId), 1000);
      },
      error: (err) => {
        this.setMessage(sessionId, '', err.message);
      }
    });
  }

  unregister(sessionId: string): void {
    const reg = this.getMyRegistration(sessionId);
    if (!reg) return;
    this.setMessage(sessionId, '', '');

    this.muhelyService.deleteRegistration(reg.id).subscribe({
      next: () => {
        this.myRegistrations = this.myRegistrations.filter(r => r.id !== reg.id);
        this.setMessage(sessionId, 'Jelentkezésed sikeresen törölve!', '');
        setTimeout(() => this.clearSuccess(sessionId), 1000);
      },
      error: (err) => {
        this.setMessage(sessionId, '', err.message);
      }
    });
  }

  private setMessage(sessionId: string, success: string, error: string): void {
    this.sessionMessages = { ...this.sessionMessages, [sessionId]: { success, error } };
  }

  private clearSuccess(sessionId: string): void {
    if (this.sessionMessages[sessionId]) {
      this.sessionMessages = { ...this.sessionMessages, [sessionId]: { success: '', error: this.sessionMessages[sessionId].error } };
    }
  }

  getSessionMessage(sessionId: string): SessionMessage {
    return this.sessionMessages[sessionId] ?? { success: '', error: '' };
  }

  toggleParticipants(sessionId: string): void {
    if (this.expandedSessionIds.has(sessionId)) {
      this.expandedSessionIds.delete(sessionId);
    } else {
      this.expandedSessionIds.add(sessionId);
    }
  }

  isExpanded(sessionId: string): boolean {
    return this.expandedSessionIds.has(sessionId);
  }

  getNapNev(dateStr: string): string {
    const napok = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
    return napok[new Date(dateStr).getDay()];
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${this.pad(d.getMonth() + 1)}.${this.pad(d.getDate())}.`;
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
