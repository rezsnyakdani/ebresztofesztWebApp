using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Data.Repositories;
using Entities.Dtos;
using Logic.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Logic.Logics
{
    public class AuthLogic
    {
        private readonly IRepository<Entities.Models.Profile> _repository;
        private readonly JwtService _jwtService;

        public AuthLogic(IRepository<Entities.Models.Profile> repository, JwtService jwtService)
        {
            _repository = repository;
            _jwtService = jwtService;
        }

        public async Task<string> LoginAsync(LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
            {
                throw new BadRequestException("A név és a jelszó megadása kötelező!");
            }

            var user = await _repository.GetAll().FirstOrDefaultAsync(u => u.Name == dto.Name);

            if (user == null || user.PasswordHash != dto.Password)
            {
                throw new UnauthorizedException("Hibás felhasználónév vagy jelszó!");
            }

            return _jwtService.GenerateToken(user);
        }
    }
}
