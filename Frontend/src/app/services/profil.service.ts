import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { parseErrorMessage } from '../helpers/error-parser.helper';
import { AuthService } from './auth.service';

export interface ProfileCreateDto {
  name: string;
  email: string;
  role: string;
  birthDate: string;
  gender: string;
}

export interface ProfileUpdateDto {
  name: string;
  email: string;
  role: string;
  birthDate: string;
  gender: string;
}

export interface ProfileGetAllDto {
  id: string;
  name: string;
  email: string;
  role: string;
  birthDate: string;
  gender?: string;
}

export interface ProfileGetByIdDto {
  id: string;
  name: string;
  email: string;
  birthDate: string;
  gender?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfilService {
  private apiUrl = `${environment.apiUrl}/Profile`;

  private successMessageSubject = new BehaviorSubject<string>('');
  public successMessage$ = this.successMessageSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject<string>('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  public getAll(): Observable<ProfileGetAllDto[]> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'A résztvevők listázásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.get<ProfileGetAllDto[]>(this.apiUrl).pipe(
      tap(() => this.kezelSiker('A résztvevők listája sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public getById(id: string): Observable<ProfileGetByIdDto> {
    return this.http.get<ProfileGetByIdDto>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('A profil adatai sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public create(dto: ProfileCreateDto): Observable<ProfileGetByIdDto> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Új profil létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.post<ProfileGetByIdDto>(this.apiUrl, dto).pipe(
      tap(() => this.kezelSiker('A profil sikeresen létrehozva!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public update(id: string, dto: ProfileUpdateDto): Observable<ProfileGetByIdDto> {
    return this.http.put<ProfileGetByIdDto>(`${this.apiUrl}/${id}`, dto).pipe(
      tap(() => this.kezelSiker('A profil sikeresen frissítve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public delete(id: string): Observable<void> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Profil törléséhez szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('A profil sikeresen törölve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public changePassword(id: string, dto: ChangePasswordDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/change-password`, dto).pipe(
      tap(() => this.kezelSiker('A jelszó sikeresen megváltoztatva!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public createMany(dtos: ProfileCreateDto[]): Observable<ProfileGetByIdDto[]> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Tömeges profil létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }

    return this.http.post<ProfileGetByIdDto[]>(`${this.apiUrl}/bulk`, dtos).pipe(
      tap(() => this.kezelSiker('A profilok sikeresen létrehozva!')),
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
