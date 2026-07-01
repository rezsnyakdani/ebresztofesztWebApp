import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private hubConnection!: signalR.HubConnection;

  public workshopsChanged$ = new Subject<void>();
  public profilesChanged$ = new Subject<void>();
  public lecturesChanged$ = new Subject<void>();

  startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(environment.hubUrl)
      .withAutomaticReconnect()
      .build();

    this.registerListeners();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR kapcsolat sikeresen létrejött.'))
      .catch(err => console.error('SignalR kapcsolat sikertelen:', err));
  }

  private registerListeners(): void {
    this.hubConnection.on('WorkshopsChanged', () => {
      console.log('SignalR: WorkshopsChanged esemény érkezett.');
      this.workshopsChanged$.next();
    });

    this.hubConnection.on('ProfilesChanged', () => {
      console.log('SignalR: ProfilesChanged esemény érkezett.');
      this.profilesChanged$.next();
    });

    this.hubConnection.on('LecturesChanged', () => {
      console.log('SignalR: LecturesChanged esemény érkezett.');
      this.lecturesChanged$.next();
    });
  }

  stopConnection(): void {
    this.hubConnection?.stop();
  }
}
