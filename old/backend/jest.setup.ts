import nock from 'nock';

beforeAll(() => {
  // Alpha Vantage GLOBAL_QUOTE
  nock('https://www.alphavantage.co')
    .persist()
    .get(/query/)
    .query((q) => q.function === 'GLOBAL_QUOTE')
    .reply(200, {
      'Global Quote': { '05. price': '123.45' }
    });

  // Alpha Vantage TIME_SERIES_DAILY
  nock('https://www.alphavantage.co')
    .persist()
    .get(/query/)
    .query((q) => q.function === 'TIME_SERIES_DAILY')
    .reply(200, {
      'Time Series (Daily)': {
        '2025-02-24': { '1. open': '100', '4. close': '110' },
        '2025-02-25': { '1. open': '110', '4. close': '120' },
        '2025-02-26': { '1. open': '120', '4. close': '130' },
        '2025-02-27': { '1. open': '130', '4. close': '140' },
        '2025-02-28': { '1. open': '140', '4. close': '150' }
      }
    });

  // FMP quote endpoint
  nock('https://financialmodelingprep.com')
    .persist()
    .get(/api\/v3\/quote\//)
    .reply(200, [ { open: 100, price: 110 } ]);
});

afterAll(() => {
  nock.cleanAll();
  nock.restore();
}); 