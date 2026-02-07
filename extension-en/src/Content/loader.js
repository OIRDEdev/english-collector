(async () => {
  const src = chrome.runtime.getURL('src/Content/index.js');
  await import(src);
})();
