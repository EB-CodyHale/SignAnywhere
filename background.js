function openOverlay(tabId) {
  chrome.tabs.sendMessage(tabId, {
    action: 'OPEN_SIGNATURE_OVERLAY'
  });
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-signature') {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    openOverlay(tab.id);
  }
});

chrome.action.onClicked.addListener((tab) => {
  openOverlay(tab.id);
});