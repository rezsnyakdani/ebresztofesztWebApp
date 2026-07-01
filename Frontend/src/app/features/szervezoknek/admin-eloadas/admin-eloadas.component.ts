import { AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { EloadasService, LectureGetDto, LectureBulkDto } from '../../../services/eloadas.service';
import { SignalrService } from '../../../services/signalr.service';

@Component({
  selector: 'app-admin-eloadas',
  standalone: false,
  templateUrl: './admin-eloadas.component.html',
  styleUrl: './admin-eloadas.component.sass'
})
export class AdminEloadasComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('bulkFormSection') bulkFormSectionRef!: ElementRef;
  @ViewChild('fileInput') fileInputRef?: ElementRef;

  private pendingScroll: 'createForm' | 'bulkForm' | 'top' | null = null;
  private signalrSub = new Subscription();

  lectures: LectureGetDto[] = [];
  isLoading = false;
  errorMessage = '';

  newLecture = this.getUresLecture();
  selectedFile: File | null = null;
  currentImageUrl: string | null = null;
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  editingLectureId: string | null = null;

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  constructor(
    private eloadasService: EloadasService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadLectures();
    this.signalrSub.add(this.signalrService.lecturesChanged$.subscribe(() => this.loadLectures()));
  }

  ngAfterViewChecked(): void {
    if (!this.pendingScroll) return;

    if (this.pendingScroll === 'top') {
      this.pendingScroll = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const refMap: Record<string, ElementRef> = {
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

  loadLectures(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.eloadasService.getAll().subscribe({
      next: (data) => {
        this.lectures = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  getNapNev(dateStr: string): string {
    const napok = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    return napok[new Date(dateStr).getDay()];
  }

  getImageUrl(imagePath: string | null): string | null {
    return this.eloadasService.getImageUrl(imagePath);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = (input.files && input.files.length > 0) ? input.files[0] : null;
  }

  saveLecture(): void {
    if (this.editingLectureId) {
      this.updateLecture();
    } else {
      this.createLecture();
    }
  }

  createLecture(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.eloadasService.create(
      this.newLecture.lecturerName,
      this.newLecture.description,
      this.newLecture.startTime,
      this.newLecture.endTime,
      this.selectedFile
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.resetForm();
        this.createSuccessMessage = 'Az előadás sikeresen mentve!';
        this.loadLectures();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  updateLecture(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.eloadasService.update(
      this.editingLectureId!,
      this.newLecture.lecturerName,
      this.newLecture.description,
      this.newLecture.startTime,
      this.newLecture.endTime,
      this.selectedFile
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.editingLectureId = null;
        this.resetForm();
        this.createSuccessMessage = 'Az előadás adatainak frissítése sikeres!';
        this.loadLectures();
        this.scrollTo('createForm');
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
        this.scrollTo('createForm');
      }
    });
  }

  startEdit(lecture: LectureGetDto): void {
    this.editingLectureId = lecture.id;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.selectedFile = null;
    this.currentImageUrl = this.eloadasService.getImageUrl(lecture.imagePath);
    this.newLecture = {
      lecturerName: lecture.lecturerName,
      description: lecture.description,
      startTime: lecture.startTime ? lecture.startTime.substring(0, 16) : '',
      endTime: lecture.endTime ? lecture.endTime.substring(0, 16) : '',
    };
    this.scrollTo('createForm');
  }

  deleteLecture(lecture: LectureGetDto): void {
    const megerosit = confirm(`Biztosan törölni akarja a(z) "${lecture.lecturerName}" előadását?`);
    if (!megerosit) return;

    this.eloadasService.delete(lecture.id).subscribe({
      next: () => {
        this.loadLectures();
        this.scrollToTop();
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  cancelLecture(): void {
    const wasEditing = !!this.editingLectureId;
    this.editingLectureId = null;
    this.resetForm();
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    if (wasEditing) {
      this.scrollToTop();
    } else {
      this.scrollTo('createForm');
    }
  }

  createManyLectures(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: LectureBulkDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch (e) {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      this.scrollTo('bulkForm');
      return;
    }

    this.isBulkSaving = true;

    this.eloadasService.createMany(dtos).subscribe({
      next: (created) => {
        this.lectures = [...this.lectures, ...created];
        this.bulkSuccessMessage = 'Az előadások sikeresen létrehozva!';
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
    "lecturerName": "Kovács Anna",
    "description": "Egy inspiráló előadás a hitről és a mindennapokról.",
    "startTime": "2026-07-15T10:00:00",
    "endTime": "2026-07-15T11:00:00"
  },
  {
    "lecturerName": "Tóth Béla",
    "description": "Ima és a Szentlélek szerepe az életünkben.",
    "startTime": "2026-07-16T14:00:00",
    "endTime": "2026-07-16T15:30:00"
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  private scrollTo(target: 'createForm' | 'bulkForm'): void {
    this.pendingScroll = target;
  }

  private scrollToTop(): void {
    this.pendingScroll = 'top';
  }

  private resetForm(): void {
    this.newLecture = this.getUresLecture();
    this.selectedFile = null;
    this.currentImageUrl = null;
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.value = '';
    }
  }

  private getUresLecture() {
    return {
      lecturerName: '',
      description: '',
      startTime: '',
      endTime: '',
    };
  }
}
