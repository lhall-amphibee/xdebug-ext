/*
 * main.js represents a LOCAL module (from /lib folder)
 * module types: /docs/sdk/latest/dev-guide/guides/modules.html
 */

// we require high-level modules with "sdk/" (unnecessary), other paths are for local and 3rdp modules
var tabs = require("sdk/tabs");
var prefs = require("sdk/simple-prefs");
var data = require("sdk/self").data;
var { ToggleButton } = require("sdk/ui/button/toggle");

exports.main = function(options, callbacks) {

	function getIcons(role, isActive) {
		// use self.data.url("icon.png") for resource paths
		var ret = {};
		for (var size = 16; size <= 64; size = size * 2)
			ret[size] = "./icons/" + role + "_" + size + "_" + (isActive ? "" : "in") + "active.png";

		return ret;
	}

	var bDebug = ToggleButton({
		id: "debug-button",// just "debug" does not work :(
		label: "Debug",// default label for the hamburger menu
		icon: getIcons("debug", false),
		onClick: function(state) {
			// attaches page-mod (its options below) and returns Worker
			tabs.activeTab.attach({
				contentScriptFile: data.url("cookies.js"),
				contentScriptOptions: {
					cookieName: "XDEBUG_SESSION",
					cookieValue: prefs.prefs.idekey
				},
				onMessage: function(message) {
					updateButton(bDebug, message.state);
					// detach (worker.destroy) worker with its content script, otherwise it will be clipped to another documents user surfes
					this.destroy();
				},
				onDetach: function() {
					// when user closes a tab, but not changes an url of the tab
				}
			});
		}
	});

	var bTrace = ToggleButton({
		id: "trace-button",
		label: "Trace",
		icon: getIcons("trace", false),
		onClick: function(state) {
			tabs.activeTab.attach({
				contentScriptFile: data.url("cookies.js"),
				contentScriptOptions: {
					cookieName: "XDEBUG_TRACE",
					cookieValue: prefs.prefs.traceTriggerValue
				},
				onMessage: function(message) {
					updateButton(bTrace, message.state);
					this.destroy();
				}
			});
		}
	});

	var bProfile = ToggleButton({
		id: "profile-button",
		label: "Profile",
		icon: getIcons("profile", false),
		onClick: function(state) {
			tabs.activeTab.attach({
				contentScriptFile: data.url("cookies.js"),
				contentScriptOptions: {
					cookieName: "XDEBUG_PROFILE",
					cookieValue: prefs.prefs.profileTriggerValue
				},
				onMessage: function(message) {
					updateButton(bProfile, message.state);
					this.destroy();
				}
			});
		}
	});

	function updateButton(button, result) {
		// unfortunally GIF format doesn't support semi-transparent colors, so I can use APNG with alpha-channel

		var role = button.id.split("-").shift();

		if (result)
		{
			button.state("tab", {
				"label": "Disable " + role,
				"icon": getIcons(role, true),
				"checked": true,
				"enabled": true
			});
		}
		else
		{
			// TODO Firefox aurora-menu breaks when labels are long
			var tooltip = "Enable " + role;
			if ("debug-button" == button.id)
				tooltip += " with IDE key '" + prefs.prefs.idekey + "'";
			else if ("trace-button" == button.id)
				tooltip += " with XDEBUG_TRACE cookie value '" + prefs.prefs.traceTriggerValue + "'";
			else if ("profile-button" == button.id)
					tooltip += " with XDEBUG_PROFILE cookie value '" + prefs.prefs.profileTriggerValue + "'";

			button.state("tab", {
				"label": tooltip,
				"icon": getIcons(role, false),
				"checked": false,
				"enabled": true
			});
		}
	}

	analyzeTab = function(tab) {
//		console.log("activated tab with url: "+tab.url);
//		console.log("active tab url: "+tabs.activeTab.url);

		// TODO on first run every tab will be checked somewhy, it's bad when you have plenty of them
		// TODO if you start Frefox with no tabs, the default empty tab is opened, but our buttons are not disabled
		// 2nd condition in case of lots background tabs are loading
		if ( tab.url.substring(0,4) != "http" || tab.url != tabs.activeTab.url )
		{
			bDebug.state("tab", {
				"label": "Debugging is impossible",
				"icon": getIcons("debug", false),
				"checked": false,
				"disabled": true
			});

			bTrace.state("tab", {
				"label": "Tracing is impossible",
				"icon": getIcons("trace", false),
				"checked": false,
				"disabled": true
			});

			bProfile.state("tab", {
				"label": "Profiling is impossible",
				"icon": getIcons("profile", false),
				"checked": false,
				"disabled": true
			});
		}
		else
		{
			tab.attach({
				contentScriptFile: data.url("cookies.js"),
				contentScriptOptions: {
					checkCookies: {
						XDEBUG_SESSION: prefs.prefs.idekey,
						XDEBUG_TRACE: prefs.prefs.traceTriggerValue,
						XDEBUG_PROFILE: prefs.prefs.profileTriggerValue
					}
				},
				onMessage: function(message) {
					updateButton(bDebug, message.result.XDEBUG_SESSION);
					//updateButton(bTrace, message.result.XDEBUG_TRACE);
					//updateButton(bProfile, message.result.XDEBUG_PROFILE);

					this.destroy();
				}
			});
		}
	};

	// tab will be activated even if I open tab in background (with apple key)
	tabs.on('activate', analyzeTab);
	tabs.on('ready', analyzeTab);

	// /doc/modules/sdk/simple-prefs.html
//	function onPrefChange(prefName) {
//		console.log("The " + prefName + " preference changed.");
//	}
//	prefs.on("", onPrefChange);
}

