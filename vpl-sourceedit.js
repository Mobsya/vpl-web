/*
	Copyright 2018-2019 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet
	For internal use only
*/

/** Source editor for code generated by VPL
	@constructor
	@param {A3a.vpl.Application} app
	@param {boolean} noVPL true if only text editor without VPL
	@param {string=} language
*/
A3a.vpl.VPLSourceEditor = function (app, noVPL, language) {
	this.noVPL = noVPL;
	this.language = language || A3a.vpl.defaultLanguage;
	this.app = app;
	this.code0 = "";	// from VPL, to restore when VPL lock is set
	this.isLockedWithVPL = true;
	/** @type {?function():{language:string,code:string}} */
	this.changeLanguage = null;
	/** @type {?function(string,string):?string} */
	this.disass = null;
	/** @type {?string} */
	this.srcForAsm = null;	// null if source code is displayed, src if asm
	this.teacherRole = false;
	this.uiConfig = app.uiConfig || new A3a.vpl.UIConfig();
	this.textEditor = new A3a.vpl.TextEditor("editor", "editor-lines");
	this.textEditor.setReadOnly(this.isLockedWithVPL);
	this.textEditor.onBreakpointChanged = function (bp) {
		window["vplBreakpointsFunction"] && window["vplBreakpointsFunction"](bp);
	};

	var self = this;

	this.tbCanvas = new A3a.vpl.Canvas(app.canvasEl, null, app.css);

	// editor control update
	document.getElementById("editor").addEventListener("input",
		function () {
			app.renderSourceEditorToolbar();
			if (self.doesMatchVPL() === app.program.noVPL) {
				app.program.noVPL = !app.program.noVPL;
				app.renderProgramToCanvas();
			}
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

/** Set the code
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

/** Change the code and disassemble it if needed
	@param {string} code source code
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.changeCode = function (code) {
	if (this.srcForAsm) {
		var dis = this.disass(this.language, code);
		if (dis !== null) {
			this.setCode(/** @type {string} */(dis), true);
			this.textEditor.setReadOnly(true);
			this.srcForAsm = code;
		}
	} else {
		this.setCode(code);
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
	@return {{left:number,top:number,width:number,height:number}}
*/
A3a.vpl.VPLSourceEditor.prototype.editorArea = function () {
	var canvasSize = this.tbCanvas.getSize();
	var viewBox = this.tbCanvas.css.getBox({tag: "view", clas: ["src"]});
	viewBox.setTotalWidth(canvasSize.width);
	viewBox.setTotalHeight(canvasSize.height);
	viewBox.setPosition(0, 0);
	// buttonBox and toolbarBox: don't care about width
	var buttonBox = this.tbCanvas.css.getBox({tag: "button", clas: ["src", "top"]});
	buttonBox.height = this.tbCanvas.dims.controlSize;
	var toolbarBox = this.tbCanvas.css.getBox({tag: "toolbar", clas: ["src", "top"]});
	toolbarBox.height = buttonBox.totalHeight();
	toolbarBox.setPosition(viewBox.x, viewBox.y);

	return {
		left: viewBox.x,
		top: viewBox.y + toolbarBox.totalHeight(),
		width: viewBox.width,
		height: viewBox.height - toolbarBox.totalHeight()
	};
};

/** Render toolbar for source code editor
	@return {void}
*/
A3a.vpl.Application.prototype.renderSourceEditorToolbar = function () {
	var editor = this.editor;

	// start with an empty canvas
	editor.tbCanvas.clearItems();

	// boxes
	var canvasSize = editor.tbCanvas.getSize();

	var viewBox = editor.tbCanvas.css.getBox({tag: "view", clas: ["src"]});
	var buttonBox = editor.tbCanvas.css.getBox({tag: "button", clas: ["src", "top"]});
	var separatorBox = editor.tbCanvas.css.getBox({tag: "separator", clas: ["src", "top"]});
	var toolbarBox = editor.tbCanvas.css.getBox({tag: "toolbar", clas: ["src", "top"]});

	buttonBox.width = editor.tbCanvas.dims.controlSize;
	buttonBox.height = editor.tbCanvas.dims.controlSize;
	toolbarBox.setTotalWidth(canvasSize.width);
	toolbarBox.height = buttonBox.totalHeight();
	toolbarBox.setPosition(0, 0);

	// box sizes
	viewBox.setTotalWidth(canvasSize.width);
	viewBox.setTotalHeight(canvasSize.height);
	viewBox.setPosition(0, 0);
	buttonBox.width = editor.tbCanvas.dims.controlSize;
	buttonBox.height = editor.tbCanvas.dims.controlSize;
	toolbarBox.setTotalWidth(viewBox.width);
	toolbarBox.height = buttonBox.totalHeight();
	toolbarBox.setPosition(viewBox.x, viewBox.y);

	// view (background)
	editor.tbCanvas.addDecoration(function (ctx) {
		viewBox.draw(ctx);
	});

	// top controls
	var controlBar = new A3a.vpl.ControlBar(editor.tbCanvas);
	controlBar.setButtons(this,
		editor.toolbarConfig || [
			"src:new",
			"src:save",
			"src:vpl",
			"src:locked",
			"!space",
			"src:language",
			"src:disass",
			"!stretch",
			"src:run",
			"src:stop",
			"!space",
			"src:sim",
			"!stretch",
			"src:teacher-reset",
			"src:teacher"
		],
		editor.toolbarDrawButton || A3a.vpl.Commands.drawButtonJS,
		editor.toolbarGetButtonBounds || A3a.vpl.Commands.getButtonBoundsJS);

	controlBar.calcLayout(toolbarBox, buttonBox, separatorBox);
	controlBar.addToCanvas(toolbarBox, buttonBox);
	editor.tbCanvas.redraw();
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
	window["vplApp"].renderSourceEditorToolbar();
};

/** Resize the source code editor
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.resize = function () {
	var width = window.innerWidth;
	var height = window.innerHeight;
	this.tbCanvas.resize(width, height);
	var canvasBndRect = this.tbCanvas.canvas.getBoundingClientRect();
	var editorDiv = document.getElementById("src-editor");
	var editorArea = this.editorArea();
	// editorDiv.style.left = (canvasBndRect.left + canvasBndRect.width * this.tbCanvas.relativeArea.xmin) + "px";
	// editorDiv.style.width = (canvasBndRect.width * (this.tbCanvas.relativeArea.xmax - this.tbCanvas.relativeArea.xmin)) + "px";
	// editorDiv.style.top = (canvasBndRect.top + canvasBndRect.height * this.tbCanvas.relativeArea.ymin + tbHeight) + "px";
	// editorDiv.style.height = (canvasBndRect.height * (this.tbCanvas.relativeArea.ymax - this.tbCanvas.relativeArea.ymin) - tbHeight) + "px";
	editorDiv.style.left = editorArea.left + "px";
	editorDiv.style.width = editorArea.width + "px";
	editorDiv.style.top = editorArea.top + "px";
	editorDiv.style.height = editorArea.height + "px";

	this.textEditor.resize();

	window["vplApp"].renderSourceEditorToolbar();
};

/** Set the focus to the editor
	@return {void}
*/
A3a.vpl.VPLSourceEditor.prototype.focus = function () {
	document.getElementById("editor").focus();
	this.tbCanvas.redraw();	// update toolbar state
};
