using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using Data.Repositories;
using Entities.Dtos;
using Entities.Models;
using Logic.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Logic.Logics
{
    public class InfoBlockLogic
    {
        private readonly IRepository<InfoBlock> _repository;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public InfoBlockLogic(IRepository<InfoBlock> repository, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _repository = repository;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckRole(string role)
        {
            if (role != "Szervező")
            {
                throw new ForbiddenException("Nincs jogosultságod a művelet elvégzéséhez! Csak szervezők módosíthatják az információkat.");
            }
        }

        private void ValidateDto(InfoBlockDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new BadRequestException("A cím megadása kötelező!");

            if (string.IsNullOrWhiteSpace(dto.Content))
                throw new BadRequestException("A tartalom megadása kötelező!");
        }

        public async Task<List<InfoBlock>> GetAllAsync()
        {
            return await _repository.GetAll().OrderBy(x => x.OrderIndex).ToListAsync();
        }

        public async Task<InfoBlock> GetByIdAsync(string id)
        {
            var infoBlock = await _repository.GetOneAsync(id);
            if (infoBlock == null)
            {
                throw new NotFoundException("A keresett információs blokk nem található az adatbázisban.");
            }
            return infoBlock;
        }

        private async Task CheckUniqueOrderIndex(int orderIndex, string? excludeId = null)
        {
            var existing = await _repository.GetAll()
                .Where(x => x.OrderIndex == orderIndex && x.Id != excludeId)
                .AnyAsync();
            if (existing)
                throw new BadRequestException($"A {orderIndex}. sorrendi szám már foglalt egy másik blokk által. Kérjük válassz másik sorszámot!");
        }

        public async Task<InfoBlock> CreateAsync(InfoBlockDto dto, string userRole)
        {
            CheckRole(userRole);
            ValidateDto(dto);
            await CheckUniqueOrderIndex(dto.OrderIndex);

            var infoBlock = _mapper.Map<InfoBlock>(dto);

            var created = await _repository.CreateAsync(infoBlock);
            await _hubContext.Clients.All.SendAsync("InfoBlocksChanged");
            return created;
        }

        public async Task<InfoBlock> UpdateAsync(string id, InfoBlockDto dto, string userRole)
        {
            CheckRole(userRole);
            ValidateDto(dto);
            await CheckUniqueOrderIndex(dto.OrderIndex, excludeId: id);

            var infoBlock = await _repository.GetOneAsync(id);
            if (infoBlock == null)
            {
                throw new NotFoundException("A frissíteni kívánt információs blokk nem található.");
            }

            _mapper.Map(dto, infoBlock);

            var updated = await _repository.UpdateAsync(infoBlock);
            await _hubContext.Clients.All.SendAsync("InfoBlocksChanged");
            return updated;
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckRole(userRole);

            var infoBlock = await _repository.GetOneAsync(id);
            if (infoBlock == null)
            {
                throw new NotFoundException("A törölni kívánt információs blokk nem található.");
            }

            await _repository.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("InfoBlocksChanged");
        }
    }
}
