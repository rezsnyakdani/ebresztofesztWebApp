import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { EloadasService, LectureGetDto } from '../../services/eloadas.service';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-eloadas',
  standalone: false,
  templateUrl: './eloadas.component.html',
  styleUrl: './eloadas.component.sass'
})
export class EloadasComponent implements OnInit, OnDestroy {
  private signalrSub = new Subscription();

  lectures: LectureGetDto[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private eloadasService: EloadasService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadLectures();
    this.signalrSub.add(this.signalrService.lecturesChanged$.subscribe(() => this.loadLectures()));
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

  getImageUrl(imagePath: string | null): string | null {
    return this.eloadasService.getImageUrl(imagePath);
  }

  getNapNev(dateStr: string): string {
    const napok = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
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
