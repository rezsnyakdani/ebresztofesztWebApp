import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SongGetDto {
  id: string;
  title: string;
  content: string;
}

export interface SongCreateDto {
  title: string;
  content: string;
}

@Injectable({ providedIn: 'root' })
export class DalService {
  private apiUrl = `${environment.apiUrl}/song`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SongGetDto[]> {
    return this.http.get<SongGetDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<SongGetDto> {
    return this.http.get<SongGetDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: SongCreateDto): Observable<SongGetDto> {
    return this.http.post<SongGetDto>(this.apiUrl, dto);
  }

  update(id: string, dto: SongCreateDto): Observable<SongGetDto> {
    return this.http.put<SongGetDto>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createMany(dtos: SongCreateDto[]): Observable<SongGetDto[]> {
    return this.http.post<SongGetDto[]>(`${this.apiUrl}/bulk`, dtos);
  }
}
