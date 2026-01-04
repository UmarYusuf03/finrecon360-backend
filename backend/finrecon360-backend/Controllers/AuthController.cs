using finrecon360_backend.DTOs;
using finrecon360_backend.Options;
using finrecon360_backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace finrecon360_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IInMemoryUserStore _userStore;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordService _passwordService;
    private readonly JwtSettings _jwtSettings;

    // Future DB-ready implementation:
    // private readonly IUserRepository _userRepository;
    // public AuthController(IUserRepository userRepository, ...) { ... }

    public AuthController(
        IInMemoryUserStore userStore,
        IJwtTokenService jwtTokenService,
        IPasswordService passwordService,
        IOptions<JwtSettings> jwtOptions)
    {
        _userStore = userStore;
        _jwtTokenService = jwtTokenService;
        _passwordService = passwordService;
        _jwtSettings = jwtOptions.Value;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userStore.GetByEmailAsync(request.Email);

        // Future EF Core swap:
        // var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user is null || user.IsDeleted || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _jwtTokenService.GenerateToken(user);

        var response = new LoginResponse
        {
            AccessToken = token,
            ExpiresIn = (_jwtSettings.ExpiresMinutes <= 0 ? 60 : _jwtSettings.ExpiresMinutes) * 60,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role,
                PhoneNumber = user.PhoneNumber,
                Permissions = user.Permissions
            }
        };

        return Ok(response);
    }
}
