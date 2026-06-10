using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Dtos
{
    public class InfoBlockDto
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public int OrderIndex { get; set; }
    }
}
