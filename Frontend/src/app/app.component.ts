import { Component, OnInit } from '@angular/core';
import { SignalrService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.sass'
})
export class AppComponent implements OnInit {
  title = 'Frontend';

  constructor(private signalrService: SignalrService) {}

  ngOnInit(): void {
    this.signalrService.startConnection();
  }
}
