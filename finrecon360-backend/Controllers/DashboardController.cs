using finrecon360_backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace finrecon360_backend.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    [Authorize(Roles = "Admin")]
    [Authorize]
    [HttpGet("summary")]
    public IActionResult Summary()
    {
        var summary = new DashboardSummary
        {
            TotalAccounts = 128,
            PendingReconciliations = 14,
            CompletedToday = 32,
            Alerts = 3,
            LastUpdatedUtc = DateTime.UtcNow
        };

        return Ok(summary);
    }
}
