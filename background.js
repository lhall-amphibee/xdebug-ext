var currentTab;
var currentBookmark;
console.log('background.js loaded');

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
    /*browser.browserAction.setIcon({
        path: currentBookmark ? {
            19: "icons/star-filled-19.png",
            38: "icons/star-filled-38.png"
        } : {
            19: "icons/star-empty-19.png",
            38: "icons/star-empty-38.png"
        },
        tabId: currentTab.id
    });*/
    browser.browserAction.setTitle({
        // Screen readers can see the title
        title: currentBookmark ? 'Unbookmark it!' : 'Bookmark it!',
        tabId: currentTab.id
    });
}

/*
 * Add or remove the bookmark on the current page.
 */
function toggleBookmark() {
    console.log('toggleBookmark')
    browser.tabs.executeScript(
        currentTab.id,
        {
            'file': 'data/cookies.js'
        }
    )
}

browser.browserAction.onClicked.addListener(toggleBookmark);

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab(tabs) {
    console.log('updateActiveTab');
    function isSupportedProtocol(urlString) {
        var supportedProtocols = ["https:", "http:", "ftp:", "file:"];
        var url = document.createElement('a');
        url.href = urlString;
        return supportedProtocols.indexOf(url.protocol) != -1;
    }

    function updateTab(tabs) {
        if (tabs[0]) {
            currentTab = tabs[0];
            if (isSupportedProtocol(currentTab.url)) {
                //updateIcon();
            } else {
                console.log(`Bookmark it! does not support the '${currentTab.url}' URL.`)
            }
        }
    }

    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then(updateTab);

}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

browser.browserAction.onClicked.addListener(updateActiveTab);

// update when the extension loads initially
updateActiveTab();
