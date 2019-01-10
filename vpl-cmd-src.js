/*
	Copyright 2018 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet
	For internal use only
*/

/** Install commands for source code editor
	@param {A3a.vpl.Commands} commands
	@param {A3a.vpl.RunGlue} runglue
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.addSrcCommands = function (commands, runglue) {
	commands.add("src:new", {
		action: function (srcEditor, modifier) {
			srcEditor.textEditor.setContent("");
			srcEditor.tbCanvas.redraw();
		},
		isEnabled: function (srcEditor) {
			return !srcEditor.isLockedWithVPL;
		},
		object: this
	});
	commands.add("src:save", {
		action: function (srcEditor, modifier) {
			// var src = srcEditor.getCode();
			// var aesl = A3a.vpl.Program.toAESLFile(src);
			// A3a.vpl.Program.downloadText(aesl, "code.aesl");
			var json = window["vplProgram"].exportToJSON();
			A3a.vpl.Program.downloadText(json, "vpl.json", "application/json");
		},
		isEnabled: function (srcEditor) {
			return srcEditor.getCode().length > 0;
		},
		object: this
	});
	commands.add("src:vpl", {
		action: function (srcEditor, modifier) {
			window["vplProgram"].setView("vpl");
		},
		isEnabled: function (srcEditor) {
			return srcEditor.doesMatchVPL();
		},
		object: this,
		isAvailable: function (srcEditor) {
			return !srcEditor.noVPL;
		}
	});
	commands.add("src:locked", {
		action: function (srcEditor, modifier) {
			srcEditor.lockWithVPL(!srcEditor.isLockedWithVPL);
			srcEditor.tbCanvas.redraw();
		},
		isEnabled: function (srcEditor) {
			return srcEditor.srcForAsm === null;
		},
		isSelected: function (srcEditor) {
			return srcEditor.isLockedWithVPL;
		},
		object: this,
		isAvailable: function (srcEditor) {
			return !srcEditor.noVPL;
		}
	});
	commands.add("src:language", {
		action: function (srcEditor, modifier) {
			var r = srcEditor.changeLanguage();
			srcEditor.language = r.language;
			if (srcEditor.isLockedWithVPL) {
				srcEditor.setCode(r.code);
			}
		},
		isEnabled: function (srcEditor) {
			return srcEditor.srcForAsm === null;
		},
		object: this,
		isAvailable: function (srcEditor) {
			return srcEditor.changeLanguage != null;
		}
	});
	commands.add("src:disass", {
		action: function (srcEditor, modifier) {
			if (srcEditor.srcForAsm !== null) {
				srcEditor.setCode(/** @type {string} */(srcEditor.srcForAsm));
				srcEditor.textEditor.setReadOnly(srcEditor.isLockedWithVPL);
			} else {
				var src = srcEditor.getCode();
				var dis = srcEditor.disass(srcEditor.language, src);
				if (dis !== null) {
					srcEditor.setCode(/** @type {string} */(dis), true);
					srcEditor.textEditor.setReadOnly(true);
					srcEditor.srcForAsm = src;
				}
			}
			srcEditor.toolbarRender();
		},
		isEnabled: function (srcEditor) {
			return srcEditor.disass != null && srcEditor.disass(srcEditor.language, "") !== null;
		},
		isSelected: function (srcEditor) {
			return srcEditor.srcForAsm !== null;
		},
		object: this,
		isAvailable: function (srcEditor) {
			return srcEditor.disass !== null;
		}
	});
	commands.add("src:run", {
		action: function (srcEditor, modifier) {
			var code = srcEditor.getCode();
			srcEditor.runGlue.run(code, srcEditor.language);
		},
		object: this,
		isAvailable: function (srcEditor) {
			return srcEditor.runGlue != null;
		}
	});
	commands.add("src:stop", {
		action: function (srcEditor, modifier) {
			srcEditor.runGlue.stop(srcEditor.language);
		},
		object: this,
		isAvailable: function (srcEditor) {
			return srcEditor.runGlue != null;
		}
	});
	commands.add("src:sim", {
		action: function (srcEditor, modifier) {
			window["vplProgram"].setView("sim");
		},
		object: this,
		isAvailable: function (srcEditor) {
			return srcEditor.runGlue != null && window["vplSim"] != null;
		}
	});
	commands.add("src:teacher-reset", {
		action: function (srcEditor, modifier) {
			srcEditor.resetUI();
			srcEditor.toolbarRender();
		},
		object: this,
		keep: true,
		isAvailable: function (srcEditor) {
			return srcEditor.teacherRole && srcEditor.uiConfig.customizationMode;
		}
	});
	commands.add("src:teacher", {
		action: function (srcEditor, modifier) {
			srcEditor.uiConfig.customizationMode = !srcEditor.uiConfig.customizationMode;
			srcEditor.toolbarRender();
		},
		isEnabled: function (srcEditor) {
			return !srcEditor.isLockedWithVPL;
		},
		object: this,
		keep: true,
		isAvailable:  function (srcEditor) {
			return srcEditor.teacherRole;
		}
	});
};
