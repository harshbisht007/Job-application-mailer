import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MailService {
  constructor(private readonly http: HttpClient) {}

  sendMail(formData: FormData): Observable<any> {
    return this.http.post('/api/mail/send', formData);
  }
}


