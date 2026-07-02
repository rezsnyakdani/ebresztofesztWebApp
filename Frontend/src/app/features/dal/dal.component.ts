import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { DalService, SongGetDto } from '../../services/dal.service';
import { SignalrService } from '../../services/signalr.service';

export interface SongView {
  id: string;
  title: string;
  content: string;
  safeContent: SafeHtml;
}

@Component({
  selector: 'app-dal',
  standalone: false,
  templateUrl: './dal.component.html',
  styleUrl: './dal.component.sass'
})
export class DalComponent implements OnInit, OnDestroy {
  songs: SongView[] = [];
  isLoading = true;
  errorMessage = '';

  private signalrSub = new Subscription();

  constructor(
    private dalService: DalService,
    private signalrService: SignalrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadSongs();
    this.signalrSub.add(this.signalrService.songsChanged$.subscribe(() => this.loadSongs()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  loadSongs(): void {
    this.dalService.getAll().subscribe({
      next: songs => {
        this.songs = songs.map(s => ({
          ...s,
          safeContent: this.sanitizer.bypassSecurityTrustHtml(s.content)
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a dalokat.';
        this.isLoading = false;
      }
    });
  }
}
