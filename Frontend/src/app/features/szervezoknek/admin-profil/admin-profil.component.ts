import { Component, OnInit } from '@angular/core';
import { ProfilService, ProfileGetAllDto, ProfileCreateDto } from '../../../services/profil.service';

@Component({
  selector: 'app-admin-profil',
  standalone: false,
  templateUrl: './admin-profil.component.html',
  styleUrl: './admin-profil.component.sass'
})
export class AdminProfilComponent implements OnInit {
  profiles: ProfileGetAllDto[] = [];
  isLoading = false;
  errorMessage = '';

  newProfile: ProfileCreateDto = this.getUresProfil();
  isSaving = false;
  createErrorMessage = '';
  createSuccessMessage = '';

  editingProfileId: string | null = null;

  bulkJson = '';
  isBulkSaving = false;
  bulkErrorMessage = '';
  bulkSuccessMessage = '';

  constructor(private profilService: ProfilService) {}

  ngOnInit(): void {
    this.loadProfiles();
  }

  loadProfiles(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.profilService.getAll().subscribe({
      next: (data) => {
        this.profiles = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    if (this.editingProfileId) {
      this.updateProfile();
    } else {
      this.createProfile();
    }
  }

  createProfile(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.profilService.create(this.newProfile).subscribe({
      next: (created) => {
        this.profiles = [
          ...this.profiles,
          {
            id: created.id,
            name: created.name,
            email: created.email,
            role: this.newProfile.role,
            birthDate: created.birthDate,
            gender: created.gender
          }
        ];

        this.createSuccessMessage = 'Az új résztvevő sikeresen mentve!';
        this.isSaving = false;
        this.newProfile = this.getUresProfil();
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
      }
    });
  }

  updateProfile(): void {
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
    this.isSaving = true;

    this.profilService.update(this.editingProfileId!, this.newProfile).subscribe({
      next: () => {
        this.createSuccessMessage = 'A résztvevő adatainak frissítése sikeres';
        this.isSaving = false;
        this.newProfile = this.getUresProfil();
        this.editingProfileId = null;
        this.loadProfiles();
      },
      error: (err) => {
        this.createErrorMessage = err.message;
        this.isSaving = false;
      }
    });
  }

  startEdit(profile: ProfileGetAllDto): void {
    this.editingProfileId = profile.id;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';

    this.newProfile = {
      name: profile.name,
      email: profile.email,
      role: profile.role,
      birthDate: profile.birthDate ? profile.birthDate.substring(0, 10) : '',
      gender: profile.gender ?? ''
    };
  }

  deleteProfile(profile: ProfileGetAllDto): void {
    const megerosit = confirm(`Biztosan törölni akarja a "${profile.name}" résztvevőt?`);
    if (!megerosit) return;

    this.profilService.delete(profile.id).subscribe({
      next: () => {
        this.profiles = this.profiles.filter(p => p.id !== profile.id);
      },
      error: (err) => {
        this.errorMessage = err.message;
      }
    });
  }

  cancelProfile(): void {
    this.newProfile = this.getUresProfil();
    this.editingProfileId = null;
    this.createErrorMessage = '';
    this.createSuccessMessage = '';
  }

  createManyProfiles(): void {
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';

    let dtos: ProfileCreateDto[];
    try {
      dtos = JSON.parse(this.bulkJson);
    } catch (e) {
      this.bulkErrorMessage = 'A megadott szöveg nem érvényes JSON formátumú!';
      return;
    }

    this.isBulkSaving = true;

    this.profilService.createMany(dtos).subscribe({
      next: (created) => {
        this.profiles = [
          ...this.profiles,
          ...created.map((c, i) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            role: dtos[i]?.role ?? '',
            birthDate: c.birthDate,
            gender: c.gender
          }))
        ];

        this.bulkSuccessMessage = 'A profilok sikeresen létrehozva!';
        this.isBulkSaving = false;
        this.bulkJson = '';
      },
      error: (err) => {
        this.bulkErrorMessage = err.message;
        this.isBulkSaving = false;
      }
    });
  }

  cancelBulk(): void {
    this.bulkJson = '';
    this.bulkErrorMessage = '';
    this.bulkSuccessMessage = '';
  }

  readonly sampleJson: string = `[
  {
    "name": "Minta János",
    "email": "minta.janos@email.com",
    "role": "Szervező",
    "birthDate": "2000-05-12",
    "gender": "Férfi"
  },
  {
    "name": "Kovács Anna",
    "email": "kovacs.anna@email.com",
    "role": "Résztvevő",
    "birthDate": "1998-11-03",
    "gender": "Nő"
  }
]`;

  fillWithSample(): void {
    this.bulkJson = this.sampleJson;
  }

  private getUresProfil(): ProfileCreateDto {
    return {
      name: '',
      email: '',
      role: '',
      birthDate: '',
      gender: ''
    };
  }
}
