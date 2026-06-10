using System.Security.Claims;
using Entities.Dtos;
using Entities.Models;
using Logic.Logics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InfoBlockController : ControllerBase
    {
        private readonly InfoBlockLogic _logic;

        public InfoBlockController(InfoBlockLogic logic)
        {
            _logic = logic;
        }

        private string GetUserRole()
        {
            return User.FindFirstValue(ClaimTypes.Role) ?? "";
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<InfoBlock>>> GetAll()
        {
            var result = await _logic.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<InfoBlock>> GetById(string id)
        {
            var result = await _logic.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<InfoBlock>> Create([FromBody] InfoBlockDto dto)
        {
            var created = await _logic.CreateAsync(dto, GetUserRole());

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InfoBlock>> Update(string id, [FromBody] InfoBlockDto dto)
        {
            var updated = await _logic.UpdateAsync(id, dto, GetUserRole());
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            await _logic.DeleteAsync(id, GetUserRole());
            return NoContent();
        }
    }
}
