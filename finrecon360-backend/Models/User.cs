namespace finrecon360_backend.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = default!;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = default!;
        public DateTime CreatedAt { get; set; }
        public string? VerificationCode { get; set; }
        public DateTime? VerificationCodeExpiresAt { get; set; }
    }
}
