import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { InfoService, InfoBlockGetDto } from '../../services/info.service';
import { SignalrService } from '../../services/signalr.service';

@Component({
  selector: 'app-menu',
  standalone: false,
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.sass'
})
export class MenuComponent implements OnInit, OnDestroy {
  logoutMessage = '';
  infoBlocks: InfoBlockGetDto[] = [];

  private signalrSub = new Subscription();

  constructor(
    public authService: AuthService,
    private router: Router,
    private infoService: InfoService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadInfoBlocks();
    this.signalrSub.add(this.signalrService.infoBlocksChanged$.subscribe(() => this.loadInfoBlocks()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  private loadInfoBlocks(): void {
    this.infoService.getAll().subscribe({
      next: blocks => this.infoBlocks = blocks,
      error: () => {}
    });
  }

  navigateToInfo(blockId: string): void {
    this.router.navigate(['/info'], { fragment: blockId });
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.logoutMessage = 'Sikeres kijelentkezés! Átirányítás...';
    setTimeout(() => {
      this.authService.logout();
      this.router.navigate(['/info']);
    }, 1000);
  }
}
