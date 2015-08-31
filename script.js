var _input = document.getElementById("input");
var _view = document.getElementById("view");
var _lines = document.getElementById("lines");
var _caret = document.getElementById("caret");
var _measure = document.getElementById("measure");

var TAB_SIZE = 4;
var LINE_HEIGHT = 16;

_input.onkeydown = function(e){
	if(e.keyCode === 9){
		e.preventDefault();
		var indentedStart = _input.selectionStart + TAB_SIZE;
		_input.value = createLineDoc(_input.selectionStart, _input.selectionEnd, TAB_SIZE);
		_input.selectionStart = _input.selectionEnd = indentedStart;
	}
	update();
};

_input.onkeyup = _input.onkeypress = _input.onclick = update;
_input.onscroll = updateScroll;

/*
	Detect if it is IE, if so, hide our mimic caret, because textarea's caret in IE is not controllable with css.
*/
var agent = window.navigator.userAgent;

if(agent.indexOf("MSIE") > -1){
	_caret.style.opacity = 0;
}

function update(){
	generateDisplay();
	projectCaretToHTML();
	updateScroll();
}

function updateScroll(){
	_view.scrollLeft = _input.scrollLeft;
	_view.scrollTop = _input.scrollTop;
}

function generateDisplay(){
	var rows = _input.value.split("\n");
	_lines.innerHTML = "";

	for(var i = 0; i < rows.length; i++){
		var line = rows[i];
		line = parseLinkSyntax(line, "green", "red");
		line = parseListSyntax(line, "blue");
		line = parseQuoteSyntax(line, "orange");
		line = parseHeaderSyntax(line, "gold");
		line = parseBottomlineHeaderSyntax(line, "cyan");
		var newLine = line !== "" ? createLineHTML(line) : createLineHTML(" ");
		_lines.appendChild(newLine);
	}
}

function createLineDoc(start, end, tabSize){
	return _input.value.substr(0, start) + createTab(tabSize) + _input.value.substr(end);
}

function createLineHTML(content){
	var line = document.createElement("div");
	line.class = "line";
	line.innerHTML = content;
	return line;
}

function createSpanString(content, color){
	var span = document.createElement("span");
	span.innerHTML = content;
	span.style.color = color;
	return span.outerHTML;
}

function createTab(tabSize){
	return new Array(tabSize + 1).join(" ");
}

function getCaretInfo(){
	var start = _input.selectionStart;
	var end = _input.selectionEnd;

	var rows = _input.value.substr(0, start).split("\n");
	var remainRows = _input.value.substr(end).split("\n");
	var row = rows.length - 1;
	var col = rows[row].length;

	var rowContent = rows[row] + remainRows[0];
	var rowContentBefore = rows[row];
	var rowContentAfter = remainRows[0];

	return {
		row: row,
		col: col,
		rowContent: rowContent,
		rowContentBefore: rowContentBefore,
		rowContentAfter: rowContentAfter
	};
}

function measureSize(content){
	_measure.innerHTML = "";
	var line = createLineHTML(content);
	_measure.appendChild(line);
	var width = 0;
	var height = LINE_HEIGHT;
	if(content){
		width = _measure.offsetWidth;
	}

	return {
		width: width,
		height: height
	};
}

function projectCaretToHTML(){
	var caretInfo = getCaretInfo();
	var size = measureSize(caretInfo.rowContentBefore);
	var height = size.height * caretInfo.row;
	var width = size.width - _caret.getClientRects()[0].width;
	width = width >= 0 ? width : 0;
	_caret.style.top =  height + "px";
	_caret.style.left = width + "px";
}

/*
	================================
	====	parser functions	====
	================================
*/

function singleLineSyntax(regexp, string, color){
	var reg = regexp;
	var result = reg.exec(string);
	return result ? createSpanString(string, color) : string;
}

function linkSyntax(regexp, string, linkColor, urlColor){
	var reg = regexp;
	var newString = string;
	var result;
	while(result = reg.exec(string)){
		var matchedString = result[0];
		var linkSpan = createSpanString(result[1], linkColor);
		var urlSpan = createSpanString(result[2], urlColor);
		matchedString = matchedString.replace(result[1], linkSpan);
		matchedString = matchedString.replace(result[2], urlSpan);
		newString = newString.replace(result[0], matchedString);
	}
	return newString;
}

var parseLinkSyntax = function(string, linkColor, urlColor){ return linkSyntax(/\[((?:(?!\[|\]).)*)\]\((.*?)\)/g, string, linkColor, urlColor); };
var parseListSyntax = function(string, color){ return singleLineSyntax(/^(\s*)(((\d+\.)|\+|\*|-){1})(\s+)(.*)/g, string, color); };
var parseHeaderSyntax = function(string, color){ return singleLineSyntax(/^(\s*)(#+)(.*)/g, string, color); };
var parseBottomlineHeaderSyntax = function(string, color){ return singleLineSyntax(/^(\s*)((=|-)+)(?!(.))/g, string, color); };
var parseQuoteSyntax = function(string, color){ return singleLineSyntax(/^(\s*)(>+)(.*)/g, string, color); };
