import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProgramItemGetDto {
  id: string;
  title: string;
  startTime: string;
  endTime: string | null;
  location: string | null;
}

export interface ProgramItemCreateDto {
  title: string;
  startTime: string;
  endTime: string;
  location: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramService {
  private apiUrl = `${environment.apiUrl}/programitem`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ProgramItemGetDto[]> {
    return this.http.get<ProgramItemGetDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<ProgramItemGetDto> {
    return this.http.get<ProgramItemGetDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: ProgramItemCreateDto): Observable<ProgramItemGetDto> {
    return this.http.post<ProgramItemGetDto>(this.apiUrl, dto);
  }

  update(id: string, dto: ProgramItemCreateDto): Observable<ProgramItemGetDto> {
    return this.http.put<ProgramItemGetDto>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  createMany(dtos: ProgramItemCreateDto[]): Observable<ProgramItemGetDto[]> {
    return this.http.post<ProgramItemGetDto[]>(`${this.apiUrl}/bulk`, dtos);
  }
}
