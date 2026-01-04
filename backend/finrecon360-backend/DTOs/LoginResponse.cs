namespace finrecon360_backend.DTOs;

public class LoginResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public int ExpiresIn { get; set; } = 3600;
    public UserDto User { get; set; } = default!;
}

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public IEnumerable<string> Permissions { get; set; } = Enumerable.Empty<string>();
}
