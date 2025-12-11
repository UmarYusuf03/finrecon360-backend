using finrecon360_backend.Data;
using finrecon360_backend.Models;
using finrecon360_backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// 1. Bind JWT settings
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt"));

// 2. Add DbContext (in-memory)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("FinReconDb"));

// 3. Register JWT token service
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy
                .WithOrigins("http://localhost:4200") // Angular dev server
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// 4. Authentication & Authorization
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;
var jwtIssuer = jwtSection["Issuer"];
var jwtAudience = jwtSection["Audience"];

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30) // small tolerance
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

app.UseCors("AllowAngular");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// IMPORTANT: auth before endpoints
app.UseAuthentication();
app.UseAuthorization();

#region Auth Endpoints

app.MapPost("/api/auth/register", async (
    [FromBody] RegisterRequest request,
    AppDbContext db) =>
{
    if (await db.Users.AnyAsync(u => u.Email == request.Email))
    {
        return Results.BadRequest("Email already registered.");
    }

    if (request.Password != request.ConfirmPassword)
    {
        return Results.BadRequest("Passwords do not match.");
    }

    var user = new User
    {
        Id = Guid.NewGuid(),
        Email = request.Email,
        FirstName = request.FirstName,
        LastName = request.LastName,
        Country = request.Country,
        Gender = request.Gender,
        PasswordHash = HashPassword(request.Password),
        CreatedAt = DateTime.UtcNow
    };

    db.Users.Add(user);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "User registered successfully." });
});

app.MapPost("/api/auth/login", async (
    [FromBody] LoginRequest request,
    AppDbContext db,
    IJwtTokenService jwtTokenService) =>
{
    var user = await db.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null || !VerifyPassword(request.Password, user.PasswordHash))
    {
        return Results.BadRequest("Invalid email or password.");
    }

    var token = jwtTokenService.GenerateToken(user);

    return Results.Ok(new LoginResponse
    {
        Email = user.Email,
        FullName = $"{user.FirstName} {user.LastName}".Trim(),
        Token = token
    });
});

app.MapPost("/api/auth/forgot-password", async (
    [FromBody] ForgotPasswordRequest request,
    AppDbContext db) =>
{
    var user = await db.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null)
    {
        return Results.Ok(new { message = "If that email exists, a code was sent." });
    }

    user.VerificationCode = "123456"; // demo
    user.VerificationCodeExpiresAt = DateTime.UtcNow.AddMinutes(10);

    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Verification code sent (demo: 123456)." });
});

app.MapPost("/api/auth/verify-code", async (
    [FromBody] VerifyCodeRequest request,
    AppDbContext db) =>
{
    var user = await db.Users
        .FirstOrDefaultAsync(u => u.Email == request.Email);

    if (user is null ||
        user.VerificationCode != request.Code ||
        user.VerificationCodeExpiresAt == null ||
        user.VerificationCodeExpiresAt < DateTime.UtcNow)
    {
        return Results.BadRequest("Invalid or expired verification code.");
    }

    user.VerificationCode = null;
    user.VerificationCodeExpiresAt = null;
    await db.SaveChangesAsync();

    return Results.Ok(new { message = "Code verified successfully." });
});

#endregion

#region Dashboard Endpoint (Protected)

app.MapGet("/api/dashboard/summary", () =>
{
    var summary = new DashboardSummary
    {
        TotalAccounts = 128,
        PendingReconciliations = 14,
        CompletedToday = 32,
        Alerts = 3,
        LastUpdatedUtc = DateTime.UtcNow
    };

    return Results.Ok(summary);
})
.RequireAuthorization();   // 🔒 JWT required

#endregion

app.Run();

#region Password Helpers

static string HashPassword(string password)
{
    using var sha256 = SHA256.Create();
    var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
    return Convert.ToBase64String(bytes);
}

static bool VerifyPassword(string password, string passwordHash)
{
    var hashOfInput = HashPassword(password);
    return hashOfInput == passwordHash;
}

#endregion

// DTOs

public record RegisterRequest(
    string Email,
    string FirstName,
    string LastName,
    string Country,
    string Gender,
    string Password,
    string ConfirmPassword);

public record LoginRequest(string Email, string Password);

public class LoginResponse
{
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string Token { get; set; } = default!;
}

public record ForgotPasswordRequest(string Email);

public record VerifyCodeRequest(string Email, string Code);
