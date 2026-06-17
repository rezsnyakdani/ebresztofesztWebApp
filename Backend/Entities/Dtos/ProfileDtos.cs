using System;

namespace Entities.Dtos
{
    public class ProfileCreateDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = null!;
    }

    public class ProfileUpdateDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime BirthDate { get; set; }
        public string Gender { get; set; } = null!;
    }

    public class ProfileGetAllDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime BirthDate { get; set; }
        public string? Gender { get; set; }
    }

    public class ProfileGetByIdDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public DateTime BirthDate { get; set; }
        public string? Gender { get; set; }
    }

    public class ChangePasswordDto
    {
        public string OldPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
        public string NewPasswordConfirm { get; set; } = null!;
    }
}