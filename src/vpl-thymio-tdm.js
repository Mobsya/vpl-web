/*
	Copyright 2018-2020 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet

	Licensed under the 3-Clause BSD License;
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	https://opensource.org/licenses/BSD-3-Clause
*/

/** @fileoverview

Implementation of an A3a.vpl.Application method which creates an
A3a.vpl.RunGlue object for the Thymio II robot via the Thymio Device
Manager (Thymio Suite 2.0).

*/

/** Install connection with Thymio via Thymio Device Manager
	@return {A3a.vpl.RunGlue}
*/
A3a.vpl.Application.prototype.installThymioTDM = function () {
	var app = this;
	var tdm = null;
	return new A3a.vpl.RunGlue({
		run: function (language, code) {
			tdm["run"](code);
		},
		init: function (language) {
			// initialize the list of nodes
			try {
				tdm = new window["TDM"](vplGetHashOption("w"),
					{
						"uuid": vplGetHashOption("uuid") || "auto",
						"change": function (connected) {
							app.robots[app.currentRobotIndex].runGlue.state = connected ? {} : null;
							app.vplCanvas.update();
						}
					});
			} catch (e) {
				console.info(e);
				app.vplCanvas.update();
			}
		},
		isConnected: function () {
			return app.robots[app.currentRobotIndex].runGlue.state != null && tdm["isConnected"]();
		},
		isEnabled: function (language) {
			return language === "aseba" && app.robots[app.currentRobotIndex].runGlue.state != null && tdm["canRun"]();
		},
		getName: function () {
			return "Thymio (TDM)";
		},
		preferredLanguage: "aseba",
		languages: ["aseba"],
		state: null
	});
};
