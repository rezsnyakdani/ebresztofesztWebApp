using Entities.Dtos;
using Logic.Logics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProfileController : ControllerBase
    {
        private readonly ProfileLogic _logic;

        public ProfileController(ProfileLogic logic)
        {
            _logic = logic;
        }

        
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";
        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        [HttpGet]
        public async Task<ActionResult<List<ProfileGetAllDto>>> GetAll()
        {
            var result = await _logic.GetAllAsync(GetUserRole());
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProfileGetByIdDto>> GetById(string id)
        {
            var result = await _logic.GetByIdAsync(id, GetUserId(), GetUserRole());
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ProfileGetByIdDto>> Create([FromBody] ProfileCreateDto dto)
        {
            var result = await _logic.CreateAsync(dto, GetUserRole());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProfileGetByIdDto>> Update(string id, [FromBody] ProfileUpdateDto dto)
        {
            var result = await _logic.UpdateAsync(id, dto, GetUserRole());
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            await _logic.DeleteAsync(id, GetUserRole());
            return NoContent();
        }

        [HttpPost("{id}/change-password")]
        public async Task<ActionResult> ChangePassword(string id, [FromBody] ChangePasswordDto dto)
        {
            await _logic.ChangePasswordAsync(id, GetUserId(), dto);
            return Ok("A jelszó sikeresen megváltoztatva!");
        }
    }
}