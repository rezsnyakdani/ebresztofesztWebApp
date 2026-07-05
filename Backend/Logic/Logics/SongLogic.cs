using AutoMapper;
using Data.Repositories;
using Entities.Dtos;
using Entities.Models;
using Logic.Helpers;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Logic.Logics
{
    public class SongLogic
    {
        private readonly IRepository<Song> _repository;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public SongLogic(IRepository<Song> repository, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _repository = repository;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők szerkeszthetik a dalokat!");
        }

        private void ValidateSongData(string title, string content)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new BadRequestException("A dal címének megadása kötelező!");

            if (string.IsNullOrWhiteSpace(content))
                throw new BadRequestException("A dalszöveg megadása kötelező!");
        }

        public async Task<List<Song>> GetAllAsync()
        {
            return await _repository.GetAll()
                                    .OrderBy(s => s.Title)
                                    .ToListAsync();
        }

        public async Task<Song> GetByIdAsync(string id)
        {
            var song = await _repository.GetOneAsync(id);
            if (song == null) throw new NotFoundException("A dal nem található.");
            return song;
        }

        public async Task<Song> CreateAsync(SongCreateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateSongData(dto.Title, dto.Content);

            var song = _mapper.Map<Song>(dto);
            var created = await _repository.CreateAsync(song);
            await _hubContext.Clients.All.SendAsync("SongsChanged");
            return created;
        }

        public async Task<Song> UpdateAsync(string id, SongUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateSongData(dto.Title, dto.Content);

            var song = await _repository.GetOneAsync(id);
            if (song == null) throw new NotFoundException("A dal nem található.");

            _mapper.Map(dto, song);
            var updated = await _repository.UpdateAsync(song);
            await _hubContext.Clients.All.SendAsync("SongsChanged");
            return updated;
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var song = await _repository.GetOneAsync(id);
            if (song == null) throw new NotFoundException("A dal nem található.");

            await _repository.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("SongsChanged");
        }

        public async Task<List<Song>> CreateManyAsync(List<SongCreateDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);

            var songsToCreate = new List<Song>();

            foreach (var dto in dtos)
            {
                ValidateSongData(dto.Title, dto.Content);
                songsToCreate.Add(_mapper.Map<Song>(dto));
            }

            var createdSongs = await _repository.CreateManyAsync(songsToCreate);
            await _hubContext.Clients.All.SendAsync("SongsChanged");
            return (List<Song>)createdSongs;
        }
    }
}
