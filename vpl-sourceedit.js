/*
	Copyright 2018 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet
	For internal use only
*/

/** Source editor for code generated by VPL
	@constructor
	@param {boolean} noVPL true if only text editor without VPL
	@param {string=} language
	@param {?A3a.vpl.UIConfig=} uiConfig
	@param {?A3a.vpl.RunGlue=} runGlue
*/
A3a.vpl.VPLSourceEditor = function (noVPL, language, uiConfig, runGlue) {
	this.noVPL = noVPL;
	this.language = language || A3a.vpl.defaultLanguage;
	this.runGlue = runGlue || null;
	this.code0 = "";	// from VPL, to restore when VPL lock is set
	this.isLockedWithVPL = true;
	/** @type {?function():{language:string,code:string}} */
	this.changeLanguage = null;
	/** @type {?function(string,string):?string} */
	this.disass = null;
	/** @type {?string} */
	this.srcForAsm = null;	// null if source code is displayed, src if asm
	this.teacherRole = false;
	this.uiConfig = uiConfig || new A3a.vpl.UIConfig();
	this.textEditor = new A3a.vpl.TextEditor("editor", "editor-lines");
	this.textEditor.setReadOnly(this.isLockedWithVPL);
	this.textEditor.onBreakpointChanged = function (bp) {
		window["vplBreakpointsFunction"] && window["vplBreakpointsFunction"](bp);
	};

	var canvasElement = document.getElementById("editorTBCanvas");
	this.tbCanvas = new A3a.vpl.Canvas(canvasElement);

	var self = this;

	// editor control update
	document.getElementById("editor").addEventListener("input",
		function () {
			self.toolbarRender();
		},
		false);
	// editor tab key
	document.getElementById("editor").addEventListener("keydown", function (e) {
		if (e.keyCode === 9) {
			// prevent loss of focus in textarea
			e.preventDefault();
			e.cancelBubbles = true;
			var textarea = document.getElementById("editor");
			var text = textarea.value;
			var start = this.selectionStart, end = this.selectionEnd;
			text = text.slice(0, start) + "\t" + text.slice(end);
			self.textEditor.setContent(text);
			this.selectionStart = this.selectionEnd = start + 1;
			return false;
		}
		// normal behavior
		return true;
	}, false);
};

/** Reset UI
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.resetUI = function () {
	this.uiConfig.reset();
};

/** Change role
	@param {boolean} b
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.setTeacherRole = function (b) {
	this.teacherRole = b;
};

/** Set the code generated from VPL
	@param {?string} code source code, or null to reset it
	@param {boolean=} isAsm true if code is assembly, false if source code
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.setCode = function (code, isAsm) {
	if (code === null) {
		this.textEditor.setContent(this.code0);
	} else {
		this.code0 = code;
		this.textEditor.setContent(code);
	}
	if (!isAsm) {
		this.srcForAsm = null;
	}
};

/** Get the current code
	@return {string}
*/
A3a.vpl.VPLSourceEditor.prototype.getCode = function () {
	return document.getElementById("editor").value.trim();
};

/** Check if source code matches vpl
	@return {boolean}
*/
A3a.vpl.VPLSourceEditor.prototype.doesMatchVPL = function () {
	return this.getCode() === this.code0.trim();
};

/** Select a text range
	@param {number} begin
	@param {number} end
*/
A3a.vpl.VPLSourceEditor.prototype.selectRange = function (begin, end) {
	this.textEditor.selectRange(begin, end);
};

/** Calculate the toolbar height
	@return {number}
*/
A3a.vpl.VPLSourceEditor.prototype.srcToolbarHeight = function () {
	var dims = this.tbCanvas.dims;
	return dims.controlSize + 2 * dims.interBlockSpace;
};

/** Render toolbar for source code editor
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.toolbarRender = function () {
	// start with an empty canvas
	this.tbCanvas.clearItems();

	// top controls
	var canvasSize = this.tbCanvas.getSize();

	// top controls
	var controlBar = new A3a.vpl.ControlBar(this.tbCanvas);

	var self = this;

	controlBar.addButton(this.uiConfig, "src:new");
	controlBar.addButton(this.uiConfig, "src:save");
	controlBar.addButton(this.uiConfig, "src:vpl");
	controlBar.addButton(this.uiConfig, "src:locked");
	controlBar.addSpace();
	controlBar.addButton(this.uiConfig, "src:language");
	controlBar.addButton(this.uiConfig, "src:disass");
	controlBar.addStretch();
	controlBar.addButton(this.uiConfig, "src:run");
	controlBar.addButton(this.uiConfig, "src:stop");
	controlBar.addSpace();
	controlBar.addButton(this.uiConfig, "src:sim");
	controlBar.addStretch();
	controlBar.addButton(this.uiConfig, "src:teacher-reset");
	controlBar.addButton(this.uiConfig, "src:teacher");

	controlBar.calcLayout(this.tbCanvas.dims.margin, canvasSize.width - this.tbCanvas.dims.margin,
		this.tbCanvas.dims.controlSize,
		this.tbCanvas.dims.interBlockSpace, 2 * this.tbCanvas.dims.interBlockSpace);
	controlBar.addToCanvas();
	this.tbCanvas.redraw();
};

/** Change the lock status
	@param {boolean} b
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.lockWithVPL = function (b) {
	this.isLockedWithVPL = b;
	if (b) {
		this.textEditor.setContent(this.code0);
	}
	this.textEditor.setReadOnly(b);
	this.toolbarRender();
};

/** Resize the source code editor
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.resize = function () {
	var width = window.innerWidth;
	var height = window.innerHeight;
	if (window["vplDisableResize"]) {
		var bnd = this.tbCanvas.canvas.getBoundingClientRect();
		width = bnd.width;
		height = bnd.height;
	}

	this.tbCanvas.dims = this.tbCanvas.dims;
	this.tbCanvas.resize(width, this.srcToolbarHeight());
	this.tbCanvas.canvas.style.height = this.tbCanvas.height + "px";
	this.toolbarRender();
	var editor = document.getElementById("editor");
	editor.parentElement.style.height = (window.innerHeight - this.tbCanvas.canvas.getBoundingClientRect().height) + "px";
};

/** Set the focus to the editor
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.focus = function () {
	document.getElementById("editor").focus();
	this.tbCanvas.redraw();	// update toolbar state
};
