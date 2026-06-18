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
    public class ProgramItemLogic
    {
        private readonly IRepository<ProgramItem> _repository;
        private readonly IMapper _mapper;

        public ProgramItemLogic(IRepository<ProgramItem> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők módosíthatják a programtervet!");
        }

        private void ValidateProgramItemData(string title, DateTime startTime, DateTime endTime)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new BadRequestException("A programpont címének megadása kötelező!");

            if (startTime == default || endTime == default)
                throw new BadRequestException("A kezdési és befejezési időpontok megadása kötelező!");

            // 2. Logikai dátum ellenőrzések
            if (startTime >= endTime)
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
            return await _repository.CreateAsync(item);
        }

        public async Task<ProgramItem> UpdateAsync(string id, ProgramItemUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateProgramItemData(dto.Title, dto.StartTime, dto.EndTime);

            var item = await _repository.GetOneAsync(id);
            if (item == null) throw new NotFoundException("A programpont nem található.");

            _mapper.Map(dto, item);
            return await _repository.UpdateAsync(item);
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var item = await _repository.GetOneAsync(id);
            if (item == null) throw new NotFoundException("A programpont nem található.");

            await _repository.DeleteByIdAsync(id);
        }

        public async Task<List<ProgramItem>> CreateManyAsync(List<ProgramItemCreateDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);

            var itemsToCreate = new List<ProgramItem>();

            foreach (var dto in dtos)
            {
                ValidateProgramItemData(dto.Title, dto.StartTime, dto.EndTime);
                itemsToCreate.Add(_mapper.Map<ProgramItem>(dto));
            }

            var createdItems = await _repository.CreateManyAsync(itemsToCreate);
            return (List<ProgramItem>)createdItems;
        }
    }
}