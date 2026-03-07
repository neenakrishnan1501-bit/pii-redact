import { Redactor, DefaultMatchers, ReplaceStrategy, MaskStrategy, HashStrategy } from 'pii-redact';

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
      matchers: DefaultMatchers,
      defaultStrategy: strategy
    });

    const redacted = redactor.redact(text);
    outputEl.innerText = redacted;
  });
});
