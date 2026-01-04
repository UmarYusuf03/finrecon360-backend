using finrecon360_backend.Models;

namespace finrecon360_backend.Services;

public interface IInMemoryUserStore
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task UpdateAsync(User user);
    Task<bool> SoftDeleteAsync(string userId);
    Task<IReadOnlyCollection<User>> GetAllAsync();
}

/// <summary>
/// Simple in-memory user store so profile changes persist while the API is running.
/// </summary>
public class InMemoryUserStore : IInMemoryUserStore
{
    private static readonly Dictionary<string, List<string>> RolePermissions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Admin"] = new List<string>
        {
            "DASHBOARD.VIEW",
            "ADMIN.USERS.MANAGE",
            "ADMIN.SETTINGS.MANAGE",
            "PROFILE.MANAGE"
        },
        ["User"] = new List<string>
        {
            "DASHBOARD.VIEW",
            "PROFILE.MANAGE",
            "ACCOUNT.PASSWORD.CHANGE",
            "ACCOUNT.DELETE",
            "PHONE.UPDATE"
        }
    };

    private readonly Dictionary<string, User> _usersByEmail = new(StringComparer.OrdinalIgnoreCase);
    private readonly Dictionary<string, User> _usersById = new();
    private readonly IPasswordService _passwordService;
    private readonly object _lock = new();

    public InMemoryUserStore(IPasswordService passwordService)
    {
        _passwordService = passwordService;
        Seed();
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        lock (_lock)
        {
            _usersByEmail.TryGetValue(email, out var user);
            return Task.FromResult(user);
        }
    }

    public Task<User?> GetByIdAsync(string id)
    {
        lock (_lock)
        {
            _usersById.TryGetValue(id, out var user);
            return Task.FromResult(user);
        }
    }

    public Task<IReadOnlyCollection<User>> GetAllAsync()
    {
        lock (_lock)
        {
            return Task.FromResult<IReadOnlyCollection<User>>(_usersById.Values.ToList());
        }
    }

    public Task UpdateAsync(User user)
    {
        lock (_lock)
        {
            user.UpdatedAt = DateTime.UtcNow;
            EnsurePermissionSet(user);
            _usersByEmail[user.Email] = user;
            _usersById[user.Id] = user;
        }

        return Task.CompletedTask;
    }

    public Task<bool> SoftDeleteAsync(string userId)
    {
        lock (_lock)
        {
            if (!_usersById.TryGetValue(userId, out var user))
            {
                return Task.FromResult(false);
            }

            user.IsDeleted = true;
            user.UpdatedAt = DateTime.UtcNow;
            return Task.FromResult(true);
        }
    }

    private void Seed()
    {
        var now = DateTime.UtcNow;
        var admin = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "admin@test.com",
            FullName = "System Admin",
            Role = "Admin",
            PasswordHash = _passwordService.HashPassword("Admin@123"),
            CreatedAt = now,
            UpdatedAt = now,
            Permissions = GetDefaultPermissions("Admin")
        };

        var user = new User
        {
            Id = Guid.NewGuid().ToString(),
            Email = "user@test.com",
            FullName = "Finance User",
            Role = "User",
            PasswordHash = _passwordService.HashPassword("User@123"),
            CreatedAt = now,
            UpdatedAt = now,
            Permissions = GetDefaultPermissions("User")
        };

        _usersByEmail[admin.Email] = admin;
        _usersByEmail[user.Email] = user;
        _usersById[admin.Id] = admin;
        _usersById[user.Id] = user;
    }

    private static List<string> GetDefaultPermissions(string role)
    {
        if (RolePermissions.TryGetValue(role, out var permissions))
        {
            return permissions.ToList();
        }

        return new List<string>();
    }

    private static void EnsurePermissionSet(User user)
    {
        if (user.Permissions.Count == 0)
        {
            user.Permissions = GetDefaultPermissions(user.Role);
        }
    }
}
