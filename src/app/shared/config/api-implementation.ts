import type { Type } from '@angular/core';

/** Which class answers an API token: the in-memory one while the backend is mocked, the HTTP one otherwise. */
export function apiImplementation<TMock, THttp>(
  useMockApi: boolean,
  mock: Type<TMock>,
  http: Type<THttp>,
): Type<TMock | THttp> {
  return useMockApi ? mock : http;
}
