using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Dtos
{
    public class ProgramItemCreateDto
    {
        public string Title { get; set; } = null!;
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Location { get; set; }
    }

    public class ProgramItemUpdateDto
    {
        public string Title { get; set; } = null!;
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? Location { get; set; }
    }
}
