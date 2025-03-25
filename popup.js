document.addEventListener('DOMContentLoaded', () => {
  const apiProvider = document.getElementById('apiProvider');
  const apiKey = document.getElementById('apiKey');
  const includeFullPage = document.getElementById('includeFullPage');
  const saveButton = document.getElementById('saveButton');
  const status = document.getElementById('status');

  // Load saved settings
  browser.storage.local.get(['apiProvider', 'apiKey', 'includeFullPage'])
    .then(settings => {
      if (settings.apiProvider) {
        apiProvider.value = settings.apiProvider;
      }
      if (settings.apiKey) {
        apiKey.value = settings.apiKey;
      }
      if (settings.includeFullPage !== undefined) {
        includeFullPage.checked = settings.includeFullPage;
      }
    });

  // Save settings
  saveButton.addEventListener('click', () => {
    const settings = {
      apiProvider: apiProvider.value,
      apiKey: apiKey.value,
      includeFullPage: includeFullPage.checked
    };

    browser.storage.local.set(settings)
      .then(() => {
        showStatus('Settings saved successfully!', 'success');
      })
      .catch(error => {
        showStatus('Error saving settings: ' + error.message, 'error');
      });
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 3000);
  }
}); 