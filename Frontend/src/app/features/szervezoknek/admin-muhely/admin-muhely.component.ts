import { Component, OnInit } from '@angular/core';
import { MuhelyService, WorkshopGetDto, WorkshopUpdateDto, WorkshopSessionUpdateDto, WorkshopCreateDto, WorkshopSessionGetDto, RegistrationParticipantDto } from '../../../services/muhely.service';

@Component({
  selector: 'app-admin-muhely',
  standalone: false,
  templateUrl: './admin-muhely.component.html',
  styleUrl: './admin-muhely.component.sass'
})
export class AdminMuhelyComponent implements OnInit {
  workshops: WorkshopGetDto[] = [];
  isLoading = false;
  errorMessage = '';

  newWorkshop: WorkshopUpdateDto = this.getUresWorkshop();
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  editingWorkshopId: string | null = null;

  selectedSessionTitle: string | null = null;
  selectedSessionParticipants: RegistrationParticipantDto[] = [];

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  constructor(private muhelyService: MuhelyService) {}

  ngOnInit(): void {
    this.loadWorkshops();
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

  getNapNev(dateStr: string): string {
    const napok = ['VASÁRNAP', 'HÉTFŐ', 'KEDD', 'SZERDA', 'CSÜTÖRTÖK', 'PÉNTEK', 'SZOMBAT'];
    return napok[new Date(dateStr).getDay()];
  }

  viewParticipants(workshop: WorkshopGetDto, session: WorkshopSessionGetDto): void {
    const nap = this.getNapNev(session.startTime);
    const datumKezdes = this.formatDateTime(session.startTime);
    const idoBefejezes = this.formatTime(session.endTime);

    this.selectedSessionTitle =
      `${workshop.title}, ${nap} ${datumKezdes}-${idoBefejezes}, ${session.capacity}/${session.participants.length} résztvevői:`;
    this.selectedSessionParticipants = session.participants;
  }

  closeParticipants(): void {
    this.selectedSessionTitle = null;
    this.selectedSessionParticipants = [];
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
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
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
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
      }
    });
  }

  startEdit(workshop: WorkshopGetDto): void {
    this.editingWorkshopId = workshop.id;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';

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
            targetGender: s.targetGender ?? null
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
    this.newWorkshop = this.getUresWorkshop();
    this.editingWorkshopId = null;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
  }

  createManyWorkshops(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: WorkshopCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch (e) {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      return;
    }

    this.isBulkSaving = true;

    this.muhelyService.createMany(dtos).subscribe({
      next: (created) => {
        this.workshops = [...this.workshops, ...created];
        this.bulkSuccessMessage = 'A műhelyek sikeresen létrehozva!';
        this.isBulkSaving = false;
        this.bulkJson = '';
      },
      error: (err) => {
        this.bulkErrorMessage = err.message;
        this.isBulkSaving = false;
      }
    });
  }

  cancelBulk(): void {
    this.bulkJson = '';
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';
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
        "targetGender": null
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
        targetGender: s.targetGender ? s.targetGender : null
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
      targetGender: null
    };
  }
}
