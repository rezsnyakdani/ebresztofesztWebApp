using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Dtos
{
    public class WorkshopRegistrationCreateDto
    {
        public string ProfileId { get; set; } = null!;
        public string WorkshopSessionId { get; set; } = null!;
    }

    public class WorkshopRegistrationGetDto
    {
        public string Id { get; set; } = null!;
        public string ProfileId { get; set; } = null!;
        public string ProfileName { get; set; } = null!;

        public string WorkshopSessionId { get; set; } = null!;
        public string WorkshopTitle { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}
