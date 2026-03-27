var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "."
});

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

app.Run();
