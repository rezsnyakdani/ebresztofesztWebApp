using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Dtos
{
    public class LoginDto
    {
        public string Name { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
