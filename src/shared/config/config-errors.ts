export class ConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConfigError';
  }
}

export class MissingEnvVarError extends ConfigError {
  constructor(name: string) {
    super(`Required env var ${name} is not set.`);
    this.name = 'MissingEnvVarError';
  }
}

export class InvalidEnvVarError extends ConfigError {
  constructor(name: string, value: string, expected: string) {
    super(`Env var ${name} must be ${expected}; received '${value}'.`);
    this.name = 'InvalidEnvVarError';
  }
}

export class InvalidProfileError extends ConfigError {
  constructor(value: string, expectedProfiles: readonly string[]) {
    super(`APP_ENV must be one of ${expectedProfiles.join(', ')}; received '${value}'.`);
    this.name = 'InvalidProfileError';
  }
}

export class MissingProfileUrlError extends ConfigError {
  constructor(profile: string, envName: string) {
    super(`${envName} is required for profile '${profile}'.`);
    this.name = 'MissingProfileUrlError';
  }
}
