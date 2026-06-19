using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Dtos;
using Entities.Models;
using AutoMapper;

namespace Logic.Helpers
{
    public class MapperProfile : AutoMapper.Profile
    {
        public MapperProfile()
        {
            CreateMap<InfoBlock, InfoBlockDto>().ReverseMap();

            CreateMap<Entities.Models.Profile, LoginDto>().ReverseMap();

            CreateMap<Entities.Models.Profile, ProfileCreateDto>().ReverseMap();
            CreateMap<Entities.Models.Profile, ProfileUpdateDto>().ReverseMap();
            CreateMap<Entities.Models.Profile, ProfileGetAllDto>().ReverseMap();
            CreateMap<Entities.Models.Profile, ProfileGetByIdDto>().ReverseMap();

            CreateMap<Entities.Models.Lecture, Entities.Dtos.LectureCreateDto>().ReverseMap()
                .ForMember(dest => dest.ImagePath, opt => opt.Ignore());
            CreateMap<Entities.Models.Lecture, Entities.Dtos.LectureUpdateDto>().ReverseMap()
                .ForMember(dest => dest.ImagePath, opt => opt.Ignore());
            CreateMap<Entities.Models.Lecture, Entities.Dtos.LectureBulkDto>().ReverseMap();

            CreateMap<Entities.Models.ProgramItem, Entities.Dtos.ProgramItemCreateDto>().ReverseMap();
            CreateMap<Entities.Models.ProgramItem, Entities.Dtos.ProgramItemUpdateDto>().ReverseMap();

            CreateMap<Entities.Models.Song, Entities.Dtos.SongCreateDto>().ReverseMap();
            CreateMap<Entities.Models.Song, Entities.Dtos.SongUpdateDto>().ReverseMap();

            CreateMap<Entities.Models.Workshop, Entities.Dtos.WorkshopCreateDto>().ReverseMap();
            CreateMap<Entities.Models.Workshop, Entities.Dtos.WorkshopGetDto>().ReverseMap();

            CreateMap<Entities.Dtos.WorkshopUpdateDto, Entities.Models.Workshop>()
                .ForMember(dest => dest.Sessions, opt => opt.Ignore());

            CreateMap<Entities.Models.WorkshopSession, Entities.Dtos.WorkshopSessionCreateDto>().ReverseMap();
            CreateMap<Entities.Models.WorkshopSession, Entities.Dtos.WorkshopSessionUpdateDto>().ReverseMap();

            CreateMap<Entities.Models.WorkshopSession, Entities.Dtos.WorkshopSessionGetDto>()
                .ForMember(dest => dest.RegisteredParticipantNames,
                           opt => opt.MapFrom(src => src.Registrations.Select(r => r.Profile.Name).ToList()));
        }
    }
}
