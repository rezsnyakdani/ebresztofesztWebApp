import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProgramService, ProgramItemGetDto } from '../../services/program.service';
import { SignalrService } from '../../services/signalr.service';

export interface DayGroup {
  dayName: string;
  dateLabel: string;
  items: ProgramItemGetDto[];
}

const NAP_NEVEK = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];

@Component({
  selector: 'app-program',
  standalone: false,
  templateUrl: './program.component.html',
  styleUrl: './program.component.sass'
})
export class ProgramComponent implements OnInit, OnDestroy {
  dayGroups: DayGroup[] = [];
  isLoading = true;
  errorMessage = '';

  private signalrSub = new Subscription();

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

  loadItems(): void {
    this.programService.getAll().subscribe({
      next: items => {
        this.dayGroups = this.groupByDay(items);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Nem sikerült betölteni a programtervet.';
        this.isLoading = false;
      }
    });
  }

  private groupByDay(items: ProgramItemGetDto[]): DayGroup[] {
    const map = new Map<string, ProgramItemGetDto[]>();

    for (const item of items) {
      const d = new Date(item.startTime);
      // Éjfél utáni programpontok (00:00–05:59) az előző naphoz tartoznak
      if (d.getHours() < 6) {
        d.setDate(d.getDate() - 1);
      }
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupItems]) => {
        const d = new Date(key);
        return {
          dayName: NAP_NEVEK[d.getDay()],
          dateLabel: `${d.getFullYear()}. ${pad(d.getMonth() + 1)}. ${pad(d.getDate())}.`,
          items: groupItems
        };
      });
  }

  formatTime(startTime: string, endTime: string | null): string {
    const start = toHHmm(new Date(startTime));
    if (!endTime) return start;
    const end = toHHmm(new Date(endTime));
    return `${start} – ${end}`;
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function toHHmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
