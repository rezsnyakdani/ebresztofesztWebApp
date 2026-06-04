using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Helpers;

namespace Entities.Models
{
    public class InfoBlock : IIdEntity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Title { get; set; } = null!;

        //Teljes HTML kód, az alcímekkel
        public string Content { get; set; } = null!;

        public int OrderIndex { get; set; }
    }
}
