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

if (userTriggered === false) {
	// tab changed or page loaded

	var result = {};
	for (var cookieName in options.checkCookies)
	{
        let response = browser.runtime.sendMessage({
            "checkCookie": {
                'name' : cookieName
            }
        });

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
}

browser.runtime.onMessage.addListener(response => {
  console.log("Message from the background script:");
  console.log(response);
    browser.runtime.sendMessage({"state": response.status});
});
