-- Fix Week 13 - Add Patrick's LMT pick
INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'LMT' as symbol,
  458.71 as entryPrice,
  458.71 as currentValue,
  0 as returnPercentage,
  0 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'patrick'
AND w.weekNum = 13
AND NOT EXISTS (
  SELECT 1 FROM Pick p 
  WHERE p.userId = u.id 
  AND p.weekId = w.id
);

-- Fix Week 14 data
DELETE FROM Pick WHERE weekId IN (SELECT id FROM Week WHERE weekNum = 14);

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'WING' as symbol,
  350.32 as entryPrice,
  234.02 as currentValue,
  -33.20 as returnPercentage,
  -116.30 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'patrick'
AND w.weekNum = 14;

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'UAL' as symbol,
  74.30 as entryPrice,
  95.89 as currentValue,
  29.06 as returnPercentage,
  21.59 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'taylor'
AND w.weekNum = 14;

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'WMT' as symbol,
  95.09 as entryPrice,
  94.78 as currentValue,
  -0.33 as returnPercentage,
  -0.31 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'logan'
AND w.weekNum = 14;

-- Fix Week 28 data
DELETE FROM Pick WHERE weekId IN (SELECT id FROM Week WHERE weekNum = 28);

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'NVDA' as symbol,
  145.48 as entryPrice,
  135.13 as currentValue,
  -7.11 as returnPercentage,
  -10.35 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'patrick'
AND w.weekNum = 28;

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'Baba' as symbol,
  113.49 as entryPrice,
  113.84 as currentValue,
  0.31 as returnPercentage,
  0.35 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'taylor'
AND w.weekNum = 28;

INSERT INTO Pick (userId, weekId, symbol, entryPrice, currentValue, returnPercentage, weekReturn)
SELECT 
  u.id as userId,
  w.id as weekId,
  'Ba' as symbol,
  197.68 as entryPrice,
  207.32 as currentValue,
  4.88 as returnPercentage,
  9.64 as weekReturn
FROM User u
CROSS JOIN Week w
WHERE u.username = 'logan'
AND w.weekNum = 28; 