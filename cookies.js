/* this is a CONTENT script that interact directly with web content
 * http://www.quirksmode.org/js/cookies.html
 */
if (typeof options === "undefined") {
    function onError(error) {
        console.log(`Can't get var: ${error}`);
    }

    function onGot(item) {
        var idekey = "PHPSTORM";
        if (item.idekey) {
            idekey = item.idekey;
        }
        options.checkCookies.XDEBUG_SESSION = idekey;
    }

    var options = {
        cookieName: "XDEBUG_SESSION",
        checkCookies: {
            XDEBUG_SESSION: '',
            /*XDEBUG_TRACE: '',
            XDEBUG_PROFILE: ''*/
        }
    };

    var getting = browser.storage.local.get("idekey");
    getting.then(onGot, onError);
}


function createCookie(name, value, days) {
    browser.runtime.sendMessage({
		"createCookie": {
    		"name": name,
			"value": value,
			"days": days
		}
    });
}

function eraseCookie(name) {
    browser.runtime.sendMessage({"removeCookie": name});
}

//browser.runtime.sendMessage(options);
//browser.runtime.sendMessage({currentState: currentState, userTriggered: userTriggered});
if (userTriggered === false) {
	// tab changed or page loaded

	var result = {};
	for (var cookieName in options.checkCookies)
	{
        //var currentValue = readCookie(cookieName);
        /*let newValue = options.checkCookies[cookieName];
        let response = browser.runtime.sendMessage({
            "checkCookie": {
                'name' : cookieName,
                'value' : newValue,
                'days' : 7
            }
        });*/

		// if user changes values, we must immediately update cookies after any tab changing or page loading
		/*if (isSet(cookieName))
		{
			var currentValue = readCookie(cookieName);
			var newValue = options.checkCookies[cookieName];
            browser.runtime.sendMessage("Cookie found with value " + currentValue);
			if (newValue != currentValue)
			{
                browser.runtime.sendMessage("Cookie values mismatch, resetting ("+ currentValue + " -> "+ newValue +")");
				eraseCookie(cookieName);
				createCookie(cookieName, newValue, 1);
			}
		}*/
	}
}
else
{
	// widget button pressed
	var cookieName = options.cookieName;
	var cookieValue = options.checkCookies[cookieName];

    let response = browser.runtime.sendMessage({
        "toggleCookie": {
            'name' : cookieName,
            'value' : cookieValue,
            'days' : 7
        }
    });

	/*if (!isSet(cookieName))
	{
        browser.runtime.sendMessage({"debug": 'Needs to be set'});
		// sometimes URL is null e.g. when we're on about:addons under linux (is it true?)
		if (typeof document.URL == 'string' && document.URL.substring(0, 4) == 'http')
		{
			createCookie(cookieName, cookieValue, 7);

			// Cookies can be disabled
			var state = isSet(cookieName);
			if (!state) {
				//console.log('Couldnt set cookie! url: '+document.URL);
				alert('Please enable cookies for this page');
			}

			browser.runtime.sendMessage({"state": state});
		}
		else
		{
			browser.runtime.sendMessage({"state": false});
		}
	}
	else
	{
        browser.runtime.sendMessage({"debug": 'Needs to be removed'});
		eraseCookie(cookieName);
		browser.runtime.sendMessage({"state": false});
	}*/
}

function updateUI(response) {
    console.log('Got status from bg script');
    console.log(response);
}

function handleError() {
    
}

browser.runtime.onMessage.addListener(response => {
  console.log("Message from the background script:");
  console.log(response);
    browser.runtime.sendMessage({"state": response.status});
});
