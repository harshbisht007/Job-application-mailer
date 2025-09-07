import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Chip } from 'primeng/chip';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { MailService } from '../../services/mail.service';

@Component({
  selector: 'app-mail-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    FileUploadModule,
    ButtonModule,
    CardModule,
    ToastModule,
    TextareaModule,
    ToggleSwitchModule,
    Chip,
  ],
  templateUrl: './mail-form.component.html',
})
export class MailFormComponent {
  form: FormGroup;
  uploading = signal(false);
  selectedFile: File | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly mailService: MailService,
    private readonly messageService: MessageService,
  ) {
    this.form = this.fb.group({
      recipients: [[], [this.atLeastOneEmailValidator()]],
      recipientsPaste: [''],
      subject: ['', [Validators.required, Validators.maxLength(200)]],
      message: ['', [Validators.required, Validators.maxLength(5000)]],
      role: ['Angular Developer', [Validators.required, Validators.maxLength(100)]],
      experienceYears: [2.5, [Validators.required]],
      sendIndividually: [true]
    });
  }

  private atLeastOneEmailValidator() {
    const emailRegex = /^(?:[a-zA-Z0-9_'^&/+-])+(?:\.(?:[a-zA-Z0-9_'^&/+-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/;
    return (control: any) => {
      const value: unknown = control.value;
      if (!Array.isArray(value) || value.length === 0) {
        return { emailRequired: true };
      }
      const allValid = value.every((v) => typeof v === 'string' && emailRegex.test(v.trim()));
      return allValid ? null : { invalidEmails: true };
    };
  }

  onChipsAdd(event: any) {
    const control = this.form.get('recipients');
    const current: string[] = (control?.value as string[]) ?? [];
    if (Array.isArray(current)) {
      const cleaned = current.map((e) => (typeof e === 'string' ? e.trim() : e)).filter(Boolean);
      control?.setValue(cleaned);
      control?.updateValueAndValidity();
    }
  }

  parsePastedRecipients() {
    const pasted: string = (this.form.get('recipientsPaste')?.value as string) || '';
    const split = pasted
      .split(/[,\n]/g)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const unique = Array.from(new Set(split));
    const control = this.form.get('recipients');
    control?.setValue(unique);
    control?.updateValueAndValidity();
  }

  removeRecipient(i: number) {
    const control = this.form.get('recipients');
    const list: string[] = (control?.value as string[]) ?? [];
    list.splice(i, 1);
    control?.setValue([...list]);
    control?.updateValueAndValidity();
  }

  onFileSelect(event: any) {
    const file: File | undefined = event?.files?.[0] ?? event?.currentFiles?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  async submit() {
    if (this.form.invalid || !this.selectedFile) {
      this.form.markAllAsTouched();
      if (!this.selectedFile) {
        this.messageService.add({ severity: 'warn', summary: 'File required', detail: 'Please upload your resume (PDF/DOCX).' });
      }
      return;
    }

    const { recipients, subject, message, role, experienceYears, sendIndividually } = this.form.value as {
      recipients: string[]; subject: string; message: string; role: string; experienceYears: number; sendIndividually: boolean;
    };

    const personalize = (tmpl: string, email: string) =>
      tmpl
        .replace(/\{\{\s*role\s*\}\}/g, role)
        .replace(/\{\{\s*experience\s*\}\}/g, String(experienceYears))
        .replace(/\{\{\s*email\s*\}\}/g, email);

    this.uploading.set(true);
    try {
      if (sendIndividually) {
        for (const email of recipients) {
          const fd = new FormData();
          fd.append('subject', personalize(subject, email));
          fd.append('message', personalize(message, email));
          fd.append('recipients[]', email);
          fd.append('file', this.selectedFile as File);
          await firstValueFrom(this.mailService.sendMail(fd));
        }
        this.messageService.add({ severity: 'success', summary: 'Sent', detail: `Emails sent to ${recipients.length} recipient(s).` });
      } else {
        const fd = new FormData();
        fd.append('subject', subject);
        fd.append('message', personalize(message, ''));
        recipients.forEach((email) => fd.append('recipients[]', email));
        fd.append('file', this.selectedFile as File);
        await firstValueFrom(this.mailService.sendMail(fd));
        this.messageService.add({ severity: 'success', summary: 'Sent', detail: 'Email sent to all recipients.' });
      }
      this.form.reset({ recipients: [], subject: '', message: '', role: 'Angular Developer', experienceYears: 2.5, sendIndividually: true });
      this.selectedFile = null;
    } catch (error: any) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: error?.message || 'Failed to send email.' });
    } finally {
      this.uploading.set(false);
    }
  }
}


