import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { MuhelyService, WorkshopGetDto, WorkshopUpdateDto, WorkshopSessionUpdateDto, WorkshopCreateDto, WorkshopSessionGetDto, RegistrationParticipantDto } from '../../../services/muhely.service';
import { ProfilService, ProfileGetAllDto } from '../../../services/profil.service';
import { SignalrService } from '../../../services/signalr.service';

@Component({
  selector: 'app-admin-muhely',
  standalone: false,
  templateUrl: './admin-muhely.component.html',
  styleUrl: './admin-muhely.component.sass'
})
export class AdminMuhelyComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('participantsPanel') participantsPanelRef!: ElementRef;
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('bulkFormSection') bulkFormSectionRef!: ElementRef;

  private pendingScroll: 'participants' | 'createForm' | 'bulkForm' | 'top' | null = null;
  private signalrSub = new Subscription();
  workshops: WorkshopGetDto[] = [];

  sortColumn: string | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  get sortedWorkshops(): WorkshopGetDto[] {
    if (!this.sortColumn) return this.workshops;
    const col = this.sortColumn;
    return [...this.workshops].sort((a, b) => {
      let va: unknown;
      let vb: unknown;
      if (col === 'title' || col === 'lecturer') {
        va = (a as unknown as Record<string, unknown>)[col];
        vb = (b as unknown as Record<string, unknown>)[col];
      } else {
        va = a.sessions[0] ? (a.sessions[0] as unknown as Record<string, unknown>)[col] : '';
        vb = b.sessions[0] ? (b.sessions[0] as unknown as Record<string, unknown>)[col] : '';
      }
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), 'hu', { numeric: true });
      return this.sortDir === 'asc' ? cmp : -cmp;
    });
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDir = 'asc';
    }
  }

  sortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDir === 'asc' ? '↑' : '↓';
  }
  isLoading = false;
  errorMessage = '';

  newWorkshop: WorkshopUpdateDto = this.getUresWorkshop();
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  editingWorkshopId: string | null = null;

  allProfiles: ProfileGetAllDto[] = [];

  selectedSessionTitle: string | null = null;
  selectedSessionParticipants: RegistrationParticipantDto[] = [];
  selectedWorkshop: WorkshopGetDto | null = null;
  selectedSession: WorkshopSessionGetDto | null = null;
  selectedProfileId: string = '';
  addParticipantSuccess = '';
  addParticipantError = '';

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  constructor(
    private muhelyService: MuhelyService,
    private profilService: ProfilService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadWorkshops();
    this.loadProfiles();
    this.signalrSub.add(this.signalrService.workshopsChanged$.subscribe(() => this.loadWorkshops()));
    this.signalrSub.add(this.signalrService.sessionRegistrationChanged$.subscribe(data => {
      for (const workshop of this.workshops) {
        const session = workshop.sessions.find(s => s.id === data.sessionId);
        if (session) {
          session.participants = data.participants;
          break;
        }
      }
    }));
    this.signalrSub.add(this.signalrService.profilesChanged$.subscribe(() => {
      this.loadWorkshops();
      this.loadProfiles();
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
      participants: this.participantsPanelRef,
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

  loadProfiles(): void {
    this.profilService.getAll().subscribe({
      next: (data) => {
        this.allProfiles = [...data].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
      },
      error: () => {}
    });
  }

  loadWorkshops(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.muhelyService.getAll().subscribe({
      next: (data) => {
        this.workshops = data;
        this.isLoading = false;
        this.syncParticipantsPanel();
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  private syncParticipantsPanel(): void {
    if (!this.selectedSession || !this.selectedWorkshop) return;

    const updatedWorkshop = this.workshops.find(w => w.id === this.selectedWorkshop!.id);
    if (!updatedWorkshop) { this.closeParticipants(); return; }

    const updatedSession = updatedWorkshop.sessions.find(s => s.id === this.selectedSession!.id);
    if (!updatedSession) { this.closeParticipants(); return; }

    this.selectedWorkshop = updatedWorkshop;
    this.selectedSession = updatedSession;
    this.selectedSessionParticipants = [...updatedSession.participants].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    this.selectedSessionTitle = this.buildSessionTitle(updatedWorkshop, updatedSession, this.selectedSessionParticipants.length);
  }

  getNapNev(dateStr: string): string {
    const napok = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
    return napok[new Date(dateStr).getDay()];
  }

  viewParticipants(workshop: WorkshopGetDto, session: WorkshopSessionGetDto): void {
    this.selectedWorkshop = workshop;
    this.selectedSession = session;
    this.selectedSessionParticipants = [...session.participants].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
    this.selectedSessionTitle = this.buildSessionTitle(workshop, session, this.selectedSessionParticipants.length);
    this.selectedProfileId = '';
    this.addParticipantSuccess = '';
    this.addParticipantError = '';
    this.scrollTo('participants');
  }

  closeParticipants(): void {
    this.selectedSessionTitle = null;
    this.selectedSessionParticipants = [];
    this.selectedWorkshop = null;
    this.selectedSession = null;
    this.selectedProfileId = '';
    this.addParticipantSuccess = '';
    this.addParticipantError = '';
    this.scrollToTop();
  }

  addParticipant(): void {
    if (!this.selectedProfileId) {
      this.addParticipantError = 'Kérjük válasszon résztvevőt!';
      return;
    }
    this.addParticipantError = '';
    this.addParticipantSuccess = '';

    this.muhelyService.createRegistration({
      profileId: this.selectedProfileId,
      workshopSessionId: this.selectedSession!.id
    }).subscribe({
      next: (reg) => {
        const profile = this.allProfiles.find(p => p.id === this.selectedProfileId);
        const newParticipant: RegistrationParticipantDto = {
          registrationId: reg.id,
          name: profile?.name ?? ''
        };
        this.selectedSessionParticipants = [...this.selectedSessionParticipants, newParticipant].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
        const w = this.workshops.find(w => w.id === this.selectedWorkshop!.id);
        if (w) {
          const s = w.sessions.find(s => s.id === this.selectedSession!.id);
          if (s) s.participants = [...this.selectedSessionParticipants];
        }
        this.selectedSessionTitle = this.buildSessionTitle(this.selectedWorkshop!, this.selectedSession!, this.selectedSessionParticipants.length);
        this.selectedProfileId = '';
        this.addParticipantSuccess = 'A résztvevő sikeresen hozzáadva!';
      },
      error: (err) => {
        this.addParticipantError = err.message;
      }
    });
  }

  deleteParticipant(participant: RegistrationParticipantDto): void {
    this.muhelyService.deleteRegistration(participant.registrationId).subscribe({
      next: () => {
        this.selectedSessionParticipants = this.selectedSessionParticipants.filter(
          p => p.registrationId !== participant.registrationId
        );
        const w = this.workshops.find(w => w.id === this.selectedWorkshop!.id);
        if (w) {
          const s = w.sessions.find(s => s.id === this.selectedSession!.id);
          if (s) s.participants = [...this.selectedSessionParticipants];
        }
        this.selectedSessionTitle = this.buildSessionTitle(this.selectedWorkshop!, this.selectedSession!, this.selectedSessionParticipants.length);
        this.addParticipantSuccess = 'A jelentkezés sikeresen törölve!';
        this.addParticipantError = '';
      },
      error: (err) => {
        this.addParticipantError = err.message;
        this.addParticipantSuccess = '';
      }
    });
  }

  cancelAddParticipant(): void {
    this.selectedProfileId = '';
    this.addParticipantError = '';
    this.addParticipantSuccess = '';
  }

  getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  private buildSessionTitle(workshop: WorkshopGetDto, session: WorkshopSessionGetDto, count: number): string {
    const nap = this.getNapNev(session.startTime);
    const datumKezdes = this.formatDateTime(session.startTime);
    const idoBefejezes = this.formatTime(session.endTime);
    return `${workshop.title}, ${nap} ${datumKezdes}-${idoBefejezes}, ${count}/${session.capacity} résztvevői:`;
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

  private scrollTo(target: 'participants' | 'createForm' | 'bulkForm'): void {
    this.pendingScroll = target;
  }

  private scrollToTop(): void {
    this.pendingScroll = 'top';
  }

  addSession(): void {
    this.newWorkshop.sessions.push(this.getUresSession());
  }

  removeSession(index: number): void {
    this.newWorkshop.sessions.splice(index, 1);
  }

  saveWorkshop(): void {
    if (this.editingWorkshopId) {
      this.updateWorkshop();
    } else {
      this.createWorkshop();
    }
  }

  createWorkshop(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.muhelyService.create(this.getNormalizedWorkshop()).subscribe({
      next: (created) => {
        this.workshops = [...this.workshops, created];
        this.createSuccessMessage = 'Az új műhely sikeresen mentve!';
        this.isSaving = false;
        this.newWorkshop = this.getUresWorkshop();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  updateWorkshop(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.muhelyService.update(this.editingWorkshopId!, this.getNormalizedWorkshop()).subscribe({
      next: () => {
        this.createSuccessMessage = 'A műhely adatainak frissítése sikeres';
        this.isSaving = false;
        this.newWorkshop = this.getUresWorkshop();
        this.editingWorkshopId = null;
        this.loadWorkshops();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  startEdit(workshop: WorkshopGetDto): void {
    this.editingWorkshopId = workshop.id;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.scrollTo('createForm');

    this.newWorkshop = {
      title: workshop.title,
      lecturer: workshop.lecturer,
      description: workshop.description,
      sessions: workshop.sessions.length > 0
        ? workshop.sessions.map(s => ({
            id: s.id,
            startTime: s.startTime ? s.startTime.substring(0, 16) : '',
            endTime: s.endTime ? s.endTime.substring(0, 16) : '',
            place: s.place,
            capacity: s.capacity,
            minAge: s.minAge ?? null,
            maxAge: s.maxAge ?? null,
            targetGender: s.targetGender ?? null,
            startRegistration: s.startRegistration ? s.startRegistration.substring(0, 16) : null,
            endRegistration: s.endRegistration ? s.endRegistration.substring(0, 16) : null
          }))
        : [this.getUresSession()]
    };
  }

  deleteWorkshop(workshop: WorkshopGetDto): void {
    const megerosit = confirm(`Biztosan törölni akarja a "${workshop.title}" műhelyt?`);
    if (!megerosit) return;

    this.muhelyService.delete(workshop.id).subscribe({
      next: () => {
        this.workshops = this.workshops.filter(w => w.id !== workshop.id);
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  cancelWorkshop(): void {
    const wasEditing = !!this.editingWorkshopId;
    this.newWorkshop = this.getUresWorkshop();
    this.editingWorkshopId = null;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    if (wasEditing) {
      this.scrollToTop();
    } else {
      this.scrollTo('createForm');
    }
  }

  createManyWorkshops(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: WorkshopCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch (e) {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      this.scrollTo('bulkForm');
      return;
    }

    this.isBulkSaving = true;

    this.muhelyService.createMany(dtos).subscribe({
      next: (created) => {
        this.workshops = [...this.workshops, ...created];
        this.bulkSuccessMessage = 'A műhelyek sikeresen létrehozva!';
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
    "title": "Hogyan legyek boldog és sikeres a párkapcsolatban?",
    "lecturer": "Kovács Anna",
    "description": "Egy izgalmas műhely a párkapcsolatokról.",
    "sessions": [
      {
        "startTime": "2026-07-15T10:00",
        "endTime": "2026-07-15T12:00",
        "place": "1-es műhelysátor",
        "capacity": 30,
        "minAge": 16,
        "maxAge": null,
        "targetGender": null,
        "startRegistration": null,
        "endRegistration": null
      }
    ]
  },
  {
    "title": "Szentlélek és a mindennapok",
    "lecturer": "Tóth Béla",
    "description": "Ima műhely.",
    "sessions": []
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  private getNormalizedWorkshop(): WorkshopUpdateDto {
    return {
      ...this.newWorkshop,
      sessions: this.newWorkshop.sessions.map(s => ({
        ...s,
        targetGender: s.targetGender ? s.targetGender : null,
        startRegistration: s.startRegistration ? s.startRegistration : null,
        endRegistration: s.endRegistration ? s.endRegistration : null,
      }))
    };
  }

  private getUresWorkshop(): WorkshopUpdateDto {
    return {
      title: '',
      lecturer: '',
      description: '',
      sessions: [this.getUresSession()]
    };
  }

  private getUresSession(): WorkshopSessionUpdateDto {
    return {
      startTime: '',
      endTime: '',
      place: '',
      capacity: 0,
      minAge: null,
      maxAge: null,
      targetGender: null,
      startRegistration: null,
      endRegistration: null
    };
  }
}
