using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Backend.Data;
using Entities.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Data.Repositories
{
    public class Repository<T> : IRepository<T> where T : class, IIdEntity
    {
        private readonly AppDbContext _context;
        private readonly DbSet<T> _dbSet;

        public Repository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        public async Task<T> CreateAsync(T entity, bool saveChanges = true)
        {
            await _dbSet.AddAsync(entity);
            if (saveChanges) await _context.SaveChangesAsync();
            return entity;
        }

        public async Task DeleteByIdAsync(string id, bool saveChanges = true)
        {
            var entity = await GetOneAsync(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
                if (saveChanges) await _context.SaveChangesAsync();
            }
        }

        public async Task<T?> GetOneAsync(string id)
        {
            return await _dbSet.FindAsync(id);
        }

        public IQueryable<T> GetAll()
        {
            return _dbSet.AsQueryable();
        }

        public async Task<T> UpdateAsync(T entity, bool saveChanges = true)
        {
            _dbSet.Update(entity);
            if (saveChanges) await _context.SaveChangesAsync();
            return entity;
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<T>> CreateManyAsync(IEnumerable<T> entities, bool saveChanges = true)
        {
            await _dbSet.AddRangeAsync(entities);
            if (saveChanges) await _context.SaveChangesAsync();
            return entities;
        }
    }
}
