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
    public class WorkshopController : ControllerBase
    {
        private readonly WorkshopLogic _logic;

        public WorkshopController(WorkshopLogic logic)
        {
            _logic = logic;
        }

        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<WorkshopGetDto>>> GetAll()
        {
            return Ok(await _logic.GetAllAsync());
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<WorkshopGetDto>> GetById(string id)
        {
            return Ok(await _logic.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<ActionResult<WorkshopGetDto>> Create([FromBody] WorkshopCreateDto dto)
        {
            var result = await _logic.CreateAsync(dto, GetUserRole());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WorkshopGetDto>> Update(string id, [FromBody] WorkshopUpdateDto dto)
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

        [HttpPost("bulk")]
        public async Task<ActionResult<List<WorkshopGetDto>>> CreateMany([FromBody] List<WorkshopCreateDto> dtos)
        {
            var result = await _logic.CreateManyAsync(dtos, GetUserRole());
            return Ok(result);
        }
    }
}