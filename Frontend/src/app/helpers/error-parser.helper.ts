import { HttpErrorResponse } from '@angular/common/http';

export function parseErrorMessage(error: HttpErrorResponse): string {
  let errorMessage = 'Váratlan hiba történt a szerverrel való kommunikáció során.';

  if (error.error instanceof ErrorEvent) {
    return `Hálózati hiba: ${error.error.message}`;
  }

  if (error.error) {
    if (typeof error.error === 'object' && error.error.detail) {
      return error.error.detail;
    }

    if (typeof error.error === 'string') {
      return error.error;
    }

    if (typeof error.error === 'object' && error.error.message) {
      return error.error.message;
    }
  }

  if (error.statusText) {
    return `Hiba (${error.status}): ${error.statusText}`;
  }

  return errorMessage;
}
