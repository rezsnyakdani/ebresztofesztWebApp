import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { parseErrorMessage } from '../helpers/error-parser.helper';
import { AuthService } from './auth.service';

export interface WorkshopSessionCreateDto {
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  targetGender?: string | null;
}

export interface WorkshopSessionUpdateDto {
  id?: string | null;
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  targetGender?: string | null;
}

export interface RegistrationParticipantDto {
  registrationId: string;
  name: string;
}

export interface WorkshopSessionGetDto {
  id: string;
  workshopId: string;
  startTime: string;
  endTime: string;
  place: string;
  capacity: number;
  minAge?: number | null;
  maxAge?: number | null;
  targetGender?: string | null;
  participants: RegistrationParticipantDto[];
}

export interface WorkshopCreateDto {
  title: string;
  lecturer: string;
  description: string;
  sessions: WorkshopSessionCreateDto[];
}

export interface WorkshopUpdateDto {
  title: string;
  lecturer: string;
  description: string;
  sessions: WorkshopSessionUpdateDto[];
}

export interface WorkshopGetDto {
  id: string;
  title: string;
  lecturer: string;
  description: string;
  sessions: WorkshopSessionGetDto[];
}

export interface WorkshopRegistrationCreateDto {
  profileId: string;
  workshopSessionId: string;
}

export interface WorkshopRegistrationGetDto {
  id: string;
  profileId: string;
  profileName: string;
  workshopSessionId: string;
  workshopTitle: string;
  startTime: string;
  endTime: string;
}

@Injectable({
  providedIn: 'root'
})
export class MuhelyService {
  private workshopApiUrl = `${environment.apiUrl}/Workshop`;
  private registrationApiUrl = `${environment.apiUrl}/WorkshopRegistration`;

  private successMessageSubject = new BehaviorSubject<string>('');
  public successMessage$ = this.successMessageSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject<string>('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Workshop

  public getAll(): Observable<WorkshopGetDto[]> {
    return this.http.get<WorkshopGetDto[]>(this.workshopApiUrl).pipe(
      tap(() => this.kezelSiker('A műhelyek listája sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public getById(id: string): Observable<WorkshopGetDto> {
    return this.http.get<WorkshopGetDto>(`${this.workshopApiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('A műhely adatai sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public create(dto: WorkshopCreateDto): Observable<WorkshopGetDto> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Új műhely létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.post<WorkshopGetDto>(this.workshopApiUrl, dto).pipe(
      tap(() => this.kezelSiker('A műhely sikeresen létrehozva!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public update(id: string, dto: WorkshopUpdateDto): Observable<WorkshopGetDto> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Műhely frissítéséhez szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.put<WorkshopGetDto>(`${this.workshopApiUrl}/${id}`, dto).pipe(
      tap(() => this.kezelSiker('A műhely sikeresen frissítve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public delete(id: string): Observable<void> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Műhely törléséhez szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.delete<void>(`${this.workshopApiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('A műhely sikeresen törölve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public createMany(dtos: WorkshopCreateDto[]): Observable<WorkshopGetDto[]> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Tömeges műhely létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.post<WorkshopGetDto[]>(`${this.workshopApiUrl}/bulk`, dtos).pipe(
      tap(() => this.kezelSiker('A műhelyek sikeresen létrehozva!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  // WorkshopRegistration

  public getAllRegistrations(): Observable<WorkshopRegistrationGetDto[]> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Az összes jelentkezés listázásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.get<WorkshopRegistrationGetDto[]>(this.registrationApiUrl).pipe(
      tap(() => this.kezelSiker('A jelentkezések listája sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public getRegistrationsByProfileId(profileId: string): Observable<WorkshopRegistrationGetDto[]> {
    return this.http.get<WorkshopRegistrationGetDto[]>(`${this.registrationApiUrl}/profile/${profileId}`).pipe(
      tap(() => this.kezelSiker('A jelentkezések sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public createRegistration(dto: WorkshopRegistrationCreateDto): Observable<WorkshopRegistrationGetDto> {
    return this.http.post<WorkshopRegistrationGetDto>(this.registrationApiUrl, dto).pipe(
      tap(() => this.kezelSiker('A jelentkezés sikeresen rögzítve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public deleteRegistration(id: string): Observable<void> {
    return this.http.delete<void>(`${this.registrationApiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('A jelentkezés sikeresen törölve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  private checkJogosultsag(jogosult: boolean, hibaUzenet: string): boolean {
    if (!jogosult) {
      this.errorMessageSubject.next(hibaUzenet);
    }

    return jogosult;
  }

  private kezelSiker(uzenet: string): void {
    this.successMessageSubject.next(uzenet);
    this.errorMessageSubject.next('');
  }

  private kezelHiba(error: HttpErrorResponse) {
    const tisztaHiba = parseErrorMessage(error);
    this.errorMessageSubject.next(tisztaHiba);
    this.successMessageSubject.next('');
    return throwError(() => new Error(tisztaHiba));
  }
}
