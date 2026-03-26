using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace Alugio.LeadCapture
{
    public class LeadCapture
    {
        private readonly ILogger _logger;

        public LeadCapture(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<LeadCapture>();
        }

        [Function("LeadCapture")]
        public async Task<HttpResponseData> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "leads")] HttpRequestData req)
        {
            // --- CORS preflight ---
            if (req.Method.Equals("OPTIONS", StringComparison.OrdinalIgnoreCase))
            {
                var preflight = req.CreateResponse(HttpStatusCode.NoContent);
                AddCorsHeaders(preflight);
                return preflight;
            }

            // --- Parse body ---
            LeadRequest? lead;
            try
            {
                var body = await req.ReadAsStringAsync();
                lead = JsonSerializer.Deserialize<LeadRequest>(body ?? "",
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Invalid JSON body: {Message}", ex.Message);
                return BadRequest(req, "Invalid request body.");
            }

            // --- Validate required fields ---
            if (lead == null || string.IsNullOrWhiteSpace(lead.Name) || string.IsNullOrWhiteSpace(lead.Email))
            {
                return BadRequest(req, "Name and Email are required.");
            }

            if (!IsValidEmail(lead.Email))
            {
                return BadRequest(req, "Invalid email address.");
            }

            // --- Insert into SQL ---
            var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("DB_CONNECTION_STRING environment variable is not set.");
                return ServerError(req, "Server configuration error.");
            }

            try
            {
                await using var conn = new SqlConnection(connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    INSERT INTO Leads (Name, Email, Phone, Location, PropertyCount)
                    VALUES (@Name, @Email, @Phone, @Location, @PropertyCount)";

                await using var cmd = new SqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@Name",          lead.Name.Trim());
                cmd.Parameters.AddWithValue("@Email",         lead.Email.Trim().ToLower());
                cmd.Parameters.AddWithValue("@Phone",         (object?)lead.Phone?.Trim() ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@Location",      (object?)lead.Location?.Trim() ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@PropertyCount", (object?)lead.PropertyCount?.Trim() ?? DBNull.Value);

                await cmd.ExecuteNonQueryAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError("SQL error: {Message}", ex.Message);
                return ServerError(req, "Could not save your information. Please try again.");
            }

            // --- Success ---
            var response = req.CreateResponse(HttpStatusCode.OK);
            AddCorsHeaders(response);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(new { message = "Lead saved successfully." }));
            return response;
        }

        // ---- Helpers --------------------------------------------------------

        private static void AddCorsHeaders(HttpResponseData response)
        {
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            response.Headers.Add("Access-Control-Allow-Methods", "POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
        }

        private static HttpResponseData BadRequest(HttpRequestData req, string message)
        {
            var r = req.CreateResponse(HttpStatusCode.BadRequest);
            AddCorsHeaders(r);
            r.Headers.Add("Content-Type", "application/json");
            r.WriteString(JsonSerializer.Serialize(new { error = message }));
            return r;
        }

        private static HttpResponseData ServerError(HttpRequestData req, string message)
        {
            var r = req.CreateResponse(HttpStatusCode.InternalServerError);
            AddCorsHeaders(r);
            r.Headers.Add("Content-Type", "application/json");
            r.WriteString(JsonSerializer.Serialize(new { error = message }));
            return r;
        }

        private static bool IsValidEmail(string email)
        {
            try { var _ = new System.Net.Mail.MailAddress(email); return true; }
            catch { return false; }
        }
    }

    public record LeadRequest(
        string? Name,
        string? Email,
        string? Phone,
        string? Location,
        string? PropertyCount
    );
}
