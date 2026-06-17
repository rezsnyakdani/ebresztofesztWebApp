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
using Microsoft.EntityFrameworkCore;
using Entities.Models;

namespace Logic.Logics
{
    public class ProfileLogic
    {
        private readonly IRepository<Entities.Models.Profile> _repository;
        private readonly IMapper _mapper;

        public ProfileLogic(IRepository<Entities.Models.Profile> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        // ================== VALIDÁCIÓS METÓDUSOK ==================

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők végezhetik el ezt a műveletet!");
        }

        private void ValidateProfileData(string email, DateTime birthDate, string gender, string role)
        {
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
            ValidateProfileData(dto.Email, dto.BirthDate, dto.Gender, dto.Role);

            var profile = _mapper.Map<Entities.Models.Profile>(dto);

            string defaultPassword = dto.BirthDate.ToString("yyyyMMdd");
            profile.PasswordHash = PasswordHasher.HashPassword(defaultPassword);

            var created = await _repository.CreateAsync(profile);
            return _mapper.Map<ProfileGetByIdDto>(created);
        }

        public async Task<ProfileGetByIdDto> UpdateAsync(string targetId, ProfileUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProfileData(dto.Email, dto.BirthDate, dto.Gender, dto.Role);

            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            _mapper.Map(dto, profile);
            await _repository.UpdateAsync(profile);

            return _mapper.Map<ProfileGetByIdDto>(profile);
        }

        public async Task DeleteAsync(string targetId, string userRole)
        {
            CheckOrganizerRole(userRole);
            var profile = await _repository.GetOneAsync(targetId);
            if (profile == null) throw new NotFoundException("A felhasználó nem található.");

            await _repository.DeleteByIdAsync(targetId);
        }

        public async Task ChangePasswordAsync(string targetId, string currentUserId, ChangePasswordDto dto)
        {
            if (targetId != currentUserId)
                throw new ForbiddenException("Csak a saját jelszavadat módosíthatod!");

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
    }
}
