import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { parseErrorMessage } from '../helpers/error-parser.helper';
import { AuthService } from './auth.service';

export interface LectureGetDto {
  id: string;
  lecturerName: string;
  description: string;
  startTime: string;
  endTime: string;
  imagePath: string | null;
}

export interface LectureBulkDto {
  lecturerName: string;
  description: string;
  startTime: string;
  endTime: string;
}

@Injectable({ providedIn: 'root' })
export class EloadasService {
  private apiUrl = `${environment.apiUrl}/Lecture`;
  private baseUrl = environment.apiUrl.replace('/api', '');

  private successMessageSubject = new BehaviorSubject<string>('');
  public successMessage$ = this.successMessageSubject.asObservable();

  private errorMessageSubject = new BehaviorSubject<string>('');
  public errorMessage$ = this.errorMessageSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  public getImageUrl(imagePath: string | null): string | null {
    if (!imagePath) return null;
    return `${this.baseUrl}${imagePath}`;
  }

  public getAll(): Observable<LectureGetDto[]> {
    return this.http.get<LectureGetDto[]>(this.apiUrl).pipe(
      tap(() => this.kezelSiker('Az előadások listája sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public getById(id: string): Observable<LectureGetDto> {
    return this.http.get<LectureGetDto>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('Az előadás adatai sikeresen betöltve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public create(lecturerName: string, description: string, startTime: string, endTime: string, image?: File | null): Observable<LectureGetDto> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Új előadás létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }
    const formData = new FormData();
    formData.append('lecturerName', lecturerName);
    formData.append('description', description);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    if (image) formData.append('image', image);

    return this.http.post<LectureGetDto>(this.apiUrl, formData).pipe(
      tap(() => this.kezelSiker('Az előadás sikeresen létrehozva!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public update(id: string, lecturerName: string, description: string, startTime: string, endTime: string, image?: File | null): Observable<LectureGetDto> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Előadás frissítéséhez szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }
    const formData = new FormData();
    formData.append('lecturerName', lecturerName);
    formData.append('description', description);
    formData.append('startTime', startTime);
    formData.append('endTime', endTime);
    if (image) formData.append('image', image);

    return this.http.put<LectureGetDto>(`${this.apiUrl}/${id}`, formData).pipe(
      tap(() => this.kezelSiker('Az előadás sikeresen frissítve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public delete(id: string): Observable<void> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Előadás törléséhez szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.kezelSiker('Az előadás sikeresen törölve!')),
      catchError(error => this.kezelHiba(error))
    );
  }

  public createMany(dtos: LectureBulkDto[]): Observable<LectureGetDto[]> {
    if (!this.checkJogosultsag(this.authService.isAdmin(), 'Tömeges előadás létrehozásához szervezői jogosultság szükséges.')) {
      return throwError(() => new Error(this.errorMessageSubject.value));
    }
    return this.http.post<LectureGetDto[]>(`${this.apiUrl}/bulk`, dtos).pipe(
      tap(() => this.kezelSiker('Az előadások sikeresen létrehozva!')),
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
