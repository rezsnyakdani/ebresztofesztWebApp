using AutoMapper;
using Data.Repositories;
using Entities.Dtos;
using Entities.Models;
using Logic.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Logic.Logics
{
    public class WorkshopRegistrationLogic
    {
        private readonly IRepository<WorkshopRegistration> _regRepo;
        private readonly IRepository<WorkshopSession> _sessionRepo;
        private readonly IRepository<Entities.Models.Profile> _profileRepo;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public WorkshopRegistrationLogic(
            IRepository<WorkshopRegistration> regRepo,
            IRepository<WorkshopSession> sessionRepo,
            IRepository<Entities.Models.Profile> profileRepo,
            IMapper mapper,
            IHubContext<AppHub> hubContext)
        {
            _regRepo = regRepo;
            _sessionRepo = sessionRepo;
            _profileRepo = profileRepo;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckAuthorization(string targetProfileId, string currentUserId, string userRole)
        {
            if (userRole != "Szervező" && targetProfileId != currentUserId)
            {
                throw new ForbiddenException("Nincs jogosultságod más felhasználó jelentkezéseinek módosításához!");
            }
        }

        public async Task<List<WorkshopRegistrationGetDto>> GetAllAsync(string userRole)
        {
            if (userRole != "Szervező") throw new ForbiddenException("Csak szervezők kérhetik le a teljes listát!");

            var registrations = await _regRepo.GetAll()
                .Include(r => r.Profile)
                .Include(r => r.WorkshopSession)
                    .ThenInclude(s => s.Workshop)
                .ToListAsync();

            return _mapper.Map<List<WorkshopRegistrationGetDto>>(registrations);
        }

        public async Task<List<WorkshopRegistrationGetDto>> GetByProfileIdAsync(string targetProfileId, string currentUserId, string userRole)
        {
            CheckAuthorization(targetProfileId, currentUserId, userRole);

            var registrations = await _regRepo.GetAll()
                .Include(r => r.Profile)
                .Include(r => r.WorkshopSession)
                    .ThenInclude(s => s.Workshop)
                .Where(r => r.ProfileId == targetProfileId)
                .ToListAsync();

            return _mapper.Map<List<WorkshopRegistrationGetDto>>(registrations);
        }

        public async Task<WorkshopRegistrationGetDto> CreateAsync(WorkshopRegistrationCreateDto dto, string currentUserId, string userRole)
        {
            CheckAuthorization(dto.ProfileId, currentUserId, userRole);

            var profile = await _profileRepo.GetOneAsync(dto.ProfileId);
            if (profile == null) throw new NotFoundException("A profil nem található!");

            var session = await _sessionRepo.GetAll()
                .Include(s => s.Workshop)
                .Include(s => s.Registrations) 
                .FirstOrDefaultAsync(s => s.Id == dto.WorkshopSessionId);

            if (session == null) throw new NotFoundException("A műhely-alkalom nem található!");

            string sessionInfo = $"{session.Workshop.Title} ({session.StartTime:yyyy.MM.dd. HH:mm})";
            string errorPrefix = $"Nem tudtál jelentkezni a {sessionInfo} műhelyre, mert ";

            if (session.Registrations.Count >= session.Capacity)
                throw new BadRequestException(errorPrefix + "az már betelt.");

            if (session.Registrations.Any(r => r.ProfileId == dto.ProfileId))
                throw new BadRequestException(errorPrefix + "már korábban jelentkeztél rá.");

            if (!string.IsNullOrEmpty(session.TargetGender) && session.TargetGender != profile.Gender)
            {
                string genderText = session.TargetGender == "Nő" ? "lányoknak" : "fiúknak";
                throw new BadRequestException(errorPrefix + $"az csak {genderText} van.");
            }

            int age = DateTime.Today.Year - profile.BirthDate.Year;
            if (profile.BirthDate.Date > DateTime.Today.AddYears(-age)) age--; 
            if (session.MinAge.HasValue && age < session.MinAge.Value)
                throw new BadRequestException(errorPrefix + $"a minimális korhatár {session.MinAge} év.");
            if (session.MaxAge.HasValue && age > session.MaxAge.Value)
                throw new BadRequestException(errorPrefix + $"a maximális korhatár {session.MaxAge} év.");

            var userExistingRegistrations = await _regRepo.GetAll()
                .Include(r => r.WorkshopSession)
                    .ThenInclude(s => s.Workshop)
                .Where(r => r.ProfileId == dto.ProfileId)
                .ToListAsync();

            foreach (var existingReg in userExistingRegistrations)
            {
                var existingSession = existingReg.WorkshopSession;
                if (session.StartTime < existingSession.EndTime && session.EndTime > existingSession.StartTime)
                {
                    string existingInfo = $"{existingSession.Workshop.Title} ({existingSession.StartTime:yyyy.MM.dd. HH:mm})";
                    throw new BadRequestException(errorPrefix + $"már jelentkeztél a {existingInfo} műhelyre, ami megegyező időpontban van.");
                }
            }

            var registration = _mapper.Map<WorkshopRegistration>(dto);
            await _regRepo.CreateAsync(registration);

            var createdFull = await _regRepo.GetAll()
                .Include(r => r.Profile)
                .Include(r => r.WorkshopSession)
                    .ThenInclude(s => s.Workshop)
                .FirstOrDefaultAsync(r => r.Id == registration.Id);

            var result = _mapper.Map<WorkshopRegistrationGetDto>(createdFull);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
            return result;
        }

        public async Task DeleteAsync(string id, string currentUserId, string userRole)
        {
            var registration = await _regRepo.GetOneAsync(id);
            if (registration == null) throw new NotFoundException("A jelentkezés nem található.");

            CheckAuthorization(registration.ProfileId, currentUserId, userRole);

            await _regRepo.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
        }
    }
}