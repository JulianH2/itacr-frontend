import { apiImplementation } from './api-implementation';

class MockApi {}
class HttpApi {}

describe('apiImplementation', () => {
  it('should use the mock when the backend is mocked', () => {
    // Act / Assert
    expect(apiImplementation(true, MockApi, HttpApi)).toBe(MockApi);
  });

  it('should use the HTTP client when the backend is real', () => {
    // Act / Assert
    expect(apiImplementation(false, MockApi, HttpApi)).toBe(HttpApi);
  });
});
