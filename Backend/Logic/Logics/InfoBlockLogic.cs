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
using Microsoft.EntityFrameworkCore;

namespace Logic.Logics
{
    public class InfoBlockLogic
    {
        private readonly IRepository<InfoBlock> _repository;
        private readonly IMapper _mapper;

        public InfoBlockLogic(IRepository<InfoBlock> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
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

        public async Task<InfoBlock> CreateAsync(InfoBlockDto dto, string userRole)
        {
            CheckRole(userRole);
            ValidateDto(dto);

            var infoBlock = _mapper.Map<InfoBlock>(dto);

            return await _repository.CreateAsync(infoBlock);
        }

        public async Task<InfoBlock> UpdateAsync(string id, InfoBlockDto dto, string userRole)
        {
            CheckRole(userRole);
            ValidateDto(dto);

            var infoBlock = await _repository.GetOneAsync(id);
            if (infoBlock == null)
            {
                throw new NotFoundException("A frissíteni kívánt információs blokk nem található.");
            }

            _mapper.Map(dto, infoBlock);

            return await _repository.UpdateAsync(infoBlock);
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
        }
    }
}
