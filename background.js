/*jslint browser: true */ /*global chrome: true */
(function () {
"use strict";

chrome.browserAction.onClicked.addListener(function () {

	// TODO seems like there should be an easier way
	var viewTabUrl = chrome.extension.getURL('options.html');
	chrome.tabs.query({currentWindow: true}, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			if (tab.url.search(viewTabUrl) != -1) {
				chrome.tabs.update(tab.id, {'highlighted': true});
				return; // we're done
			}
		}
		chrome.tabs.create({url: 'options.html'});
	});

});

// initialize the app data
function initData() {

	// using local storage as a quick and dirty replacement for MVC
	// not using chrome.storage 'cause the async nature of it complicates things
	// just remember to use parse methods because all values are strings
	if(!localStorage.version) {
		localStorage.version = '1';
		localStorage.enabled = 'true';
		localStorage.idleTime = '10'; // minutes
		localStorage.transitionTime = '30'; // seconds
		localStorage.skip = 'true';
		localStorage.shuffle = 'true';
		localStorage.keepAwake = 'false';
		localStorage.photoSizing = '0';
		localStorage.photoTransition = '0';
		localStorage.useChromecast = 'true';
		localStorage.useAuthors = 'false';
		localStorage.useGoogle = 'true';
		localStorage.albumSelections = '[]';
		localStorage.isPreview = 'false';
		localStorage.windowID = '-1';
	}
}

// set everything based on the current values in localStorage
function processState(key) {

	if(key) {
		switch(key) {
			case 'enabled':
				if(JSON.parse(localStorage.enabled)) {
					if(JSON.parse(localStorage.keepAwake)) {
						chrome.power.requestKeepAwake('display');
					}
					else {
						chrome.power.releaseKeepAwake();
					}
				}
				else {
					chrome.power.releaseKeepAwake();
				}
				break;
			case 'keepAwake':
				if(JSON.parse(localStorage.keepAwake)) {
					chrome.power.requestKeepAwake('display');
				}
				else {
					chrome.power.releaseKeepAwake();
				}
				break;
			case 'idleTime':
				chrome.idle.setDetectionInterval(parseInt(localStorage.idleTime, 10) * 60);
				break;
			case 'useAuthors':
				localStorage.removeItem('badAuthorImages');
				if(JSON.parse(localStorage.useAuthors)) {
					gPhotos.preloadAuthorImages();
				}
				break;
			case 'useChromecast':
				localStorage.removeItem('badCCImages');
				if(JSON.parse(localStorage.useChromecast)) {
					chromeCast.preloadImages();
				}
				break;
		}
	}
	else {
		if(JSON.parse(localStorage.keepAwake)) {
			chrome.power.requestKeepAwake('display');
		}
		else {
			chrome.power.releaseKeepAwake();
		}

		chrome.idle.setDetectionInterval(parseInt(localStorage.idleTime, 10) * 60);

		if(JSON.parse(localStorage.enabled)) {
			if(JSON.parse(localStorage.keepAwake)) {
				chrome.power.requestKeepAwake('display');
			}
			else {
				chrome.power.releaseKeepAwake();
			}
		}
		else {
			chrome.power.releaseKeepAwake();
		}
	}
}

// create the screen saver window
window.showScreenSaver = function () {
	chrome.windows.create({url: 'screensaver.html',
													left: 0,
													top: 0,
													width: screen.width,
													height: screen.height,
													focused: true,
													type: 'popup'},
													function (win) {
			localStorage.windowID = win.id;
			chrome.windows.update(win.id, {state: 'fullscreen'});
	});
};

// add or remove the screen saver as needed
function onIdleStateChanged(state) {
	var win = parseInt(localStorage.windowID, 10);

	if ((state === 'idle') && (win === -1) && JSON.parse(localStorage.enabled)) {
		showScreenSaver();
	}
	else if((win !== -1) && !JSON.parse(localStorage.isPreview)) {
		chrome.windows.remove(win);
	}
}

// process the state when someone has changed the storage
function onStorageChanged(e) {
	processState(e.key);
}

// called when extension is installed or updated or
// Chrome is updated
function onInstalled() {

	initData();

	processState(null);

	/*
	// preload the chromecast images
	localStorage.removeItem('badCCImages');
	if(JSON.parse(localStorage.useChromecast)) {
		chromeCast.preloadImages();
	}
	*/

	/*
	// preload the author images
	localStorage.removeItem('badAuthorImages');
	if(JSON.parse(localStorage.useAuthors)) {
		gPhotos.preloadAuthorImages();
	}
	*/
}

// handle closing of the screen saver window
chrome.windows.onRemoved.addListener(function (windowId) {
	if (windowId === parseInt(localStorage.windowID,10)) {
		localStorage.windowID = -1;
		localStorage.isPreview = 'false';
	}
});

document.addEventListener('DOMContentLoaded', function() {
	initData();

	processState(null);
});

// listen for changes to the stored data
addEventListener("storage", onStorageChanged, false);

// listen for changes to the idle state of the computer
chrome.idle.onStateChanged.addListener(onIdleStateChanged);

chrome.runtime.onInstalled.addListener(onInstalled);

})();