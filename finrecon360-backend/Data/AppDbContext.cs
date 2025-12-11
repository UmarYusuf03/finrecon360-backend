using finrecon360_backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

namespace finrecon360_backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
    }
}
