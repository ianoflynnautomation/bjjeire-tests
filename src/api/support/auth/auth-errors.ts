export class AuthTokenError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'AuthTokenError';
  }
}

export class MissingAuthStrategyError extends AuthTokenError {
  constructor() {
    super(
      'No auth strategy available. Either:\n' +
        '  - Set AZURE_FEDERATED_TOKEN_FILE (handled automatically in ARC runner pods with workload identity), OR\n' +
        '  - Run `az login` locally, OR\n' +
        '  - Set AZURE_TESTS_CLIENT_ID + AZURE_TESTS_CLIENT_SECRET in your .env.<profile>.local for the client-credentials flow.',
    );
    this.name = 'MissingAuthStrategyError';
  }
}

export class EmptyAccessTokenError extends AuthTokenError {
  constructor(scope: string) {
    super(`MSAL returned no access token for scope ${scope}.`);
    this.name = 'EmptyAccessTokenError';
  }
}

export class MissingTokenExpiryError extends AuthTokenError {
  constructor(scope: string) {
    super(`MSAL returned no expiresOn for scope ${scope}.`);
    this.name = 'MissingTokenExpiryError';
  }
}
