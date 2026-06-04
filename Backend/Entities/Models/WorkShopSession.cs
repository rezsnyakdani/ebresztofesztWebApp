using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Models
{
    public class WorkshopSession
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string WorkshopId { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Place { get; set; } = null!;
        public int Capacity { get; set; }

        public int? MinAge { get; set; }
        public int? MaxAge { get; set; }
        public string? TargetGender { get; set; }

        public Workshop Workshop { get; set; } = null!;
        public ICollection<WorkshopRegistration> Registrations { get; set; } = new List<WorkshopRegistration>();
    }
}
