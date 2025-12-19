namespace finrecon360_backend.DTOs;

public class LoginResponse
{
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Token { get; set; } = default!;
}
