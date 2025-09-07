import { Routes } from '@angular/router';
import { MailFormComponent } from './components/mail-form/mail-form.component';

export const routes: Routes = [
  { path: '', component: MailFormComponent },
  { path: '**', redirectTo: '' }
];
