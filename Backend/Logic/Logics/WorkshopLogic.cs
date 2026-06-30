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
    public class WorkshopLogic
    {
        private readonly IRepository<Workshop> _workshopRepo;
        private readonly IRepository<WorkshopSession> _sessionRepo;
        private readonly IRepository<WorkshopRegistration> _regRepo;
        private readonly WorkshopSessionLogic _sessionLogic;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public WorkshopLogic(IRepository<Workshop> workshopRepo, IRepository<WorkshopSession> sessionRepo, IRepository<WorkshopRegistration> regRepo, WorkshopSessionLogic sessionLogic, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _workshopRepo = workshopRepo;
            _sessionRepo = sessionRepo;
            _regRepo = regRepo;
            _sessionLogic = sessionLogic;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező") throw new ForbiddenException("Csak szervezők kezelhetik a műhelyeket!");
        }

        private void ValidateWorkshopData(string title, string lecturer, string description)
        {
            if (string.IsNullOrWhiteSpace(title)) throw new BadRequestException("A műhely címének megadása kötelező!");
            if (string.IsNullOrWhiteSpace(lecturer)) throw new BadRequestException("Az előadó megadása kötelező!");
            if (string.IsNullOrWhiteSpace(description)) throw new BadRequestException("A leírás megadása kötelező!");
        }

        public async Task<List<WorkshopGetDto>> GetAllAsync()
        {
            // Betöltjük a Műhelyeket -> Alkalmakat -> Jelentkezéseket -> Felhasználókat!
            var workshops = await _workshopRepo.GetAll()
                .Include(w => w.Sessions)
                    .ThenInclude(s => s.Registrations)
                        .ThenInclude(r => r.Profile)
                .OrderBy(w => w.Title)
                .ToListAsync();

            return _mapper.Map<List<WorkshopGetDto>>(workshops);
        }

        public async Task<WorkshopGetDto> GetByIdAsync(string id)
        {
            var workshop = await _workshopRepo.GetAll()
                .Include(w => w.Sessions)
                    .ThenInclude(s => s.Registrations)
                        .ThenInclude(r => r.Profile)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workshop == null) throw new NotFoundException("A műhely nem található.");
            return _mapper.Map<WorkshopGetDto>(workshop);
        }

        public async Task<WorkshopGetDto> CreateAsync(WorkshopCreateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateWorkshopData(dto.Title, dto.Lecturer, dto.Description);

            foreach (var sDto in dto.Sessions)
            {
                _sessionLogic.ValidateSessionData(sDto.StartTime, sDto.EndTime, sDto.Place, sDto.Capacity, sDto.MinAge, sDto.MaxAge, sDto.TargetGender);
            }

            var workshop = _mapper.Map<Workshop>(dto);
            var created = await _workshopRepo.CreateAsync(workshop);

            var result = await GetByIdAsync(created.Id);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
            return result;
        }

        public async Task<WorkshopGetDto> UpdateAsync(string id, WorkshopUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateWorkshopData(dto.Title, dto.Lecturer, dto.Description);

            var workshop = await _workshopRepo.GetAll()
                .Include(w => w.Sessions)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workshop == null) throw new NotFoundException("A műhely nem található.");

            await ValidateSessionUpdatesAsync(dto.Title, dto.Sessions);

            _mapper.Map(dto, workshop);

            var incomingSessionIds = dto.Sessions.Where(s => !string.IsNullOrEmpty(s.Id)).Select(s => s.Id).ToList();
            var sessionsToRemove = workshop.Sessions.Where(s => !incomingSessionIds.Contains(s.Id)).ToList();

            foreach (var sessionToRemove in sessionsToRemove)
            {
                await _sessionRepo.DeleteByIdAsync(sessionToRemove.Id, saveChanges: false);
                workshop.Sessions.Remove(sessionToRemove);
            }

            foreach (var sDto in dto.Sessions)
            {
                _sessionLogic.ValidateSessionData(sDto.StartTime, sDto.EndTime, sDto.Place, sDto.Capacity, sDto.MinAge, sDto.MaxAge, sDto.TargetGender);

                if (string.IsNullOrEmpty(sDto.Id))
                {
                    var newSession = _mapper.Map<WorkshopSession>(sDto);
                    newSession.Id = Guid.NewGuid().ToString();
                    workshop.Sessions.Add(newSession);
                }
                else
                {
                    var existingSession = workshop.Sessions.FirstOrDefault(s => s.Id == sDto.Id);
                    if (existingSession != null)
                    {
                        _mapper.Map(sDto, existingSession);
                    }
                }
            }

            await _workshopRepo.UpdateAsync(workshop);
            var result = await GetByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
            return result;
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var workshop = await _workshopRepo.GetOneAsync(id);
            if (workshop == null) throw new NotFoundException("A műhely nem található.");

            await _workshopRepo.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
        }

        public async Task<List<WorkshopGetDto>> CreateManyAsync(List<WorkshopCreateDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);

            var workshopsToCreate = new List<Workshop>();

            foreach (var dto in dtos)
            {
                ValidateWorkshopData(dto.Title, dto.Lecturer, dto.Description);

                foreach (var sDto in dto.Sessions)
                {
                    _sessionLogic.ValidateSessionData(sDto.StartTime, sDto.EndTime, sDto.Place, sDto.Capacity, sDto.MinAge, sDto.MaxAge, sDto.TargetGender);
                }

                workshopsToCreate.Add(_mapper.Map<Workshop>(dto));
            }

            var createdWorkshops = await _workshopRepo.CreateManyAsync(workshopsToCreate);

            var createdIds = createdWorkshops.Select(w => w.Id).ToList();

            var fullWorkshops = await _workshopRepo.GetAll()
                .Include(w => w.Sessions)
                    .ThenInclude(s => s.Registrations)
                        .ThenInclude(r => r.Profile)
                .Where(w => createdIds.Contains(w.Id))
                .OrderBy(w => w.Title)
                .ToListAsync();

            var result = _mapper.Map<List<WorkshopGetDto>>(fullWorkshops);
            await _hubContext.Clients.All.SendAsync("WorkshopsChanged");
            return result;
        }

        private async Task ValidateSessionUpdatesAsync(string workshopTitle, List<WorkshopSessionUpdateDto> updatedSessions)
        {
            var existingSessionIds = updatedSessions
                .Where(s => !string.IsNullOrEmpty(s.Id))
                .Select(s => s.Id!)
                .ToList();

            if (!existingSessionIds.Any()) return;

            var sessionsWithRegistrations = await _sessionRepo.GetAll()
                .Include(s => s.Registrations)
                    .ThenInclude(r => r.Profile)
                .Where(s => existingSessionIds.Contains(s.Id))
                .ToListAsync();

            var errors = new List<string>();

            foreach (var sDto in updatedSessions.Where(s => !string.IsNullOrEmpty(s.Id)))
            {
                var currentSession = sessionsWithRegistrations.FirstOrDefault(s => s.Id == sDto.Id);
                if (currentSession == null || !currentSession.Registrations.Any()) continue;

                bool timeChanging = currentSession.StartTime != sDto.StartTime || currentSession.EndTime != sDto.EndTime;

                foreach (var reg in currentSession.Registrations)
                {
                    var profile = reg.Profile;
                    int age = CalculateAge(profile.BirthDate);

                    if (!string.IsNullOrEmpty(sDto.TargetGender) && profile.Gender != sDto.TargetGender)
                    {
                        errors.Add($"Nem módosíthatod a {workshopTitle} műhely célzott nemét {sDto.TargetGender}-re, mert {profile.Name} résztvevő neme {profile.Gender}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }

                    if (sDto.MinAge.HasValue && age < sDto.MinAge.Value)
                    {
                        errors.Add($"Nem módosíthatod a {workshopTitle} műhely minimum életkorát {sDto.MinAge}-re, mert {profile.Name} résztvevő születési dátuma {profile.BirthDate:yyyy.MM.dd}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }

                    if (sDto.MaxAge.HasValue && age > sDto.MaxAge.Value)
                    {
                        errors.Add($"Nem módosíthatod a {workshopTitle} műhely maximum életkorát {sDto.MaxAge}-re, mert {profile.Name} résztvevő születési dátuma {profile.BirthDate:yyyy.MM.dd}. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                    }

                    if (timeChanging)
                    {
                        var otherRegistrations = await _regRepo.GetAll()
                            .Include(r => r.WorkshopSession)
                                .ThenInclude(s => s.Workshop)
                            .Where(r => r.ProfileId == profile.Id && r.WorkshopSessionId != sDto.Id)
                            .ToListAsync();

                        foreach (var otherReg in otherRegistrations)
                        {
                            var other = otherReg.WorkshopSession;
                            if (sDto.StartTime < other.EndTime && sDto.EndTime > other.StartTime)
                            {
                                errors.Add($"Nem módosíthatod a {workshopTitle} műhely kezdés/befejezés időpontját {sDto.StartTime:yyyy.MM.dd HH:mm}-ra, mert {profile.Name} résztvevőnek jelentkezése van ugyanebben az időpontban egy másik műhely alkalomra. Előbb töröld a jelentkezését, utána már tudod módosítani.");
                                break;
                            }
                        }
                    }
                }
            }

            if (errors.Count > 0)
                throw new BadRequestException(string.Join("\n", errors));
        }

        private static int CalculateAge(DateTime birthDate)
        {
            int age = DateTime.Today.Year - birthDate.Year;
            if (birthDate.Date > DateTime.Today.AddYears(-age)) age--;
            return age;
        }
    }
}