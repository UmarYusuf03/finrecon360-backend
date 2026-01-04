using System.Security.Claims;
using finrecon360_backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace finrecon360_backend.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    [Authorize]
    [HttpGet("summary")]
    public IActionResult Summary()
    {
        var permissions = User.FindAll("permissions").Select(p => p.Value).ToList();
        if (!permissions.Contains("DASHBOARD.VIEW"))
        {
            return Forbid();
        }

        var role = User.FindFirstValue(ClaimTypes.Role) ?? "User";

        var summary = new DashboardSummary
        {
            TotalAccounts = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? 256 : 128,
            PendingReconciliations = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? 9 : 14,
            CompletedToday = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? 48 : 32,
            Alerts = role.Equals("Admin", StringComparison.OrdinalIgnoreCase) ? 1 : 3,
            LastUpdatedUtc = DateTime.UtcNow
        };

        return Ok(summary);
    }
}
