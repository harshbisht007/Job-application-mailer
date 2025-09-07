import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MailFormComponent } from './components/mail-form/mail-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('angular-resume-mailer');
}
