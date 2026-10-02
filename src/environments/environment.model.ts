/** Build-time configuration shared by every environment file. */
export interface AppEnvironment {
  readonly production: boolean;
  /** Base URL of the ITACR REST API, including the version prefix. */
  readonly apiBaseUrl: string;
  /** SignalR hub used for real-time Kitchen Display System updates (itacr-backend `/hubs/kitchen`). */
  readonly kitchenHubUrl: string;
  /** Public VAPID key used to subscribe to Web Push notifications. */
  readonly vapidPublicKey: string;
  /**
   * When true, an HTTP interceptor answers the API calls that the backend does not implement yet
   * (see `src/app/core/mocks/`). Only for local development; always false in production.
   */
  readonly useMockApi: boolean;
}
