const browser = (window.browser || window.chrome);

// Open a new tab when the browser action is clicked.
browser.browserAction.onClicked.addListener(tab => {
	const popupURL = browser.extension.getURL("popup/index.html");
	return browser.tabs.create({
		url: popupURL,
		active: true
	});
});
