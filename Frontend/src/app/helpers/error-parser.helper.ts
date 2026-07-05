import { HttpErrorResponse } from '@angular/common/http';

export function parseErrorMessage(error: HttpErrorResponse): string {
  const fallback = 'Váratlan hiba történt a szerverrel való kommunikáció során.';

  if (error.error instanceof ErrorEvent) {
    return `Hálózati hiba: ${error.error.message}`;
  }

  // Angular sometimes doesn't auto-parse application/problem+json — try manual parse
  let body = error.error;
  if (typeof body === 'string' && body.trim().startsWith('{')) {
    try { body = JSON.parse(body); } catch {}
  }

  if (body && typeof body === 'object') {
    // ProblemDetails: { detail: "..." }
    if (body.detail) return body.detail;

    // ValidationProblemDetails: { errors: { Field: ["msg1", ...] } }
    if (body.errors && typeof body.errors === 'object') {
      const messages = (Object.values(body.errors) as string[][]).flat().filter(Boolean);
      if (messages.length > 0) return messages.join('\n');
    }

    // Generic { title: "..." } fallback
    if (body.title) return body.title;

    // Angular Error object
    if (body.message) return body.message;
  }

  if (error.status === 0) return 'A szerver nem elérhető.';

  return fallback;
}
