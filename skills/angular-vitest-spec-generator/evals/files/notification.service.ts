import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private retryCount = 0;

  constructor(private http: HttpClient) {}

  sendNotification(message: string): Observable<boolean> {
    return this.http.post('/api/notify', { message }).pipe(
      switchMap(() => of(true)),
      delay(500)
    );
  }

  pollForUpdates(intervalMs: number): Observable<string> {
    return new Observable((subscriber) => {
      const id = setInterval(() => {
        this.retryCount++;
        subscriber.next(`update-${this.retryCount}`);
      }, intervalMs);

      return () => clearInterval(id);
    });
  }
}
