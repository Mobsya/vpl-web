/*
	Copyright 2018 ECOLE POLYTECHNIQUE FEDERALE DE LAUSANNE,
	Miniature Mobile Robots group, Switzerland
	Author: Yves Piguet

	Licensed under the 3-Clause BSD License;
	you may not use this file except in compliance with the License.
	You may obtain a copy of the License at
	https://opensource.org/licenses/BSD-3-Clause
*/

/** Code generator for L2
	@constructor
	@extends {A3a.vpl.CodeGenerator}
*/
A3a.vpl.CodeGeneratorL2 = function () {
	A3a.vpl.CodeGenerator.call(this, "l2", "&&");
};
A3a.vpl.CodeGeneratorL2.prototype = Object.create(A3a.vpl.CodeGenerator.prototype);
A3a.vpl.CodeGeneratorL2.prototype.constructor = A3a.vpl.CodeGeneratorL2;

/**
	@inheritDoc
*/
A3a.vpl.CodeGeneratorL2.prototype.generate = function (program, runBlocks) {
	this.reset();
	var c = program.program.map(function (eh) {
		return this.generateCodeForEventHandler(eh);
	}, this);
	/** @type {Array.<string>} */
	var initVarDecl = [];
	/** @type {Array.<string>} */
	var initCodeExec = [];
	/** @type {Array.<string>} */
	var initCodeDecl = [];
	/** @type {Array.<string>} */
	var clauses = [];
	/** @dict */
	var folding = {};
		// folding[sectionBegin] = index in c fragments with same sectionBegin are folded into
	/** @type {Array.<number>} */
	var initEventIndices = [];
	c.forEach(function (evCode, i) {
		evCode.initVarDecl && evCode.initVarDecl.forEach(function (fr) {
			if (initVarDecl.indexOf(fr) < 0) {
				initVarDecl.push(fr);
			}
		});
		evCode.initCodeExec && evCode.initCodeExec.forEach(function (fr) {
			if (initCodeExec.indexOf(fr) < 0) {
				initCodeExec.push(fr);
			}
		});
		evCode.initCodeDecl && evCode.initCodeDecl.forEach(function (fr) {
			if (initCodeDecl.indexOf(fr) < 0) {
				initCodeDecl.push(fr);
			}
		});
		if (evCode.clause || evCode.sectionBegin) {
			evCode.clauseIndex = clauses.indexOf(A3a.vpl.CodeGenerator.Mark.remove(evCode.clause || evCode.sectionBegin));
			if (evCode.clauseIndex < 0) {
				// first time this exact clause is found
				evCode.clauseIndex = clauses.length;
				clauses.push(A3a.vpl.CodeGenerator.Mark.remove(evCode.clause || evCode.sectionBegin));

	 			if (folding[evCode.sectionBegin] !== undefined) {
					// fold evCode into c[folding[evCode.sectionBegin]]
					var foldedFrag = c[folding[evCode.sectionBegin]];
					if (evCode.clauseInit &&
						(!foldedFrag.clauseInit || foldedFrag.clauseInit.indexOf(evCode.clauseInit) < 0)) {
						// concat all clauseInit fragments without duplicates
						foldedFrag.clauseInit = (foldedFrag.clauseInit || "") + evCode.clauseInit;
					}
					foldedFrag.clauseAssignment += evCode.clause
						? "when (" + evCode.clause + " ) {\n" +
							"eventCache[" + evCode.clauseIndex + "] = true;\n" +
							"}\n"
						: "eventCache[" + evCode.clauseIndex + "] = true;\n";
				} else {
					// first fragment with that sectionBegin
					folding[evCode.sectionBegin] = i;
					evCode.clauseAssignment = evCode.clause
						? "when (" + evCode.clause + ") {\n" +
							"eventCache[" + evCode.clauseIndex + "] = true;\n" +
							"}\n"
						: "eventCache[" + evCode.clauseIndex + "] = true;\n";
				}
			}
		}
		if (!evCode.sectionBegin) {
			evCode.statement = this.bracket(evCode.statement || "", program.program[i]);
		}
		if (program.program[i].getEventBlockByType("init")) {
			initEventIndices.push(i);
		}
	}, this);

	// compile runBlocks
	var runBlocksCode = "";
	if (runBlocks) {
		var eh = new A3a.vpl.EventHandler();
		var initBlock = new A3a.vpl.Block(A3a.vpl.BlockTemplate.findByName("init"), null, null);
		eh.setBlock(initBlock, null, null);
		runBlocks.forEach(function (block) {
			eh.setBlock(block, null, null);
		});
		runBlocksCode =  this.generateCodeForEventHandler(eh).statement;
	}

	// build program from fragments:
	// init fragments (var declarations first, then code, without sub/onevent)
	var str = initVarDecl.length > 0 ? "\n" + initVarDecl.join("\n") : "";
	if (clauses.length > 0) {
		str += "bool eventCache[] = false;\n"
	}
	if (runBlocks) {
		str += "\n" + runBlocksCode;
	} else {
		var strInit = "";
		if (initCodeExec.length > 0) {
			strInit += "\n" + initCodeExec.join("\n");
		}
		// init implicit event
		for (var i = 0; i < program.program.length; i++) {
			if (initEventIndices.indexOf(i) >= 0 && c[i].statement) {
				strInit += (strInit.length > 0 ? "\n" : "") +
					(c[i].sectionBegin || "") + (c[i].statement || "") + (c[i].sectionEnd || "");
			}
		}
		if (strInit) {
			str += (str.length > 0 ? "\n" : "") + strInit.slice(1);	// skip initial linefeed
		}
	}
	// init fragments defining functions and onevent
	if (initCodeDecl.length > 0) {
		str += "\n" + initCodeDecl.join("\n");
	}
	// explicit events
	for (var i = 0; i < program.program.length; i++) {
		if (initEventIndices.indexOf(i) < 0 && c[i].statement) {
			str += "\n";
			str += (c[i].sectionBegin || "") + (c[i].clauseInit || "") + (c[i].clauseAssignment || "") + (c[i].sectionEnd || "");
		}
	}
	/** @type {Array.<string>} */
	var auxClausesInit = [];
	var actionsCode = "";
	for (var i = 0; i < program.program.length; i++) {
		if (initEventIndices.indexOf(i) < 0 && c[i].clauseIndex >= 0) {
			c[i].auxClausesInit && c[i].auxClausesInit.forEach(function (cl) {
				if (auxClausesInit.indexOf(cl) < 0) {
					auxClausesInit.push(cl);
				}
			});
			actionsCode += "if (eventCache[" + c[i].clauseIndex + "]" +
				(c[i].auxClauses ? " && " + c[i].auxClauses : "") +
				") {\n" +
				c[i].statement +
				"eventCache[" + c[i].clauseIndex + "] = false;\n" +
				"}\n";
		} else if (c[i].auxClauses) {
			actionsCode += "when (" + c[i].auxClauses + ") {\n" +
				c[i].statement +
				"}\n";
		}
	}
	if (actionsCode) {
		str += "onevent timer1 {\n" + auxClausesInit.join("") + actionsCode + "}\n";
	}
	// remove initial lf
	if (str[0] === "\n") {
		str = str.slice(1);
	}

	// pretty-print (fix indenting)
	var indent = 0;
	var lines = str
		.split("\n")
		.map(function (line) { return line.trim(); })
		.map(function (line) {
			var line1 = A3a.vpl.CodeGenerator.Mark.remove(line);
			if (line1.length > 0) {
				var preDec = line1[0] === "}";
				var postInc = line1.slice(-1) === "{";
				if (preDec) {
					indent = Math.max(indent - 1, 0);
				}
				line = "\t\t\t\t\t".slice(0, indent) + line;
				if (postInc) {
					indent++;
				}
			}
			return line;
		});
	// align comments with following line
	for (var i = lines.length - 2; i >= 0; i--) {
		if (/^\s*#/.test(lines[i])) {
			var nextLineInitialBlanks = lines[i + 1].replace(/^(\s*).*$/, "$1");
			lines[i] = nextLineInitialBlanks + lines[i].replace(/^\s*/, "");
		}
	}
	str = lines.join("\n");

	// check duplicate events
	for (var i = 0; i < program.program.length; i++) {
		for (var j = i + 1; j < program.program.length; j++) {
			program.program[i].checkConflicts(program.program[j]);
		}
	}

	// extract marks
	str = A3a.vpl.CodeGenerator.Mark.extract(this.marks, str);

	return str;
};

/**
	@inheritDoc
*/
A3a.vpl.CodeGeneratorL2.prototype.generateMissingCodeForBlock = function (block) {
	var code = "// missing L2 implementation for block " + block.blockTemplate.name + "\n";
	switch (block.blockTemplate.type) {
	case A3a.vpl.blockType.event:
	case A3a.vpl.blockType.state:
		return {
			clauseInit: code,
			clause: "true",
			sectionPriority: 1
		};
	case A3a.vpl.blockType.action:
		return {
			statement: code
		};
	default:
		return {};
	}
};

A3a.vpl.Program.codeGenerator["l2"] = new A3a.vpl.CodeGeneratorL2();
