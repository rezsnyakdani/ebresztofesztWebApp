using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Entities.Models
{
    public class WorkshopRegistration
    {
        public string ProfileId { get; set; } = null!;
        public string WorkshopSessionId { get; set; } = null!;

        public Profile Profile { get; set; } = null!;
        public WorkshopSession WorkshopSession { get; set; } = null!;
    }
}
