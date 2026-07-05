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
    public class LectureController : ControllerBase
    {
        private readonly LectureLogic _logic;

        public LectureController(LectureLogic logic)
        {
            _logic = logic;
        }

        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<List<Lecture>>> GetAll()
        {
            return Ok(await _logic.GetAllAsync());
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<Lecture>> GetById(string id)
        {
            return Ok(await _logic.GetByIdAsync(id));
        }

        [HttpPost]
        public async Task<ActionResult<Lecture>> Create([FromForm] LectureCreateDto dto)
        {
            var result = await _logic.CreateAsync(dto, GetUserRole());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPost("bulk")]
        public async Task<ActionResult<List<Lecture>>> CreateMany([FromBody] List<LectureBulkDto> dtos)
        {
            var result = await _logic.CreateManyAsync(dtos, GetUserRole());
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Lecture>> Update(string id, [FromForm] LectureUpdateDto dto)
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