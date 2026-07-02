import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { InfoService, InfoBlockGetDto, InfoBlockDto } from '../../../services/info.service';
import { SignalrService } from '../../../services/signalr.service';
import { parseErrorMessage } from '../../../helpers/error-parser.helper';

@Component({
  selector: 'app-admin-info',
  standalone: false,
  templateUrl: './admin-info.component.html',
  styleUrl: './admin-info.component.sass'
})
export class AdminInfoComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('createFormSection') createFormSectionRef!: ElementRef;
  @ViewChild('editorArea') editorAreaRef!: ElementRef;

  infoBlocks: InfoBlockGetDto[] = [];
  isLoading = true;
  errorMessage = '';

  newInfo: InfoBlockDto = { title: '', content: '', orderIndex: 0 };
  editingId: string | null = null;
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  private signalrSub = new Subscription();
  private pendingScroll: 'createForm' | 'top' | null = null;
  private pendingSetEditor = false;

  constructor(
    private infoService: InfoService,
    private signalrService: SignalrService
  ) {}

  ngOnInit(): void {
    this.loadInfoBlocks();
    this.signalrSub.add(this.signalrService.infoBlocksChanged$.subscribe(() => this.loadInfoBlocks()));
  }

  ngOnDestroy(): void {
    this.signalrSub.unsubscribe();
  }

  ngAfterViewChecked(): void {
    if (this.pendingScroll === 'createForm' && this.createFormSectionRef) {
      this.createFormSectionRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.pendingScroll = null;
    }
    if (this.pendingScroll === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.pendingScroll = null;
    }
    if (this.pendingSetEditor && this.editorAreaRef) {
      this.editorAreaRef.nativeElement.innerHTML = this.newInfo.content;
      this.pendingSetEditor = false;
    }
  }

  loadInfoBlocks(): void {
    this.infoService.getAll().subscribe({
      next: blocks => {
        this.infoBlocks = blocks;
        this.isLoading = false;
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  saveInfo(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.syncEditorContent();
    this.isSaving = true;

    const request = this.editingId
      ? this.infoService.update(this.editingId, this.newInfo)
      : this.infoService.create(this.newInfo);

    request.subscribe({
      next: () => {
        const msg = this.editingId ? 'Információs blokk sikeresen frissítve!' : 'Információs blokk sikeresen létrehozva!';
        this.resetForm();
        this.createSuccessMessage = msg;
        this.loadInfoBlocks();
        this.isSaving = false;
        this.pendingScroll = 'top';
      },
      error: err => {
        this.createErrorMessage = parseErrorMessage(err);
        this.isSaving = false;
      }
    });
  }

  startEdit(block: InfoBlockGetDto): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.editingId = block.id;
    this.newInfo = { title: block.title, content: block.content, orderIndex: block.orderIndex };
    this.pendingSetEditor = true;
    this.pendingScroll = 'createForm';
  }

  deleteInfo(block: InfoBlockGetDto): void {
    if (!confirm(`Biztosan törölni szeretnéd a(z) "${block.title}" blokkot?`)) return;

    this.infoService.delete(block.id).subscribe({
      next: () => {
        this.loadInfoBlocks();
        this.pendingScroll = 'top';
      },
      error: err => {
        this.errorMessage = parseErrorMessage(err);
      }
    });
  }

  cancelInfo(): void {
    this.resetForm();
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
  }

  private resetForm(): void {
    this.editingId = null;
    this.newInfo = { title: '', content: '', orderIndex: 0 };
    if (this.editorAreaRef) {
      this.editorAreaRef.nativeElement.innerHTML = '';
    }
  }

  syncEditorContent(): void {
    if (this.editorAreaRef) {
      this.newInfo.content = this.editorAreaRef.nativeElement.innerHTML;
    }
  }

  execFormat(command: string, value?: string): void {
    document.execCommand(command, false, value ?? '');
    this.editorAreaRef?.nativeElement.focus();
    this.syncEditorContent();
  }

  onEditorInput(): void {
    this.syncEditorContent();
  }

  getContentPreview(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
}
