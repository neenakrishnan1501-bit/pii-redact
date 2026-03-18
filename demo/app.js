import { Redactor, DefaultMatchers, ReplaceStrategy, MaskStrategy, HashStrategy, NlpMatcher } from 'pii-redact';

document.addEventListener('DOMContentLoaded', () => {
  const inputEl = document.getElementById('input');
  const outputEl = document.getElementById('output');
  const btnEl = document.getElementById('redact-btn');

  btnEl.addEventListener('click', () => {
    const text = inputEl.value;
    if (!text) {
      outputEl.innerText = '';
      return;
    }

    // Determine strategy
    const stratRadio = document.querySelector('input[name="strategy"]:checked');
    const stratType = stratRadio ? stratRadio.value : 'replace';

    let strategy;
    if (stratType === 'mask') {
      strategy = new MaskStrategy({ maskChar: '*', unmaskedStart: 2, unmaskedEnd: 2 });
    } else if (stratType === 'hash') {
      strategy = new HashStrategy('sha256');
    } else {
      strategy = new ReplaceStrategy();
    }

    const redactor = new Redactor({
      matchers: [new NlpMatcher(), ...DefaultMatchers],
      defaultStrategy: strategy
    });

    const redacted = redactor.redact(text);
    outputEl.innerText = redacted;
  });

  // Default JSON payload on load for the Demo
  const initialJson = {
    id: "user_491",
    publicProfile: {
      username: "cool_dev",
      bio: "Software engineer living in New York."
    },
    privateData: {
      email: "cool_dev@example.com",
      phone: "555-987-6543"
    }
  };
  document.getElementById('json-input').value = JSON.stringify(initialJson, null, 2);

  const jsonBtnEl = document.getElementById('json-redact-btn');
  const jsonInputEl = document.getElementById('json-input');
  const jsonOutputEl = document.getElementById('json-output');
  const jsonErrorEl = document.getElementById('json-error');

  jsonBtnEl.addEventListener('click', () => {
    jsonErrorEl.innerText = '';
    const text = jsonInputEl.value;
    if (!text) {
      jsonOutputEl.innerText = '';
      return;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      jsonErrorEl.innerText = 'Invalid JSON: ' + e.message;
      return;
    }

    // Parse options
    const keysInput = document.getElementById('json-keys-to-redact').value;
    const ignoreInput = document.getElementById('json-ignore-keys').value;

    const options = {};
    if (keysInput.trim()) {
      options.keysToRedact = keysInput.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (ignoreInput.trim()) {
      options.ignoreKeys = ignoreInput.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Determine strategy (reuse radio buttons from original)
    const stratRadio = document.querySelector('input[name="strategy"]:checked');
    const stratType = stratRadio ? stratRadio.value : 'replace';

    let strategy;
    if (stratType === 'mask') {
      strategy = new MaskStrategy({ maskChar: '*', unmaskedStart: 2, unmaskedEnd: 2 });
    } else if (stratType === 'hash') {
      strategy = new HashStrategy('sha256');
    } else {
      strategy = new ReplaceStrategy();
    }

    const redactor = new Redactor({
      matchers: [new NlpMatcher(), ...DefaultMatchers],
      defaultStrategy: strategy
    });

    const redacted = redactor.redactObject(parsed, options);
    jsonOutputEl.innerText = JSON.stringify(redacted, null, 2);
  });
});
