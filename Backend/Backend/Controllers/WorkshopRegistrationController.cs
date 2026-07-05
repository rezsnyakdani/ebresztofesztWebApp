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
    public class WorkshopRegistrationController : ControllerBase
    {
        private readonly WorkshopRegistrationLogic _logic;

        public WorkshopRegistrationController(WorkshopRegistrationLogic logic)
        {
            _logic = logic;
        }

        private string GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";
        private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

        [HttpGet]
        public async Task<ActionResult<List<WorkshopRegistrationGetDto>>> GetAll()
        {
            var result = await _logic.GetAllAsync(GetUserRole());
            return Ok(result);
        }

        [HttpGet("profile/{profileId}")]
        public async Task<ActionResult<List<WorkshopRegistrationGetDto>>> GetByProfileId(string profileId)
        {
            var result = await _logic.GetByProfileIdAsync(profileId, GetUserId(), GetUserRole());
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<WorkshopRegistrationGetDto>> Create([FromBody] WorkshopRegistrationCreateDto dto)
        {
            var result = await _logic.CreateAsync(dto, GetUserId(), GetUserRole());
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            await _logic.DeleteAsync(id, GetUserId(), GetUserRole());
            return NoContent();
        }
    }
}