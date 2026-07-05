using Entities.Dtos;
using Entities.Models;
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
    public class ProgramItemController : ControllerBase
    {
        private readonly ProgramItemLogic _logic;

        public ProgramItemController(ProgramItemLogic logic)
        {
            _logic = logic;
        }

        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<ProgramItem>>> GetAll()
        {
            var result = await _logic.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<ProgramItem>> GetById(string id)
        {
            var result = await _logic.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ProgramItem>> Create([FromBody] ProgramItemCreateDto dto)
        {
            var result = await _logic.CreateAsync(dto, GetUserRole());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPost("bulk")]
        public async Task<ActionResult<List<ProgramItem>>> CreateMany([FromBody] List<ProgramItemCreateDto> dtos)
        {
            var result = await _logic.CreateManyAsync(dtos, GetUserRole());
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProgramItem>> Update(string id, [FromBody] ProgramItemUpdateDto dto)
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
    }
}