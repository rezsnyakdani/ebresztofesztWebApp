import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgramService, ProgramItemGetDto, ProgramItemCreateDto } from '../../../services/program.service';
import { SignalrService } from '../../../services/signalr.service';
import { parseErrorMessage } from '../../../helpers/error-parser.helper';

@Component({
  selector: 'app-admin-program',
  standalone: false,
  templateUrl: './admin-program.component.html',
  styleUrl: './admin-program.component.sass'
})
export class AdminProgramComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('bulkFormSection') bulkFormSectionRef!: ElementRef;

  programItems: ProgramItemGetDto[] = [];
  isLoading = true;
  errorMessage = '';

  newItem: ProgramItemCreateDto = { title: '', startTime: '', endTime: '', location: '' };
  editingId: string | null = null;
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  private signalrSub = new Subscription();
  private pendingScroll: 'createForm' | 'bulkForm' | 'top' | null = null;

  constructor(
    private programService: ProgramService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.signalrSub.add(this.signalrService.programItemsChanged$.subscribe(() => this.loadItems()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.pendingScroll === 'createForm' && this.createFormSectionRef) {
      this.createFormSectionRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.pendingScroll = null;
    }
    if (this.pendingScroll === 'bulkForm' && this.bulkFormSectionRef) {
      this.bulkFormSectionRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.pendingScroll = null;
    }
    if (this.pendingScroll === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.pendingScroll = null;
    }
  }

  loadItems(): void {
    this.programService.getAll().subscribe({
      next: items => {
        this.programItems = items;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  saveItem(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    const request = this.editingId
      ? this.programService.update(this.editingId, this.newItem)
      : this.programService.create(this.newItem);

    request.subscribe({
      next: () => {
        const msg = this.editingId ? 'Programpont sikeresen frissítve!' : 'Programpont sikeresen létrehozva!';
        this.resetForm();
        this.createSuccessMessage = msg;
        this.loadItems();
        this.isSaving = false;
        this.pendingScroll = 'createForm';
      },
      error: err => {
        this.createErrorMessage = parseErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  startEdit(item: ProgramItemGetDto): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.editingId = item.id;
    this.newItem = {
      title: item.title,
      startTime: item.startTime ? item.startTime.slice(0, 16) : '',
      endTime: item.endTime ? item.endTime.slice(0, 16) : '',
      location: item.location ?? ''
    };
    this.pendingScroll = 'createForm';
  }

  deleteItem(item: ProgramItemGetDto): void {
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${item.title}" programpontot?`)) return;

    this.programService.delete(item.id).subscribe({
      next: () => {
        this.loadItems();
        this.pendingScroll = 'top';
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
      }
    });
  }

  cancelItem(): void {
    this.resetForm();
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
  }

  private resetForm(): void {
    this.editingId = null;
    this.newItem = { title: '', startTime: '', endTime: '', location: '' };
  }

  createManyItems(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: ProgramItemCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      this.pendingScroll = 'bulkForm';
      return;
    }

    this.isBulkSaving = true;
    this.programService.createMany(dtos).subscribe({
      next: () => {
        this.bulkSuccessMessage = 'A programpontok sikeresen létrehozva!';
        this.isBulkSaving = false;
        this.bulkJson = '';
        this.loadItems();
        this.pendingScroll = 'bulkForm';
      },
      error: err => {
        this.bulkErrorMessage = parseErrorMessage(err);
        this.isBulkSaving = false;
        this.pendingScroll = 'bulkForm';
      }
    });
  }

  cancelBulk(): void {
    this.bulkJson = '';
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';
    this.pendingScroll = 'bulkForm';
  }

  readonly sampleJson = `[
  {
    "title": "Reggeli ima",
    "startTime": "2026-07-15T08:00:00",
    "endTime": "2026-07-15T08:30:00",
    "location": "Főszínpad"
  },
  {
    "title": "Előadás",
    "startTime": "2026-07-15T10:00:00",
    "endTime": "2026-07-15T11:30:00",
    "location": "Nagysátor"
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  formatDateTime(dt: string | null): string {
    if (!dt) return '–';
    const d = new Date(dt);
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}
