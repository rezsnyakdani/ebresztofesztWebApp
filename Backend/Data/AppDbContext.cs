using Entities.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Song> Songs => Set<Song>();
        public DbSet<Workshop> Workshops => Set<Workshop>();
        public DbSet<WorkshopSession> WorkshopSessions => Set<WorkshopSession>();
        public DbSet<Profile> Profiles => Set<Profile>();
        public DbSet<WorkshopRegistration> WorkshopRegistrations => Set<WorkshopRegistration>();
        public DbSet<Lecture> Lectures => Set<Lecture>();
        public DbSet<ProgramItem> ProgramItems => Set<ProgramItem>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Song
            modelBuilder.Entity<Song>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired();
                e.Property(x => x.Content).IsRequired();
            });

            // Workshop
            modelBuilder.Entity<Workshop>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired();
                e.Property(x => x.Lecturer).IsRequired();

                e.HasMany(x => x.Sessions)
                 .WithOne(x => x.Workshop)
                 .HasForeignKey(x => x.WorkshopId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // WorkshopSession
            modelBuilder.Entity<WorkshopSession>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Place).IsRequired();
            });

            // Profile
            modelBuilder.Entity<Profile>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).IsRequired();
                e.Property(x => x.Email).IsRequired();
                e.Property(x => x.PasswordHash).IsRequired();
                e.HasIndex(x => x.Email);
            });

            // WorkshopRegistration
            modelBuilder.Entity<WorkshopRegistration>(e =>
            {
                e.HasKey(x => new { x.ProfileId, x.WorkshopSessionId });

                e.HasOne(x => x.Profile)
                 .WithMany(x => x.Registrations)
                 .HasForeignKey(x => x.ProfileId)
                 .OnDelete(DeleteBehavior.Cascade);

                e.HasOne(x => x.WorkshopSession)
                 .WithMany(x => x.Registrations)
                 .HasForeignKey(x => x.WorkshopSessionId)
                 .OnDelete(DeleteBehavior.Cascade);
            });

            // Lecture
            modelBuilder.Entity<Lecture>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.LecturerName).IsRequired();
                e.Property(x => x.Description).IsRequired();
            });

            // ProgramItem
            modelBuilder.Entity<ProgramItem>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Title).IsRequired();
            });
        }
    }
}