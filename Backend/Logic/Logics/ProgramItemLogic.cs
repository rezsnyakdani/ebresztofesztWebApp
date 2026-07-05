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
    public class ProgramItemLogic
    {
        private readonly IRepository<ProgramItem> _repository;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public ProgramItemLogic(IRepository<ProgramItem> repository, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _repository = repository;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők módosíthatják a programtervet!");
        }

        private void ValidateProgramItemData(string title, DateTime? startTime, DateTime? endTime)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new BadRequestException("A programpont címének megadása kötelező!");

            if (!startTime.HasValue || !endTime.HasValue)
                throw new BadRequestException("A kezdési és befejezési időpontok megadása kötelező!");

            if (startTime.Value >= endTime.Value)
                throw new BadRequestException("A kezdési időpontnak korábban kell lennie, mint a befejezési időpontnak!");
        }

        public async Task<List<ProgramItem>> GetAllAsync()
        {
            return await _repository.GetAll()
                                    .OrderBy(p => p.StartTime)
                                    .ToListAsync();
        }

        public async Task<ProgramItem> GetByIdAsync(string id)
        {
            var item = await _repository.GetOneAsync(id);
            if (item == null) throw new NotFoundException("A programpont nem található.");
            return item;
        }

        public async Task<ProgramItem> CreateAsync(ProgramItemCreateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProgramItemData(dto.Title, dto.StartTime, dto.EndTime);

            var item = _mapper.Map<ProgramItem>(dto);
            item.StartTime = dto.StartTime!.Value;
            item.EndTime = dto.EndTime;

            var created = await _repository.CreateAsync(item);
            await _hubContext.Clients.All.SendAsync("ProgramItemsChanged");
            return created;
        }

        public async Task<ProgramItem> UpdateAsync(string id, ProgramItemUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProgramItemData(dto.Title, dto.StartTime, dto.EndTime);

            var item = await _repository.GetOneAsync(id);
            if (item == null) throw new NotFoundException("A programpont nem található.");

            _mapper.Map(dto, item);
            item.StartTime = dto.StartTime!.Value;
            item.EndTime = dto.EndTime;

            var updated = await _repository.UpdateAsync(item);
            await _hubContext.Clients.All.SendAsync("ProgramItemsChanged");
            return updated;
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var item = await _repository.GetOneAsync(id);
            if (item == null) throw new NotFoundException("A programpont nem található.");

            await _repository.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("ProgramItemsChanged");
        }

        public async Task<List<ProgramItem>> CreateManyAsync(List<ProgramItemCreateDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);

            var itemsToCreate = new List<ProgramItem>();

            foreach (var dto in dtos)
            {
                ValidateProgramItemData(dto.Title, dto.StartTime, dto.EndTime);
                var item = _mapper.Map<ProgramItem>(dto);
                item.StartTime = dto.StartTime!.Value;
                item.EndTime = dto.EndTime;
                itemsToCreate.Add(item);
            }

            var createdItems = await _repository.CreateManyAsync(itemsToCreate);
            await _hubContext.Clients.All.SendAsync("ProgramItemsChanged");
            return (List<ProgramItem>)createdItems;
        }
    }
}
