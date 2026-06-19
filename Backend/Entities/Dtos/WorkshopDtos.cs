using System;
using System.Collections.Generic;

namespace Entities.Dtos
{
    public class WorkshopSessionCreateDto
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Place { get; set; } = null!;
        public int Capacity { get; set; }
        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string? TargetGender { get; set; }
    }

    public class WorkshopCreateDto
    {
        public string Title { get; set; } = null!;
        public string Lecturer { get; set; } = null!;
        public string Description { get; set; } = null!;
        public List<WorkshopSessionCreateDto> Sessions { get; set; } = new();
    }

    public class WorkshopSessionUpdateDto
    {
        public string? Id { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Place { get; set; } = null!;
        public int Capacity { get; set; }
        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string? TargetGender { get; set; }
    }

    public class WorkshopUpdateDto
    {
        public string Title { get; set; } = null!;
        public string Lecturer { get; set; } = null!;
        public string Description { get; set; } = null!;
        public List<WorkshopSessionUpdateDto> Sessions { get; set; } = new();
    }
    public class WorkshopSessionGetDto
    {
        public string Id { get; set; } = null!;
        public string WorkshopId { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Place { get; set; } = null!;
        public int Capacity { get; set; }
        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string? TargetGender { get; set; }
        public List<RegistrationParticipantDto> Participants { get; set; } = new();
    }

    public class WorkshopGetDto
    {
        public string Id { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Lecturer { get; set; } = null!;
        public string Description { get; set; } = null!;
        public List<WorkshopSessionGetDto> Sessions { get; set; } = new();
    }

    public class RegistrationParticipantDto
    {
        public string RegistrationId { get; set; } = null!;
        public string Name { get; set; } = null!;
    }
}