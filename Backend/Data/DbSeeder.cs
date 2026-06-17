using System;
using System.Linq;
using Entities.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Data
{
    public static class DbSeeder
    {
        public static void SeedAdminUser(IApplicationBuilder app)
        {
            using var scope = app.ApplicationServices.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (!context.Profiles.Any(p => p.Id == "admin"))
            {
                var admin = new Profile
                {
                    Id = "admin",
                    Name = "admin",
                    Email = "admin@gmail.com",
                    PasswordHash = "admin",
                    Role = "Szervező",
                    BirthDate = new DateTime(2000, 1, 1),
                    Gender = "admin"
                };

                context.Profiles.Add(admin);
                context.SaveChanges();
            }
        }
    }
}