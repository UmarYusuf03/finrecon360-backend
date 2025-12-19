using finrecon360_backend.Data;
using finrecon360_backend.DTOs;
using finrecon360_backend.Models;
using finrecon360_backend.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace finrecon360_backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordService _passwordService;

    public AuthController(AppDbContext db, IJwtTokenService jwtTokenService, IPasswordService passwordService)
    {
        _db = db;
        _jwtTokenService = jwtTokenService;
        _passwordService = passwordService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            return BadRequest("Email already registered.");

        if (request.Password != request.ConfirmPassword)
            return BadRequest("Passwords do not match.");

        var isFirstUser = !await _db.Users.AnyAsync();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            Country = request.Country,
            Gender = request.Gender,
            PasswordHash = _passwordService.HashPassword(request.Password),
            Role = isFirstUser ? "Admin" : "User",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new { message = "User registered successfully." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !_passwordService.VerifyPassword(request.Password, user.PasswordHash))
            return BadRequest("Invalid email or password.");

        var token = _jwtTokenService.GenerateToken(user);

        return Ok(new LoginResponse
        {
            Email = user.Email,
            FullName = $"{user.FirstName} {user.LastName}".Trim(),
            Role = user.Role,
            Token = token
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null)
            return Ok(new { message = "If that email exists, a code was sent." });

        user.VerificationCode = "123456"; // demo
        user.VerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(10);

        await _db.SaveChangesAsync();

        return Ok(new { message = "Verification code sent (demo: 123456)." });
    }

    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null ||
            user.VerificationCode != request.Code ||
            user.VerificationCodeExpiresAt == null ||
            user.VerificationCodeExpiresAt < DateTime.UtcNow)
        {
            return BadRequest("Invalid or expired verification code.");
        }

        user.VerificationCode = null;
        user.VerificationCodeExpiresAt = null;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Code verified successfully." });
    }
}
