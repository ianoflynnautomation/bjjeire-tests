const { Verifier } = require('@pact-foundation/pact');

function readList(name) {
  return (process.env[name] || '')
    .split(/\r?\n|,/)
    .map(value => value.trim())
    .filter(Boolean);
}

function readRequired(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required for Pact provider verification.`);
  }
  return value;
}

function buildOptions() {
  const providerBaseUrl = readRequired('API_URL');
  const pactUrls = readList('PACT_URLS');
  const pactBrokerUrl = process.env.PACT_BROKER_URL?.trim();

  if (pactUrls.length === 0 && !pactBrokerUrl) {
    throw new Error('Set PACT_URLS or PACT_BROKER_URL to verify external consumer pacts.');
  }

  const options = {
    provider: process.env.PACT_PROVIDER_NAME || 'BjjEireApi',
    providerBaseUrl,
    stateHandlers: {
      'gyms exist': () => Promise.resolve(),
      'bjj events exist': () => Promise.resolve(),
      'competitions exist': () => Promise.resolve(),
      'stores exist': () => Promise.resolve(),
      'feature flags are configured': () => Promise.resolve(),
    },
    logLevel: process.env.PACT_LOG_LEVEL || 'info',
  };

  if (pactUrls.length > 0) {
    options.pactUrls = pactUrls;
  }

  if (pactBrokerUrl) {
    options.pactBrokerUrl = pactBrokerUrl;
    options.enablePending = true;
    options.includeWipPactsSince = process.env.PACT_INCLUDE_WIP_SINCE || undefined;
    options.consumerVersionSelectors = [{ mainBranch: true }, { deployedOrReleased: true }];
  }

  if (process.env.PACT_BROKER_TOKEN) {
    options.pactBrokerToken = process.env.PACT_BROKER_TOKEN;
  }

  if (process.env.PACT_PUBLISH_VERIFICATION === 'true') {
    options.publishVerificationResult = true;
    options.providerVersion = process.env.GITHUB_SHA || process.env.PACT_PROVIDER_VERSION || 'local';
    options.providerVersionBranch = process.env.GITHUB_REF_NAME || process.env.PACT_PROVIDER_BRANCH || 'local';
  }

  return options;
}

new Verifier(buildOptions())
  .verifyProvider()
  .then(output => {
    console.log(output);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
