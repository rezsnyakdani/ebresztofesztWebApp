import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface InfoBlockGetDto {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
}

export interface InfoBlockDto {
  title: string;
  content: string;
  orderIndex: number;
}

@Injectable({ providedIn: 'root' })
export class InfoService {
  private apiUrl = `${environment.apiUrl}/infoblock`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<InfoBlockGetDto[]> {
    return this.http.get<InfoBlockGetDto[]>(this.apiUrl);
  }

  getById(id: string): Observable<InfoBlockGetDto> {
    return this.http.get<InfoBlockGetDto>(`${this.apiUrl}/${id}`);
  }

  create(dto: InfoBlockDto): Observable<InfoBlockGetDto> {
    return this.http.post<InfoBlockGetDto>(this.apiUrl, dto);
  }

  update(id: string, dto: InfoBlockDto): Observable<InfoBlockGetDto> {
    return this.http.put<InfoBlockGetDto>(`${this.apiUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
