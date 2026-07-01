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
    public class LectureLogic
    {
        private readonly IRepository<Lecture> _repository;
        private readonly IMapper _mapper;
        private readonly IHubContext<AppHub> _hubContext;

        public LectureLogic(IRepository<Lecture> repository, IMapper mapper, IHubContext<AppHub> hubContext)
        {
            _repository = repository;
            _mapper = mapper;
            _hubContext = hubContext;
        }

        private void CheckOrganizerRole(string userRole)
        {
            if (userRole != "Szervező")
                throw new ForbiddenException("Csak szervezők módosíthatják az előadásokat!");
        }

        private void ValidateLectureData(string lecturerName, string description, DateTime? startTime, DateTime? endTime)
        {
            if (string.IsNullOrWhiteSpace(lecturerName)) throw new BadRequestException("Az előadó nevének megadása kötelező!");
            if (string.IsNullOrWhiteSpace(description)) throw new BadRequestException("A leírás megadása kötelező!");
            if (!startTime.HasValue || !endTime.HasValue) throw new BadRequestException("A kezdési és befejezési időpontok megadása kötelező!");
            if (startTime.Value >= endTime.Value) throw new BadRequestException("A kezdési időpontnak korábban kell lennie, mint a befejezési időpontnak!");
            if (startTime.Value.Date != endTime.Value.Date) throw new BadRequestException("Az előadás kezdési és befejezési időpontjának ugyanarra a napra kell esnie!");
        }

        public async Task<List<Lecture>> GetAllAsync()
        {
            return await _repository.GetAll().OrderBy(l => l.StartTime).ToListAsync();
        }

        public async Task<Lecture> GetByIdAsync(string id)
        {
            var lecture = await _repository.GetOneAsync(id);
            if (lecture == null) throw new NotFoundException("Az előadás nem található.");
            return lecture;
        }

        public async Task<Lecture> CreateAsync(LectureCreateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateLectureData(dto.LecturerName, dto.Description, dto.StartTime, dto.EndTime);

            var lecture = _mapper.Map<Lecture>(dto);
            lecture.StartTime = dto.StartTime!.Value;
            lecture.EndTime = dto.EndTime!.Value;

            if (dto.Image != null)
            {
                lecture.ImagePath = await FileHelper.SaveImageAsync(dto.Image, "lectures");
            }

            var result = await _repository.CreateAsync(lecture);
            await _hubContext.Clients.All.SendAsync("LecturesChanged");
            return result;
        }

        public async Task<Lecture> UpdateAsync(string id, LectureUpdateDto dto, string userRole)
        {
            CheckOrganizerRole(userRole);
            ValidateLectureData(dto.LecturerName, dto.Description, dto.StartTime, dto.EndTime);

            var lecture = await _repository.GetOneAsync(id);
            if (lecture == null) throw new NotFoundException("Az előadás nem található.");

            _mapper.Map(dto, lecture);
            lecture.StartTime = dto.StartTime!.Value;
            lecture.EndTime = dto.EndTime!.Value;

            if (dto.Image != null)
            {
                lecture.ImagePath = await FileHelper.SaveImageAsync(dto.Image, "lectures");
            }

            var result = await _repository.UpdateAsync(lecture);
            await _hubContext.Clients.All.SendAsync("LecturesChanged");
            return result;
        }

        public async Task DeleteAsync(string id, string userRole)
        {
            CheckOrganizerRole(userRole);
            var lecture = await _repository.GetOneAsync(id);
            if (lecture == null) throw new NotFoundException("Az előadás nem található.");
            await _repository.DeleteByIdAsync(id);
            await _hubContext.Clients.All.SendAsync("LecturesChanged");
        }

        public async Task<List<Lecture>> CreateManyAsync(List<LectureBulkDto> dtos, string userRole)
        {
            CheckOrganizerRole(userRole);
            var lecturesToCreate = new List<Lecture>();

            foreach (var dto in dtos)
            {
                ValidateLectureData(dto.LecturerName, dto.Description, dto.StartTime, dto.EndTime);
                lecturesToCreate.Add(_mapper.Map<Lecture>(dto));
            }

            var createdLectures = await _repository.CreateManyAsync(lecturesToCreate);
            await _hubContext.Clients.All.SendAsync("LecturesChanged");
            return (List<Lecture>)createdLectures;
        }
    }
}