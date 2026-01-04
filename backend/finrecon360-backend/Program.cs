using finrecon360_backend.Options;
using finrecon360_backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<IInMemoryUserStore, InMemoryUserStore>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"] ?? string.Empty;

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
            ValidIssuer = jwtSection["Issuer"],
            ValidAudience = jwtSection["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

//app.Run();

//#region Password Helpers

//static string HashPassword(string password)
//{
//    using var sha256 = SHA256.Create();
//    var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
//    return Convert.ToBase64String(bytes);
//}

//static bool VerifyPassword(string password, string passwordHash)
//{
//    var hashOfInput = HashPassword(password);
//    return hashOfInput == passwordHash;
//}

//#endregion

//// DTOs

//public record RegisterRequest(
//    string Email,
//    string FirstName,
//    string LastName,
//    string Country,
//    string Gender,
//    string Password,
//    string ConfirmPassword);

//public record LoginRequest(string Email, string Password);

//public class LoginResponse
//{
//    public string Email { get; set; } = default!;
//    public string FullName { get; set; } = default!;
//    public string Token { get; set; } = default!;
//}

//public record ForgotPasswordRequest(string Email);
