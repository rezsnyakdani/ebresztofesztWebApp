using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Helpers;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Entities.Models
{
    public class WorkshopRegistration : IIdEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string ProfileId { get; set; } = null!;
        public string WorkshopSessionId { get; set; } = null!;

        public Profile Profile { get; set; } = null!;
        public WorkshopSession WorkshopSession { get; set; } = null!;
    }
}
