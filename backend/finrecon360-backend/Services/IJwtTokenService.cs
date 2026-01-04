using finrecon360_backend.Models;

namespace finrecon360_backend.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
