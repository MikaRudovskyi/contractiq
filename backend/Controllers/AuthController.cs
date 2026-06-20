using ContractIQ.Api.Data;
using ContractIQ.Api.DTOs;
using ContractIQ.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ContractIQ.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ContractIqDbContext _db;
    private readonly ITokenService _tokenService;

    public AuthController(ContractIqDbContext db, ITokenService tokenService)
    {
        _db = db;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Невірний email або пароль" });

        var token = _tokenService.GenerateToken(user);

        return Ok(new AuthResponse(
            token,
            new UserDto(user.Id, user.Name, user.Email, user.Role.ToString())
        ));
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
                    ?? User.FindFirst("email")?.Value;

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null) return NotFound();

        return Ok(new UserDto(user.Id, user.Name, user.Email, user.Role.ToString()));
    }
}
