using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Models
{
    public class Lecture
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string LecturerName { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? ImagePath { get; set; }
    }
}
