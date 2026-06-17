using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Entities.Helpers;

namespace Data.Repositories
{
    public interface IRepository<T> where T : class, IIdEntity
    {
        Task<T> CreateAsync(T entity, bool saveChanges = true);
        Task DeleteByIdAsync(string id, bool saveChanges = true);
        Task<T?> GetOneAsync(string id);
        IQueryable<T> GetAll();
        Task<T> UpdateAsync(T entity, bool saveChanges = true);
        Task SaveChangesAsync();
        Task<IEnumerable<T>> CreateManyAsync(IEnumerable<T> entities, bool saveChanges = true);
    }
}
