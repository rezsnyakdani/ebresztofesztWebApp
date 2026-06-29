import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { parseErrorMessage } from '../helpers/error-parser.helper';

export interface LoginDto {
  name: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  
  private tokenKey = 'festival_auth_token';


  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.loggedInSubject.asObservable();
  private isAdminSubject = new BehaviorSubject<boolean>(this.checkIfAdmin());
  public isAdmin$ = this.isAdminSubject.asObservable();

  constructor(private http: HttpClient) { }

  login(credentials: LoginDto): Observable<any> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/Auth/login`, credentials).pipe(
      tap(response => {
        if (response && response.token) {
          this.saveToken(response.token);
          this.loggedInSubject.next(true);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const tisztaHiba = parseErrorMessage(error);
        return throwError(() => new Error(tisztaHiba));
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.loggedInSubject.next(false);
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  private getDecodedToken(): any {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decodedPayload);
    } catch (e) {
      return null;
    }
  }

  private checkIfAdmin(): boolean {
    const decoded = this.getDecodedToken();
    if (!decoded) return false;

    const roleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    
    return decoded[roleKey] === 'Szervező' || decoded['Role'] === 'Szervező' || decoded['role'] === 'Szervező';
  }

  public isAdmin(): boolean {
    return this.checkIfAdmin();
  }
}
