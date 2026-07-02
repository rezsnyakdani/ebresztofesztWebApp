import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { InfoService, InfoBlockGetDto } from '../../services/info.service';
import { SignalrService } from '../../services/signalr.service';

export interface InfoBlockView extends InfoBlockGetDto {
  safeContent: SafeHtml;
}

@Component({
  selector: 'app-info',
  standalone: false,
  templateUrl: './info.component.html',
  styleUrl: './info.component.sass'
})
export class InfoComponent implements OnInit, OnDestroy {
  infoBlocks: InfoBlockView[] = [];
  isLoading = true;
  errorMessage = '';

  private signalrSub = new Subscription();

  constructor(
    private infoService: InfoService,
    private signalrService: SignalrService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadInfoBlocks();
    this.signalrSub.add(this.signalrService.infoBlocksChanged$.subscribe(() => this.loadInfoBlocks()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  loadInfoBlocks(): void {
    this.infoService.getAll().subscribe({
      next: blocks => {
        this.infoBlocks = blocks.map(b => ({
          ...b,
          safeContent: this.sanitizer.bypassSecurityTrustHtml(b.content)
        }));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni az információkat.';
        this.isLoading = false;
      }
    });
  }
}
