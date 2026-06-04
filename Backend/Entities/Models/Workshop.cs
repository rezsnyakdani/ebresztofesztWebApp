using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Helpers;

namespace Entities.Models
{
    public class Workshop : IIdEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = null!;
        public string Lecturer { get; set; } = null!;
        public string Description { get; set; } = null!;
        public ICollection<WorkshopSession> Sessions { get; set; } = new List<WorkshopSession>();
    }
}
