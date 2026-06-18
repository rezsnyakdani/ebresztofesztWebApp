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
        }
    }
}
