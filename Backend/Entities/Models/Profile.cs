using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Helpers;

namespace Entities.Models
{
    public class Profile : IIdEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = "Résztvevő"; 
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = null!;

        public ICollection<WorkshopRegistration> Registrations { get; set; } = new List<WorkshopRegistration>();
    }
}
