using finrecon360_backend.Models;

namespace finrecon360_backend.Repositories;

/// <summary>
/// Placeholder interface for future persistence once a database is introduced.
/// </summary>
public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task UpdateAsync(User user);
    Task SoftDeleteAsync(string id);
}

/*
// Example EF Core implementation outline (not used today):
public class EfUserRepository : IUserRepository
{
    private readonly AppDbContext _db;
    public EfUserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByEmailAsync(string email) =>
        _db.Users.FirstOrDefaultAsync(u => u.Email == email);

    public Task<User?> GetByIdAsync(string id) =>
        _db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public async Task UpdateAsync(User user)
    {
        _db.Users.Update(user);
        await _db.SaveChangesAsync();
    }

    public async Task SoftDeleteAsync(string id)
    {
        var user = await _db.Users.FirstAsync(u => u.Id == id);
        user.IsDeleted = true;
        await _db.SaveChangesAsync();
    }
}
*/
