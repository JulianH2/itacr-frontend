/** Build-time configuration shared by every environment file. */
export interface AppEnvironment {
  readonly production: boolean;
  /** Base URL of the ITACR REST API, including the version prefix. */
  readonly apiBaseUrl: string;
  /** Socket.IO server used for real-time Kitchen Display System updates. */
  readonly socketUrl: string;
  /** Public VAPID key used to subscribe to Web Push notifications. */
  readonly vapidPublicKey: string;
}
