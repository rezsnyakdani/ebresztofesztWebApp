using AutoMapper;
using Data.Repositories;
using Entities.Dtos;
using Entities.Models;
using Logic.Helpers;
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
        private readonly WorkshopSessionLogic _sessionLogic;
        private readonly IMapper _mapper;

        public WorkshopLogic(IRepository<Workshop> workshopRepo, IRepository<WorkshopSession> sessionRepo, WorkshopSessionLogic sessionLogic, IMapper mapper)
        {
            _workshopRepo = workshopRepo;
            _sessionRepo = sessionRepo;
            _sessionLogic = sessionLogic;
            _mapper = mapper;
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

            return await GetByIdAsync(created.Id);
        }

        public async Task<WorkshopGetDto> UpdateAsync(string id, WorkshopUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateWorkshopData(dto.Title, dto.Lecturer, dto.Description);

            var workshop = await _workshopRepo.GetAll()
                .Include(w => w.Sessions)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workshop == null) throw new NotFoundException("A műhely nem található.");

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
            return await GetByIdAsync(id);
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var workshop = await _workshopRepo.GetOneAsync(id);
            if (workshop == null) throw new NotFoundException("A műhely nem található.");

            await _workshopRepo.DeleteByIdAsync(id);
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

            return _mapper.Map<List<WorkshopGetDto>>(fullWorkshops);
        }
    }
}