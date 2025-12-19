namespace finrecon360_backend.DTOs;

public record RegisterRequest(
    string Email,
    string FirstName,
    string LastName,
    string Country,
    string Gender,
    string Password,
    string ConfirmPassword);
