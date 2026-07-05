using Entities.Dtos;
using Logic.Logics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthLogic _authLogic;

        public AuthController(AuthLogic authLogic)
        {
            _authLogic = authLogic;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var token = await _authLogic.LoginAsync(dto);

            return Ok(new { Token = token });
        }
    }
}