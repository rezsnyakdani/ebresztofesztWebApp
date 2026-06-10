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
        }
    }
}
