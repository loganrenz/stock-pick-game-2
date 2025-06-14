-- Create users
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE username = 'admin') THEN
        INSERT INTO "User" (username, password) VALUES ('admin', '$2b$10$your_hashed_password_here');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE username = 'patrick') THEN
        INSERT INTO "User" (username, password) VALUES ('patrick', NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE username = 'taylor') THEN
        INSERT INTO "User" (username, password) VALUES ('taylor', NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "User" WHERE username = 'logan') THEN
        INSERT INTO "User" (username, password) VALUES ('logan', NULL);
    END IF;
END $$;

-- Create weeks and picks
DO $$ 
DECLARE
    patrick_id INT;
    taylor_id INT;
    logan_id INT;
    week_id INT;
BEGIN
    -- Get user IDs
    SELECT id INTO patrick_id FROM "User" WHERE username = 'patrick';
    SELECT id INTO taylor_id FROM "User" WHERE username = 'taylor';
    SELECT id INTO logan_id FROM "User" WHERE username = 'logan';

    -- Week 1
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (1, '2024-11-18', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'PLUG', 1.89, '2024-11-18', 1.92, 0.03, 1.6, -31.7),
        (taylor_id, week_id, 'BHVN', 44.11, '2024-11-18', 45.59, 1.48, 3.4, -65.0);

    -- Week 2
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (2, '2024-11-25', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'CF', 90.37, '2024-11-25', 89.66, -0.71, -0.8, 10.6),
        (taylor_id, week_id, 'LAW', 5.84, '2024-11-25', 5.92, 0.08, 1.4, -30.8),
        (logan_id, week_id, 'F', 11.30, '2024-11-25', 11.13, -0.17, -1.5, -7.7);

    -- Week 3
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (3, '2024-12-02', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'DJT', 31.87, '2024-12-02', 34.74, 2.88, 9.0, -38.7),
        (taylor_id, week_id, 'BE', 27.55, '2024-12-02', 27.08, -0.47, -1.7, -20.3),
        (logan_id, week_id, 'ROKU', 69.65, '2024-12-02', 84.12, 14.47, 20.8, 6.8);

    -- Week 4
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (4, '2024-12-09', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'JMIA', 4.70, '2024-12-09', 4.35, -0.35, -7.4, -35.1),
        (taylor_id, week_id, 'RBLX', 59.22, '2024-12-09', 59.60, 0.38, 0.6, 64.1),
        (logan_id, week_id, 'CE', 72.25, '2024-12-09', 68.58, -3.67, -5.1, -24.4);

    -- Week 5
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (5, '2024-12-16', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'PLUG', 2.43, '2024-12-16', 2.56, 0.13, 5.3, -46.9),
        (taylor_id, week_id, 'ELF', 138.91, '2024-12-16', 128.66, -10.25, -7.4, -9.8),
        (logan_id, week_id, 'DRI', 166.51, '2024-12-16', 187.59, 21.08, 12.7, 30.6);

    -- Week 6
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (6, '2024-12-23', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'NVDA', 136.28, '2024-12-23', 137.01, 0.73, 0.5, 4.2),
        (taylor_id, week_id, 'BA', 178.12, '2024-12-23', 180.72, 2.60, 1.5, 12.5),
        (logan_id, week_id, 'NET', 112.16, '2024-12-23', 110.61, -1.55, -1.4, 53.3);

    -- Week 7
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (7, '2024-12-30', patrick_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'SPXL', 170.43, '2024-12-30', 173.37, 2.94, 1.7, -8.1),
        (taylor_id, week_id, 'LAW', 4.97, '2024-12-30', 4.95, -0.02, -0.4, -18.7),
        (logan_id, week_id, 'DD', 76.03, '2024-12-30', 74.75, -1.28, -1.7, -12.0);

    -- Week 8
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (8, '2025-01-06', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'NVDA', 148.59, '2025-01-06', 135.91, -12.68, -8.5, -4.5),
        (taylor_id, week_id, 'TM', 193.00, '2025-01-06', 183.47, -9.53, -4.9, -7.4),
        (logan_id, week_id, 'INTC', 20.83, '2025-01-06', 19.15, -1.68, -8.1, -3.3);

    -- Week 9
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (9, '2025-01-13', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'META', 607.10, '2025-01-13', 612.77, 5.67, 0.9, 12.5),
        (taylor_id, week_id, 'DHI', 136.84, '2025-01-13', 147.65, 10.81, 7.9, -10.1),
        (logan_id, week_id, 'DRI', 179.70, '2025-01-13', 181.75, 2.05, 1.1, 21.0);

    -- Week 10
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (10, '2025-01-21', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'DJT', 37.59, '2025-01-21', 32.71, -4.88, -13.0, -48.1),
        (taylor_id, week_id, 'IGT', 17.48, '2025-01-21', 17.15, -0.33, -1.9, -16.5),
        (logan_id, week_id, 'RTX', 122.73, '2025-01-21', 125.31, 2.58, 2.1, 18.7);

    -- Week 11
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (11, '2025-01-28', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'AAPL', 230.85, '2025-01-28', 236.00, 5.15, 2.2, -14.9),
        (taylor_id, week_id, 'NVDA', 121.81, '2025-01-28', 120.07, -1.74, -1.4, 16.6),
        (logan_id, week_id, 'META', 666.00, '2025-01-28', 689.18, 23.18, 3.5, 2.5);

    -- Week 12
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (12, '2025-02-03', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'VIX', 19.63, '2025-02-03', 16.54, -3.09, -15.7, -15.7),
        (taylor_id, week_id, 'BTC', 42.00, '2025-02-03', 42.42, 0.42, 1.0, 11.0),
        (logan_id, week_id, 'PEP', 149.76, '2025-02-03', 144.58, -5.18, -3.5, -12.6);

    -- Week 15
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (15, '2025-02-24', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'LMT', 442.00, '2025-02-24', 450.37, 8.37, 1.9, 10.1),
        (taylor_id, week_id, 'MSFT', 408.51, '2025-02-24', 396.99, -11.52, -2.8, 16.3),
        (logan_id, week_id, 'WMT', 94.18, '2025-02-24', 98.61, 4.43, 4.7, 0.3);

    -- Week 16
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (16, '2025-03-03', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'EVO', 4.34, '2025-03-03', 3.64, -0.70, -16.1, -1.6),
        (taylor_id, week_id, 'COST', 1051.74, '2025-03-03', 964.31, -87.43, -8.3, -5.9),
        (logan_id, week_id, 'PLUG', 1.61, '2025-03-03', 1.78, 0.17, 10.6, -19.9);

    -- Week 18
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (18, '2025-03-17', patrick_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'LUD', 4.40, '2025-03-17', 4.78, 0.38, 8.6, -5.7),
        (taylor_id, week_id, 'AAPL', 213.31, '2025-03-17', 218.27, 4.96, 2.3, -7.9),
        (logan_id, week_id, 'TSLA', 245.06, '2025-03-17', 248.71, 3.65, 1.5, 32.7);

    -- Week 19
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (19, '2025-03-24', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'TSLA', 258.08, '2025-03-24', 263.55, 5.47, 2.1, 26.1),
        (taylor_id, week_id, 'BHVN', 28.99, '2025-03-24', 27.65, -1.34, -4.6, -46.7),
        (logan_id, week_id, 'T', 26.86, '2025-03-24', 28.18, 1.32, 4.9, 5.0);

    -- Week 20
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (20, '2025-03-31', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'MELI', 1995.99, '2025-03-31', 1841.29, -154.70, -7.8, 18.8),
        (taylor_id, week_id, 'AAL', 10.41, '2025-03-31', 9.46, -0.95, -9.1, -0.4),
        (logan_id, week_id, 'GOOG', 154.81, '2025-03-31', 147.74, -7.07, -4.6, 13.6);

    -- Week 21
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (21, '2025-04-07', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'AMZN', 162.00, '2025-04-07', 184.87, 22.87, 14.1, 30.9),
        (taylor_id, week_id, 'BA', 132.05, '2025-04-07', 156.84, 24.79, 18.8, 51.7),
        (logan_id, week_id, 'AAPL', 177.20, '2025-04-07', 198.15, 20.95, 11.8, 10.9);

    -- Week 24
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (24, '2025-04-28', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'GM', 47.20, '2025-04-28', 45.30, -1.90, -4.0, 3.1),
        (taylor_id, week_id, 'AAPL', 210.00, '2025-04-28', 205.35, -4.65, -2.2, -6.5),
        (logan_id, week_id, 'XOM', 108.75, '2025-04-28', 106.21, -2.54, -2.3, 3.1);

    -- Week 25
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (25, '2025-05-05', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'PLTR', 123.70, '2025-05-05', 117.30, -6.40, -5.2, 11.1),
        (taylor_id, week_id, 'DIS', 89.70, '2025-05-05', 105.94, 16.24, 18.1, 31.5),
        (logan_id, week_id, 'T', 27.56, '2025-05-05', 27.84, 0.28, 1.0, 2.3);

    -- Week 26
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (26, '2025-05-12', taylor_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'WMT', 97.67, '2025-05-12', 98.24, 0.57, 0.6, -3.3),
        (taylor_id, week_id, 'DIS', 109.87, '2025-05-12', 113.42, 3.55, 3.2, 7.3),
        (logan_id, week_id, 'LMT', 473.50, '2025-05-12', 468.32, -5.18, -1.1, 2.7);

    -- Week 27
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (27, '2025-05-19', patrick_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'SSRM', 10.85, '2025-05-19', 11.52, 0.67, 6.2, 17.1),
        (taylor_id, week_id, 'BABA', 120.18, '2025-05-19', 120.73, 0.55, 0.5, -6.1),
        (logan_id, week_id, 'BAC', 44.11, '2025-05-19', 43.20, -0.91, -2.1, 0.0);

    -- Week 29
    INSERT INTO "Week" ("weekNum", "startDate", "winnerId") VALUES (29, '2025-06-02', logan_id) RETURNING id INTO week_id;
    INSERT INTO "Pick" ("userId", "weekId", symbol, "priceAtPick", "createdAt", "currentPrice", "weekReturn", "weekReturnPct", "totalReturn")
    VALUES 
        (patrick_id, week_id, 'CRWD', 471.00, '2025-06-02', 468.41, -2.59, -0.5, 2.0),
        (taylor_id, week_id, 'PLTR', 131.44, '2025-06-02', 127.72, -3.72, -2.8, 4.5),
        (logan_id, week_id, 'NET', 165.00, '2025-06-02', 179.67, 14.67, 8.9, 4.2);

END $$; 