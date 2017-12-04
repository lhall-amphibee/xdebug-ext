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
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires=" + date.toGMTString();
	} else {
		var expires = "";
	}

	if (typeof document.cookie != 'undefined') {
        browser.runtime.sendMessage("Cookie " + name + " created with value " + value);
		document.cookie = name + "=" + value + expires + "; path=/";
	}
}

function readCookie(name) {
	var nameEQ = name + "=";

	if (typeof document.cookie == 'undefined') {
		//console.log('this doc has no cookies');
		return null;
	}

	var ca = document.cookie.split(';');
	for (var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ')
			c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length,c.length);
	}

	return null;
}

function eraseCookie(name) {
	createCookie(name, "", -1);
}

function isSet(name) {
	return readCookie(name) !== null;
}

browser.runtime.sendMessage(options);
browser.runtime.sendMessage({currentState: currentState, userTriggered: userTriggered});
if (userTriggered === false) {
	// tab changed or page loaded

	var result = {};
	for (var cookieName in options.checkCookies)
	{
        browser.runtime.sendMessage("Checking cookie " + cookieName);
		result[cookieName] = isSet(cookieName);

		// if user changes values, we must immediately update cookies after any tab changing or page loading
		if (isSet(cookieName))
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
		}
	}

	browser.runtime.sendMessage({"state": result[cookieName]});
}
else
{
	// widget button pressed
	var cookieName = options.cookieName;
	var cookieValue = options.checkCookies[cookieName];
    browser.runtime.sendMessage({"debug": 'Button pressed'});

	if (!isSet(cookieName))
	{
        browser.runtime.sendMessage({"debug": 'Needs to be set'});
		// sometimes URL is null e.g. when we're on about:addons under linux (is it true?)
		if (typeof document.URL == 'string' && document.URL.substring(0, 4) == 'http')
		{
			createCookie(cookieName, cookieValue, 1);

			// Cookies can be disabled
			var state = isSet(cookieName);
			if (!state) {
//				console.log('Couldnt set cookie! url: '+document.URL);
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
	}
}

