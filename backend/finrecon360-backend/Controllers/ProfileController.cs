using System.Security.Claims;
using finrecon360_backend.DTOs;
using finrecon360_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace finrecon360_backend.Controllers;

[ApiController]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IInMemoryUserStore _userStore;
    private readonly IPasswordService _passwordService;

    // Future DB-ready implementation:
    // private readonly IUserRepository _userRepository;

    public ProfileController(IInMemoryUserStore userStore, IPasswordService passwordService)
    {
        _userStore = userStore;
        _passwordService = passwordService;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber
        });
    }

    [Authorize]
    [HttpPut("me")]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        if (!string.IsNullOrWhiteSpace(request.FullName))
        {
            user.FullName = request.FullName.Trim();
        }

        if (request.PhoneNumber is not null)
        {
            if (string.Equals(user.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return Forbid("Admins cannot update phone numbers via this endpoint.");
            }

            user.PhoneNumber = request.PhoneNumber?.Trim();
        }

        await _userStore.UpdateAsync(user);

        // Future persistence:
        // await _userRepository.UpdateAsync(user);
        // await _dbContext.SaveChangesAsync();

        return Ok(new ProfileResponse
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            PhoneNumber = user.PhoneNumber
        });
    }

    [Authorize]
    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        if (!string.Equals(user.Role, "User", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Only non-admin users may change their password here.");
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(new { message = "Current password is required." });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "New password is required." });
        }

        var valid = _passwordService.VerifyPassword(request.CurrentPassword, user.PasswordHash);
        if (!valid)
        {
            return BadRequest(new { message = "Current password is incorrect." });
        }

        user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        await _userStore.UpdateAsync(user);

        // Future persistence example:
        // user.PasswordHash = _passwordService.HashPassword(request.NewPassword);
        // await _userRepository.UpdateAsync(user);

        return Ok(new { message = "Password updated successfully." });
    }

    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        if (!string.Equals(user.Role, "User", StringComparison.OrdinalIgnoreCase))
        {
            return Forbid("Only non-admin users may delete their account.");
        }

        var deleted = await _userStore.SoftDeleteAsync(user.Id);

        // Future persistence:
        // await _userRepository.SoftDeleteAsync(user.Id);

        if (!deleted)
        {
            return NotFound();
        }

        return Ok(new { message = "Account deleted." });
    }

    private async Task<Models.User?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return null;
        }

        var user = await _userStore.GetByIdAsync(userId);
        if (user is not null && user.IsDeleted)
        {
            return null;
        }

        return user;
    }
}
