import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProfilService, ProfileGetAllDto, ProfileCreateDto } from '../../../services/profil.service';
import { MuhelyService, WorkshopGetDto, WorkshopRegistrationGetDto, WorkshopSessionGetDto } from '../../../services/muhely.service';
import { SignalrService } from '../../../services/signalr.service';

@Component({
  selector: 'app-admin-profil',
  standalone: false,
  templateUrl: './admin-profil.component.html',
  styleUrl: './admin-profil.component.sass'
})
export class AdminProfilComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('registrationsPanel') registrationsPanelRef!: ElementRef;
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('bulkFormSection') bulkFormSectionRef!: ElementRef;

  private pendingScroll: 'registrations' | 'createForm' | 'bulkForm' | 'top' | null = null;
  private signalrSub = new Subscription();

  profiles: ProfileGetAllDto[] = [];
  isLoading = false;
  errorMessage = '';

  newProfile: ProfileCreateDto = this.getUresProfil();
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  editingProfileId: string | null = null;

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  allWorkshops: WorkshopGetDto[] = [];

  selectedProfile: ProfileGetAllDto | null = null;
  selectedProfileRegistrations: WorkshopRegistrationGetDto[] = [];
  selectedRegistrationTitle: string | null = null;
  selectedSessionId: string = '';
  addRegistrationSuccess = '';
  addRegistrationError = '';

  constructor(
    private profilService: ProfilService,
    private muhelyService: MuhelyService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadProfiles();
    this.loadWorkshops();
    this.signalrSub.add(this.signalrService.profilesChanged$.subscribe(() => {
      this.loadProfiles();
      this.syncRegistrationsPanel();
    }));
    this.signalrSub.add(this.signalrService.workshopsChanged$.subscribe(() => {
      this.loadWorkshops();
      if (this.selectedProfile) this.refreshRegistrations();
    }));
  }

  ngAfterViewChecked(): void {
    if (!this.pendingScroll) return;

    if (this.pendingScroll === 'top') {
      this.pendingScroll = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const refMap: Record<string, ElementRef> = {
      registrations: this.registrationsPanelRef,
      createForm: this.createFormSectionRef,
      bulkForm: this.bulkFormSectionRef,
    };
    const ref = refMap[this.pendingScroll];
    if (ref?.nativeElement) {
      this.pendingScroll = null;
      ref.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  private scrollTo(target: 'registrations' | 'createForm' | 'bulkForm'): void {
    this.pendingScroll = target;
  }

  private scrollToTop(): void {
    this.pendingScroll = 'top';
  }

  loadProfiles(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.profilService.getAll().subscribe({
      next: (data) => {
        this.profiles = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  loadWorkshops(): void {
    this.muhelyService.getAll().subscribe({
      next: (data) => { this.allWorkshops = data; },
      error: () => {}
    });
  }

  private syncRegistrationsPanel(): void {
    if (!this.selectedProfile) return;
    const updated = this.profiles.find(p => p.id === this.selectedProfile!.id);
    if (!updated) { this.closeRegistrations(); return; }
    this.selectedProfile = updated;
    this.refreshRegistrations();
  }

  private refreshRegistrations(): void {
    if (!this.selectedProfile) return;
    this.muhelyService.getRegistrationsByProfileId(this.selectedProfile.id).subscribe({
      next: (data) => {
        this.selectedProfileRegistrations = data;
      },
      error: () => {}
    });
  }

  viewRegistrations(profile: ProfileGetAllDto): void {
    this.selectedProfile = profile;
    this.selectedRegistrationTitle = `${profile.name} jelentkezései:`;
    this.selectedSessionId = '';
    this.addRegistrationSuccess = '';
    this.addRegistrationError = '';
    this.muhelyService.getRegistrationsByProfileId(profile.id).subscribe({
      next: (data) => {
        this.selectedProfileRegistrations = data;
      },
      error: (err) => {
        this.addRegistrationError = err.message;
      }
    });
    this.scrollTo('registrations');
  }

  closeRegistrations(): void {
    this.selectedProfile = null;
    this.selectedRegistrationTitle = null;
    this.selectedProfileRegistrations = [];
    this.selectedSessionId = '';
    this.addRegistrationSuccess = '';
    this.addRegistrationError = '';
    this.scrollToTop();
  }

  addRegistration(): void {
    if (!this.selectedSessionId) {
      this.addRegistrationError = 'Kérjük válasszon műhely alkalmat!';
      return;
    }
    this.addRegistrationError = '';
    this.addRegistrationSuccess = '';

    this.muhelyService.createRegistration({
      profileId: this.selectedProfile!.id,
      workshopSessionId: this.selectedSessionId
    }).subscribe({
      next: (reg) => {
        this.selectedProfileRegistrations = [...this.selectedProfileRegistrations, reg];
        this.selectedSessionId = '';
        this.addRegistrationSuccess = 'A jelentkezés sikeresen hozzáadva!';
      },
      error: (err) => {
        this.addRegistrationError = err.message;
      }
    });
  }

  deleteRegistration(reg: WorkshopRegistrationGetDto): void {
    this.muhelyService.deleteRegistration(reg.id).subscribe({
      next: () => {
        this.selectedProfileRegistrations = this.selectedProfileRegistrations.filter(r => r.id !== reg.id);
        this.addRegistrationSuccess = 'A jelentkezés sikeresen törölve!';
        this.addRegistrationError = '';
      },
      error: (err) => {
        this.addRegistrationError = err.message;
        this.addRegistrationSuccess = '';
      }
    });
  }

  cancelAddRegistration(): void {
    this.selectedSessionId = '';
    this.addRegistrationError = '';
    this.addRegistrationSuccess = '';
  }

  getAllSessions(): { workshop: WorkshopGetDto; session: WorkshopSessionGetDto }[] {
    const result: { workshop: WorkshopGetDto; session: WorkshopSessionGetDto }[] = [];
    for (const w of this.allWorkshops) {
      for (const s of w.sessions) {
        result.push({ workshop: w, session: s });
      }
    }
    return result;
  }

  formatSessionOption(workshop: WorkshopGetDto, session: WorkshopSessionGetDto): string {
    const nap = this.getNapNev(session.startTime);
    const kezdes = this.formatDateTime(session.startTime);
    const befejezes = this.formatTime(session.endTime);
    const idopont = `${nap} ${kezdes}-${befejezes}`;
    const resztvevok = `${session.participants.length}/${session.capacity}`;
    const extras: string[] = [];
    if (session.minAge != null) extras.push(`min ${session.minAge} év`);
    if (session.maxAge != null) extras.push(`max ${session.maxAge} év`);
    if (session.targetGender) extras.push(session.targetGender);
    const extraStr = extras.length ? `, ${extras.join(', ')}` : '';
    return `${workshop.title}, ${idopont}, ${resztvevok}${extraStr}`;
  }

  formatRegistrationItem(reg: WorkshopRegistrationGetDto): string {
    const nap = this.getNapNev(reg.startTime);
    const kezdes = this.formatDateTime(reg.startTime);
    const befejezes = this.formatTime(reg.endTime);
    return `${reg.workshopTitle}, ${nap} ${kezdes}-${befejezes}`;
  }

  getNapNev(dateStr: string): string {
    const napok = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
    return napok[new Date(dateStr).getDay()];
  }

  private formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${this.pad(d.getMonth() + 1)}.${this.pad(d.getDate())}. ${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  private formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    return `${this.pad(d.getHours())}:${this.pad(d.getMinutes())}`;
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  saveProfile(): void {
    if (this.editingProfileId) {
      this.updateProfile();
    } else {
      this.createProfile();
    }
  }

  createProfile(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.profilService.create(this.newProfile).subscribe({
      next: (created) => {
        this.profiles = [
          ...this.profiles,
          {
            id: created.id,
            name: created.name,
            email: created.email,
            role: this.newProfile.role,
            birthDate: created.birthDate,
            gender: created.gender
          }
        ];
        this.createSuccessMessage = 'Az új résztvevő sikeresen mentve!';
        this.isSaving = false;
        this.newProfile = this.getUresProfil();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  updateProfile(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.profilService.update(this.editingProfileId!, this.newProfile).subscribe({
      next: () => {
        this.createSuccessMessage = 'A résztvevő adatainak frissítése sikeres';
        this.isSaving = false;
        this.newProfile = this.getUresProfil();
        this.editingProfileId = null;
        this.loadProfiles();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  startEdit(profile: ProfileGetAllDto): void {
    this.editingProfileId = profile.id;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.newProfile = {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      birthDate: profile.birthDate ? profile.birthDate.substring(0, 10) : '',
      gender: profile.gender ?? ''
    };
    this.scrollTo('createForm');
  }

  deleteProfile(profile: ProfileGetAllDto): void {
    const megerosit = confirm(`Biztosan törölni akarja a "${profile.name}" résztvevőt?`);
    if (!megerosit) return;

    this.profilService.delete(profile.id).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(p => p.id !== profile.id);
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  cancelProfile(): void {
    const wasEditing = !!this.editingProfileId;
    this.newProfile = this.getUresProfil();
    this.editingProfileId = null;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    if (wasEditing) {
      this.scrollToTop();
    } else {
      this.scrollTo('createForm');
    }
  }

  createManyProfiles(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: ProfileCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch (e) {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      this.scrollTo('bulkForm');
      return;
    }

    this.isBulkSaving = true;

    this.profilService.createMany(dtos).subscribe({
      next: (created) => {
        this.profiles = [
          ...this.profiles,
          ...created.map((c, i) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            role: dtos[i]?.role ?? '',
            birthDate: c.birthDate,
            gender: c.gender
          }))
        ];
        this.bulkSuccessMessage = 'A profilok sikeresen létrehozva!';
        this.isBulkSaving = false;
        this.bulkJson = '';
        this.scrollTo('bulkForm');
      },
      error: (err) => {
        this.bulkErrorMessage = err.message;
        this.isBulkSaving = false;
        this.scrollTo('bulkForm');
      }
    });
  }

  cancelBulk(): void {
    this.bulkJson = '';
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';
    this.scrollTo('bulkForm');
  }

  readonly sampleJson: string = `[
  {
    "name": "Minta János",
    "email": "minta.janos@email.com",
    "role": "Szervező",
    "birthDate": "2000-05-12",
    "gender": "Férfi"
  },
  {
    "name": "Kovács Anna",
    "email": "kovacs.anna@email.com",
    "role": "Résztvevő",
    "birthDate": "1998-11-03",
    "gender": "Nő"
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  private getUresProfil(): ProfileCreateDto {
    return {
      name: '',
      email: '',
      role: 'Résztvevő',
      birthDate: '',
      gender: 'Férfi'
    };
  }
}
