/*
	Copyright 2018 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet

	Licensed under the 3-Clause BSD License;
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	https://opensource.org/licenses/BSD-3-Clause
*/

/**
	@constructor
	@struct
	@param {A3a.vpl.BlockTemplate} blockTemplate
	@param {A3a.vpl.EventHandler} eventHandlerContainer
	@param {?A3a.vpl.positionInContainer} positionInContainer
*/
A3a.vpl.Block = function (blockTemplate, eventHandlerContainer, positionInContainer) {
	this.blockTemplate = blockTemplate;
	this.eventHandlerContainer = eventHandlerContainer;
	this.positionInContainer = positionInContainer;
	this.disabled = false;
	this.locked = false;
	/** @type {A3a.vpl.BlockTemplate.param} */
	this.param = blockTemplate.defaultParam ? blockTemplate.defaultParam() : null;
	/** @type {?function():void} */
	this.onPrepareChange = null;
	/** @type {?number} */
	this.dragging = null;	// dragged data during a mouse drag inside the block
};

/**
	@typedef {{
		eventSide: boolean,
		index: number
	}}
*/
A3a.vpl.positionInContainer;

/** Make a copy of this
	@param {A3a.vpl.EventHandler} eventHandlerContainer
	@param {?A3a.vpl.positionInContainer} positionInContainer
	@param {?function():void} onPrepareChange
	@return {A3a.vpl.Block}
*/
A3a.vpl.Block.prototype.copy = function (eventHandlerContainer, positionInContainer, onPrepareChange) {
	var newBlock = new A3a.vpl.Block(this.blockTemplate,
		eventHandlerContainer, positionInContainer);
	newBlock.disabled = this.disabled;
	newBlock.onPrepareChange = onPrepareChange;
	if (this.param) {
		var newParam = /*this.blockTemplate.exportParam
			? this.blockTemplate.exportParam(this)
			:*/ this.param.slice();
		newBlock.param = newParam;
	}
	return newBlock;
};

/** Call onPrepareChange callback if it exists
	@return {void}
*/
A3a.vpl.Block.prototype.prepareChange = function () {
	this.onPrepareChange && this.onPrepareChange();
};

/** Compiled code fragments
	@typedef {{
		initVarDecl: (Array.<string>|undefined),
		initCodeDecl: (Array.<string>|undefined),
		initCodeExec: (Array.<string>|undefined),
		sectionBegin: (string|undefined),
		sectionEnd: (string|undefined),
		sectionPriority: (number|undefined),
		clauseInit: (string|undefined),
		clause: (string|undefined),
		clauseOptional: (boolean|undefined),
		statement: (string|undefined),
		error: (A3a.vpl.Error|undefined)
	}}
*/
A3a.vpl.compiledCode;

/** Generate code
	@param {string} language
	@return {A3a.vpl.compiledCode}
*/
A3a.vpl.Block.prototype.generateCode = function (language) {
	return this.disabled
		? {}
		: this.blockTemplate.genCode[language]
			? this.blockTemplate.genCode[language](this)
			: A3a.vpl.Program.codeGenerator[language].generateMissingCodeForBlock(this);
};