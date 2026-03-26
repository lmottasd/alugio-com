-- Run this once on alugio-alpha-db to create the Leads table
-- Connect to: staysyncserver.database.windows.net / alugio-alpha-db

CREATE TABLE Leads (
    Id            INT IDENTITY(1,1)  PRIMARY KEY,
    Name          NVARCHAR(100)      NOT NULL,
    Email         NVARCHAR(150)      NOT NULL,
    Phone         NVARCHAR(30)       NULL,
    Location      NVARCHAR(200)      NULL,
    PropertyCount NVARCHAR(50)       NULL,
    CreatedAt     DATETIME2          NOT NULL DEFAULT GETUTCDATE()
);

-- Optional: index on Email for fast lookups / deduplication
CREATE INDEX IX_Leads_Email ON Leads (Email);
