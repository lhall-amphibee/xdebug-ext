var currentTab;
var currentState;

/*
 * Enable or disable Debugging
 */
function toggleButton(event) {
    function onExecuted(result) {
        browser.tabs.executeScript(
            currentTab.id, {
                file: "cookies.js"
            });
    }

    function onError(error) {
        console.log(`Can't execute script: ${error}, for current tab ID ` + currentTab.id);
    }

    var userTriggered = typeof event === 'object';
    var executing = browser.tabs.executeScript(
        currentTab.id, {
            code: "var currentState = "+ currentState +"; var userTriggered = " + userTriggered + ";"
        });
    executing.then(onExecuted, onError);
}

browser.browserAction.onClicked.addListener(toggleButton);

/*
 * Switches currentTab to reflect the currently active tab
 */
function updateActiveTab(e) {
    function isSupportedProtocol(urlString) {
        var supportedProtocols = ["https:", "http:", "ftp:", "file:"];
        var url = document.createElement('a');
        url.href = urlString;
        return supportedProtocols.indexOf(url.protocol) != -1;
    }

    function updateTab(tabs) {
        if (tabs[0]) {
            currentTab = tabs[0];
            console.log('Current tab is ' + currentTab.id);
            if (isSupportedProtocol(currentTab.url)) {
                toggleButton();
            }
        }
    }

    var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
    gettingActiveTab.then(updateTab);

}

function updateButton(result) {
    if (typeof currentTab.id === 'undefined') {
        console.log('No current tab yet')
        return;
    }

    browser.browserAction.setIcon({
        path: result ? {
            32: "data/icons/debug_32_active.png",
            48: "data/icons/debug_32_active.png"
        } : {
            32: "data/icons/debug_48_inactive.png",
            48: "data/icons/debug_48_inactive.png"
        },
        tabId: currentTab.id
    });

    browser.browserAction.setTitle({
        title: result ? 'Disable Debugging' : 'Enable Debugging',
        tabId: currentTab.id
    });
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// Listen to button clicks
//browser.browserAction.onClicked.addListener(updateActiveTab);

function getActiveTab() {
    return browser.tabs.query({active: true, currentWindow: true});
}

function notify(message) {
    if (typeof message.state !== 'undefined') {
        updateButton(message.state);
        currentState = message.state;
    }

    if (typeof message.createCookie !== 'undefined') {
        console.log('--------- createCookie ----------');
        console.log(message.createCookie);
        var expires = "";
        if (message.createCookie.days && parseInt(message.createCookie.days) > 0) {
            var date = new Date();
            date.setTime(date.getTime()+(message.createCookie.days*24*60*60*1000));
            expires = date.toGMTString();
        }
        getActiveTab().then((tabs) => {
            browser.cookies.set({
                url: tabs[0].url,
                name: message.createCookie.name,
                value: message.createCookie.value,
                expirationDate: expires,
                path: '/'
            })
        });
    }

    if (typeof message.removeCookie !== 'undefined') {
        getActiveTab().then((tabs) => {
            // get any previously set cookie for the current tab
            var gettingCookies = browser.cookies.get({
                url: tabs[0].url,
                name: message.removeCookie
            });
            gettingCookies.then((cookie) => {
                console.log(cookie);
                if (cookie) {
                    browser.cookies.remove({
                        url: tabs[0].url,
                        name: message.removeCookie
                    });
                }
            });
        });
    }
}

// Listen to content scripts messages
browser.runtime.onMessage.addListener(notify);

// update when the extension loads initially
updateActiveTab();
