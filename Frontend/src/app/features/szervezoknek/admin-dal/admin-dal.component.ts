import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { DalService, SongGetDto, SongCreateDto } from '../../../services/dal.service';
import { SignalrService } from '../../../services/signalr.service';
import { parseErrorMessage } from '../../../helpers/error-parser.helper';

@Component({
  selector: 'app-admin-dal',
  standalone: false,
  templateUrl: './admin-dal.component.html',
  styleUrl: './admin-dal.component.sass'
})
export class AdminDalComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('bulkFormSection') bulkFormSectionRef!: ElementRef;
  @ViewChild('editorArea') editorAreaRef!: ElementRef;

  songs: SongGetDto[] = [];
  isLoading = true;
  errorMessage = '';

  newSong: SongCreateDto = { title: '', content: '' };
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
  private pendingSetEditor = false;

  constructor(
    private dalService: DalService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadSongs();
    this.signalrSub.add(this.signalrService.songsChanged$.subscribe(() => this.loadSongs()));
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
    if (this.pendingSetEditor && this.editorAreaRef) {
      this.editorAreaRef.nativeElement.innerHTML = this.newSong.content;
      this.pendingSetEditor = false;
    }
  }

  loadSongs(): void {
    this.dalService.getAll().subscribe({
      next: songs => {
        this.songs = songs;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  saveSong(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.syncEditorContent();
    this.isSaving = true;

    const request = this.editingId
      ? this.dalService.update(this.editingId, this.newSong)
      : this.dalService.create(this.newSong);

    request.subscribe({
      next: () => {
        const msg = this.editingId ? 'Dal sikeresen frissítve!' : 'Dal sikeresen létrehozva!';
        this.resetForm();
        this.createSuccessMessage = msg;
        this.loadSongs();
        this.isSaving = false;
        this.pendingScroll = 'createForm';
      },
      error: err => {
        this.createErrorMessage = parseErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  startEdit(song: SongGetDto): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.editingId = song.id;
    this.newSong = { title: song.title, content: song.content };
    this.pendingSetEditor = true;
    this.pendingScroll = 'createForm';
  }

  deleteSong(song: SongGetDto): void {
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${song.title}" dalt?`)) return;

    this.dalService.delete(song.id).subscribe({
      next: () => {
        this.loadSongs();
        this.pendingScroll = 'top';
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
      }
    });
  }

  cancelSong(): void {
    this.resetForm();
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
  }

  private resetForm(): void {
    this.editingId = null;
    this.newSong = { title: '', content: '' };
    if (this.editorAreaRef) {
      this.editorAreaRef.nativeElement.innerHTML = '';
    }
  }

  syncEditorContent(): void {
    if (this.editorAreaRef) {
      this.newSong.content = this.editorAreaRef.nativeElement.innerHTML;
    }
  }

  execFormat(command: string, value?: string): void {
    document.execCommand(command, false, value ?? '');
    this.editorAreaRef?.nativeElement.focus();
    this.syncEditorContent();
  }

  onEditorInput(): void {
    this.syncEditorContent();
  }

  createManySongs(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: SongCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      this.pendingScroll = 'bulkForm';
      return;
    }

    this.isBulkSaving = true;
    this.dalService.createMany(dtos).subscribe({
      next: () => {
        this.bulkSuccessMessage = 'A dalok sikeresen létrehozva!';
        this.isBulkSaving = false;
        this.bulkJson = '';
        this.loadSongs();
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
    "title": "Áldjad ember",
    "content": "<p>Áldjad ember ezt a napot...</p>"
  },
  {
    "title": "Magasztallak Téged",
    "content": "<p>Magasztallak Téged, Uram...</p>"
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  getContentPreview(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}
