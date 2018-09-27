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
    console.log('updating button');
    if (typeof currentTab.id === 'undefined') {
        console.log('No current tab yet');
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

function createCookie(tab, cookie) {
    console.log('--------- createCookie ----------');
    console.log(cookie);
    var expires = "";
    if (cookie.days && parseInt(cookie.days) > 0) {
        var date = new Date();
        date.setTime(date.getTime()+(cookie.days*24*60*60*1000));
        expires = parseInt((date.getTime() / 1000).toFixed(0));
    }
    getActiveTab().then((tabs) => {
        console.log('Creating cookie ...' + ' ' + expires);
        browser.cookies.set({
            url: tab.url,
            name: cookie.name,
            value: cookie.value,
            expirationDate: expires,
            path: '/'
        });
        updateButton(true);
        currentState = true;
    });
}

function removeCookie(tab, name) {
    console.log('removing cookie ' + name + ' from ' + tab.url);
    // get any previously set cookie for the current tab
    var gettingCookies = browser.cookies.get({
        url: tab.url,
        name: name
    });
    gettingCookies.then((cookie) => {
        console.log("Cookie found, now remove");
        if (cookie) {
            browser.cookies.remove({
                url: tab.url,
                name: name
            });
            updateButton(false);
            currentState = false;
        }
    });
}

function notify(message, sender, sendResponse) {
    console.log(message);
    console.log(sender);
    console.log(sendResponse);

    if (typeof message.state !== 'undefined') {
        updateButton(message.state);
        currentState = message.state;
    }

    if (typeof message.createCookie !== 'undefined') {
        createCookie(message);
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

    if (typeof message.checkCookie !== 'undefined') {
        console.log('checking cookie ');
        console.log(message.checkCookie);

        // get any previously set cookie for the current tab
        let test =  browser.cookies.get({
            url: sender.tab.url,
            name: message.checkCookie.name
        }).then((cookie) => {
            let response = { 'status' : cookie !== null };
            browser.tabs.sendMessage(sender.tab.id, response);
        });
        sendResponse({response: "Response from background script", 'test' :test});
    }

    if (typeof message.toggleCookie !== 'undefined') {
        console.log('toggle cookie ');
        console.log(message.toggleCookie);

        // get any previously set cookie for the current tab
        browser.cookies.get({
            url: sender.tab.url,
            name: message.toggleCookie.name
        }).then((cookie) => {
            if (cookie === null) {
                console.log('Create cookie');
                createCookie(sender.tab, message.toggleCookie);
            } else {
                console.log('Remove cookie');
                removeCookie(sender.tab, message.toggleCookie.name)
            }
        });
    }
    return;
}

// Listen to content scripts messages
browser.runtime.onMessage.addListener(notify);

// update when the extension loads initially
updateActiveTab();
