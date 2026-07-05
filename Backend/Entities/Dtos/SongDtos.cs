using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Entities.Dtos
{
    public class SongCreateDto
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
    }

    public class SongUpdateDto
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
    }
}
