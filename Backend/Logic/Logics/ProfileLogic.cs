using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AutoMapper;
using Data.Repositories;
using Entities.Dtos;
using Logic.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Entities.Models;

namespace Logic.Logics
{
    public class ProfileLogic
    {
        private readonly IRepository<Entities.Models.Profile> _repository;
        private readonly IRepository<WorkshopRegistration> _regRepo;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public ProfileLogic(IRepository<Entities.Models.Profile> repository, IRepository<WorkshopRegistration> regRepo, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _repository = repository;
            _regRepo = regRepo;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők végezhetik el ezt a műveletet!");
        }

        private void ValidateProfileData(string name, string email, DateTime birthDate, string gender, string role)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new BadRequestException("A név megadása kötelező!");

            if (string.IsNullOrWhiteSpace(email))
                throw new BadRequestException("Az e-mail cím megadása kötelező!");

            if (string.IsNullOrWhiteSpace(gender))
                throw new BadRequestException("A nem megadása kötelező!");

            if (string.IsNullOrWhiteSpace(role))
                throw new BadRequestException("A szerepkör megadása kötelező!");

            if (birthDate == default) // A C#-ban egy meg nem adott DateTime értéke 0001.01.01.
                throw new BadRequestException("A születési dátum megadása kötelező!");

            var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
            if (!emailRegex.IsMatch(email))
                throw new BadRequestException("Az e-mail cím formátuma érvénytelen!");

            var now = DateTime.Now;
            if (birthDate > now)
                throw new BadRequestException("A születési dátum nem lehet a jövőben!");
            if (birthDate < now.AddYears(-100))
                throw new BadRequestException("A születési dátum nem lehet több mint 100 évvel ezelőtt!");

            if (gender != "Férfi" && gender != "Nő")
                throw new BadRequestException("A nem csak 'Férfi' vagy 'Nő' lehet!");

            if (role != "Szervező" && role != "Résztvevő")
                throw new BadRequestException("A szerepkör csak 'Szervező' vagy 'Résztvevő' lehet!");
        }


        public async Task<List<ProfileGetAllDto>> GetAllAsync(string userRole)
        {
            CheckOrganizerRole(userRole);
            var profiles = await _repository.GetAll().ToListAsync();
            return _mapper.Map<List<ProfileGetAllDto>>(profiles);
        }

        public async Task<ProfileGetByIdDto> GetByIdAsync(string targetId, string currentUserId, string userRole)
        {
            if (userRole != "Szervező" && targetId != currentUserId)
                throw new ForbiddenException("Nincs jogosultságod más felhasználók adatainak lekérdezésére!");

            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            return _mapper.Map<ProfileGetByIdDto>(profile);
        }

        public async Task<ProfileGetByIdDto> CreateAsync(ProfileCreateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProfileData(dto.Name, dto.Email, dto.BirthDate, dto.Gender, dto.Role);

            var profile = _mapper.Map<Entities.Models.Profile>(dto);

            string defaultPassword = dto.BirthDate.ToString("yyyyMMdd");
            profile.PasswordHash = PasswordHasher.HashPassword(defaultPassword);

            var created = await _repository.CreateAsync(profile);
            var result = _mapper.Map<ProfileGetByIdDto>(created);
            await _hubContext.Clients.All.SendAsync("ProfilesChanged");
            return result;
        }

        public async Task<ProfileGetByIdDto> UpdateAsync(string targetId, ProfileUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProfileData(dto.Name, dto.Email, dto.BirthDate, dto.Gender, dto.Role);

            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            // Check if new gender or birthDate would violate existing workshop registration constraints
            var registrations = await _regRepo.GetAll()
                .Include(r => r.WorkshopSession)
                    .ThenInclude(s => s.Workshop)
                .Where(r => r.ProfileId == targetId)
                .ToListAsync();

            if (registrations.Any())
            {
                var errors = new List<string>();
                int newAge = CalculateAge(dto.BirthDate);

                foreach (var reg in registrations)
                {
                    var session = reg.WorkshopSession;
                    string workshopTitle = session.Workshop.Title;

                    if (!string.IsNullOrEmpty(session.TargetGender) && session.TargetGender != dto.Gender)
                    {
                        errors.Add($"Nem módosíthatod {profile.Name} nemét {dto.Gender} nemre, mert résztvevő a {workshopTitle} műhelyen, ahol a célzott nem a {session.TargetGender}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }

                    if (session.MinAge.HasValue && newAge < session.MinAge.Value)
                    {
                        errors.Add($"Nem módosíthatod {profile.Name} születési idejét {dto.BirthDate:yyyy.MM.dd} dátumra, mert résztvevő a {workshopTitle} műhelyen, ahol a minimum életkor {session.MinAge}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }

                    if (session.MaxAge.HasValue && newAge > session.MaxAge.Value)
                    {
                        errors.Add($"Nem módosíthatod {profile.Name} születési idejét {dto.BirthDate:yyyy.MM.dd} dátumra, mert résztvevő a {workshopTitle} műhelyen, ahol a maximum életkor {session.MaxAge}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }
                }

                if (errors.Count > 0)
                    throw new BadRequestException(string.Join("\n", errors));
            }

            _mapper.Map(dto, profile);
            await _repository.UpdateAsync(profile);

            var result = _mapper.Map<ProfileGetByIdDto>(profile);
            await _hubContext.Clients.All.SendAsync("ProfilesChanged");
            return result;
        }

        private static int CalculateAge(DateTime birthDate)
        {
            int age = DateTime.Today.Year - birthDate.Year;
            if (birthDate.Date > DateTime.Today.AddYears(-age)) age--;
            return age;
        }

        public async Task DeleteAsync(string targetId, string userRole)
        {
            CheckOrganizerRole(userRole);
            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            await _repository.DeleteByIdAsync(targetId);
            await _hubContext.Clients.All.SendAsync("ProfilesChanged");
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
        }

        public async Task ChangePasswordAsync(string targetId, string currentUserId, ChangePasswordDto dto)
        {
            if (targetId != currentUserId)
                throw new ForbiddenException("Csak a saját jelszavadat módosíthatod!");

            if (string.IsNullOrWhiteSpace(dto.OldPassword) ||
                string.IsNullOrWhiteSpace(dto.NewPassword) ||
                string.IsNullOrWhiteSpace(dto.NewPasswordConfirm))
            {
                throw new BadRequestException("Minden jelszómező kitöltése kötelező!");
            }

            if (dto.NewPassword.Length < 8)
                throw new BadRequestException("Az új jelszónak legalább 8 karakter hosszúnak kell lennie!");

            if (dto.NewPassword != dto.NewPasswordConfirm)
                throw new BadRequestException("Az új jelszavak nem egyeznek meg!");

            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            if (profile.PasswordHash != PasswordHasher.HashPassword(dto.OldPassword))
                throw new BadRequestException("A jelenlegi jelszó helytelen!");

            profile.PasswordHash = PasswordHasher.HashPassword(dto.NewPassword);
            await _repository.UpdateAsync(profile);
        }

        public async Task<List<ProfileGetByIdDto>> CreateManyAsync(List<ProfileCreateDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);

            var profilesToCreate = new List<Entities.Models.Profile>();

            foreach (var dto in dtos)
            {
                ValidateProfileData(dto.Name, dto.Email, dto.BirthDate, dto.Gender, dto.Role);

                var profile = _mapper.Map<Entities.Models.Profile>(dto);

                string defaultPassword = dto.BirthDate.ToString("yyyyMMdd");
                profile.PasswordHash = PasswordHasher.HashPassword(defaultPassword);

                profilesToCreate.Add(profile);
            }

            await _repository.CreateManyAsync(profilesToCreate);

            var result = _mapper.Map<List<ProfileGetByIdDto>>(profilesToCreate);
            await _hubContext.Clients.All.SendAsync("ProfilesChanged");
            return result;
        }
    }
}
