const tokens = [
	"ident",//
	"function",
	"at-keyword",
	"hash",
	"string", //
	"bad-string",
	"url",
	"bad-url",
	"delim",
	"number",//
	"percentage",
	"demension",
	"whitespace",//
	"CDO",
	"CDC",
	"colon",//
	"semicolon",//
	"comma",//
	"right-bracket",//
	"left-bracket",//
	"right-paren",//
	"left-paren",//
	"right-brace",//
	"left-brace"//
]

export const isAlpha = c => /[a-zA-Z_]/.test(c);
export const isDigit = c => /[0-9]/.test(c);
export const isHex = c => /[0-9a-fA-F]/.test(c);
export const isAlphanumeric = c => isAlpha(c) || isDigit(c);
export const isAlphaNumberDash = c => isAlphanumeric(c) || c === "-";
export const isNonAscii = c => c.charCodeAt(0) > 127;
export const isWhitespace = c => c === "\n" || c === "\t" || c === " ";

//https://www.w3.org/TR/css-syntax-3/#starts-with-a-valid-escape
export function isEscape(str){
	if(str[0] !== "\\") return false;
	if(str[1] === "\n") return false;
	return true;
}

//https://www.w3.org/TR/css-syntax-3/#name-start-code-point
export function isNameStartCodePoint(char){
	if(char.length != 1) throw `expected string of length 1, got ${str}`;
	return isAlpha(char) || isNonAscii(char) || char === "_";
}


export function isNameCodePoint(char){
	return isNameStartCodePoint(char) || isDigit(char) || char === "-";
}

//https://www.w3.org/TR/css-syntax-3/#would-start-an-identifier
export function isIdStart(str){
	if (str.length != 3) throw `expected string of length 3, got ${str}`;
	if(str[0] === "-"){
		if(str[1] === "-") return true;
		if(isEscape(str.substring(1,3))) return true;
		return false;
	}
	if(isNameStartCodePoint(str[0])) return true;
	if(str[0] === "\\"){
		if(isEscape(str.substring(0,2))) return true;
		return false;
	}
	return false
}

export class Tokenizer {
	constructor(text){
		this.index = 0;
		this.text = text;
	}
	nextChar(){
		if(this.isAtEnd()){
			throw "Read past end of file";
		}
		return this.text.substring(this.index, ++this.index);
	}
	peekChar(count = 1){
		if(this.index + count > this.text.length) throw `Peeked for ${count} but reached end of stream`;
		return this.text.substring(this.index, this.index + count);
	}
	reconsume(){
		this.index--;
	}
	isAtEnd(){
		return this.index === this.text.length;
	}
	remaining(count){
		return this.index + count <= this.text.length;
	}
	//https://www.w3.org/TR/css-syntax-3/#consume-token
	nextToken(){
		const startIndex = this.index;
		const comment = this.consumeComments();
		if(comment){
			return comment;
		}
		const char = this.nextChar();
		switch(char){
			case "\n":
			case "\r":
			case "\f":
			case " ":
			case "\t":
				return this.consumeWhitespace(char);
			case "{":
				return { type: "leftbrace", index: startIndex };
			case "}":
				return { type: "rightbrace", index: startIndex };
			case "(":
				return { type: "leftparen", index: startIndex };
			case ")":
				return { type: "rightparen", index: startIndex };
			case "[":
				return { type: "leftbracket", index: startIndex };
			case "]":
				return { type: "rightbracket", index: startIndex };
			case ":":
				return { type: "colon", index: startIndex };
			case ",":
				return { type: "comma", index: startIndex };
			case ";":
				return { type: "semicolon", index: startIndex };
			case "@":
				return this.consumeAt(char);
			case "#":
				return this.consumeNumberSign(char);
			case "+":
				return this.consumePlus(char);
			case "-":
				return this.consumeMinus(char);
			case ".":
				return this.consumePeriod(char);
			case "<":
				return this.consumeLessThan(char);
			case "\\":
				return this.consumeReverseSolidus(char);
			case "\"":
			case "'":
				return this.consumeString(char);
			default: {
				const start = this.index - 1;
				if(isDigit(char)){
					this.reconsume();
					return { ...this.consumeNumeric(), index: start };
				}
				if(isNameStartCodePoint(char)){
					this.reconsume();
					return { ...this.consumeIdentLike(), index: start};
				}
				return { type: "delim", value: char, index: start };
			}
		}
	}
	
	consumeIdentifier(){
		const start = this.index - 1; //we consumed 1 already
		while(isAlphaNumberDash(this.peekChar())) this.nextChar();

		const text = this.text.substring(start, this.index);
		return { type: "identifier", value: text, index: start };
	}

	consumeComments(){
		const start = this.index;
		let result = "";

		if(this.index < this.text.length - 2 && this.peekChar(2) === "/*" ){
			while (this.index != this.text.length - 1 && this.peekChar(2) !== "*/") {
				result += this.nextChar();
			}
			if(this.index > this.text.length - 1){
				throw `Unterminated comment starting at index ${start}`;
			}
			result += this.nextChar() + this.nextChar();
		}

		return result ? { type: "comment", value: result, index: start } : null;
	}

	//https://www.w3.org/TR/css-syntax-3/#whitespace
	consumeWhitespace(){
		const start = this.index - 1;
		while(!this.isAtEnd()){
			const char = this.nextChar();
			if(!isWhitespace(char)){
				this.reconsume();
				return { type: "whitespace", index: start };
			}
		}
		return { type: "whitespace", index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-string-token
	consumeString(startChar){
		const start = this.index - 1;
		let result = "";

		while(!this.isAtEnd()){
			const char = this.nextChar();
			if(char === startChar){
				return { type: "string", value: result, index: start };
			} else if(char === "\n"){
				this.reconsume();
				return { type: "bad string" };
			} else if(char === "\\"){
				if(this.index + 1 !== this.text.length){
					if(this.peekChar() === "\n") this.nextChar();
					result += char + this.nextChar();
				}
			}
			result += char;
		}
		return { type: "string", value: result };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-a-number
	consumeNumber(){
		let type = "integer";
		let repr = "";
		if(this.remaining(1) && this.peekChar() === "+" || this.peekChar() === "-"){
			repr += this.nextChar();
		}
		while (this.remaining(1) && isDigit(this.peekChar())){
			repr += this.nextChar();
		}
		if (this.remaining(2)  && /\.[0-9]/.test(this.peekChar(2))){
			repr += this.nextChar() + this.nextChar();
			type = "number";
			while (this.remaining(1) && isDigit(this.peekChar())){
				repr += this.nextChar();
			}
		}
		if (this.remaining(2) && /[eE][0-9]/.test(this.peekChar(2))){
			repr += this.nextChar() + this.nextChar();
			type = "number";
			while (this.remaining(1) && isDigit(this.peekChar())) {
				repr += this.nextChar();
			}
		}
		if (this.remaining(3) && /[eE][-+][0-9]/.test(this.peekChar(3))){
			repr += this.nextChar() + this.nextChar() + this.nextChar();
			type = "number";
			while (this.remaining(1) && isDigit(this.peekChar())) {
				repr += this.nextChar();
			}
		}
		const value = Number(repr);
		return { type, value };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-a-numeric-token
	//Modified to accept partial inputs (eg. when there's not at least 3 lookaheads)
	consumeNumeric(){
		const number = this.consumeNumber();
		if (this.remaining(3) && isIdStart(this.peekChar(3))){
			return { type: "dimension", flag: number.type, value: number.value, unit: this.consumeName() }; 
		} else if (this.remaining(2) && isEscape(this.peekChar(2))){
			return { type: "dimension", flag: number.type, value: number.value, unit: this.consumeName() }; 
		} else if (this.remaining(1) && isNameStartCodePoint(this.peekChar())){
			return { type: "dimension", flag: number.type, value: number.value, unit: this.consumeName() }; 
		} else if (this.remaining(1) && this.peekChar() === "%"){
			this.nextChar();
			return { type: "percentage", value: number.value };
		}
		return { type: "number", flag: number.type, value: number.value };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-name
	consumeName(){
		let result = "";
		while(!this.isAtEnd()){
			const char = this.nextChar();
			if(isNameCodePoint(char)){
				result += char;
			} else if(isEscape(char + this.peekChar())){
				result += char + this.nextChar();
			} else {
				this.reconsume();
				return result;
			}
		}
		return result;
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-an-ident-like-token
	consumeIdentLike(){
		const value = this.consumeName();
		if(this.remaining(1) && value.toLowerCase() === "url" && this.peekChar() === "("){
			this.nextChar();
			while(/\\s\\s/.test(this.peekChar(2))){
				this.nextChar();
			}
			if (/['\"]/.test(this.peekChar(1)) || /\s['\"]/.test(this.peekChar(2))){
				return { type: "function", value };
			} else {
				return this.consumeUrl();
			}
		} else if(this.remaining(1) && this.peekChar() === "("){
			this.nextChar();
			return { type: "function", value };
		}
		return { type: "ident", value };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-a-url-token
	consumeUrl(){
		const url = { type: "url" };
		let value = "";
		this.consumeWhitespace();
		const start = this.index;

		while(!this.isAtEnd){
			const char = this.nextChar();
			switch(char){
				case ")":
					return url;
				case " ":
				case "\t":
				case "\r":
				case "\n":
				case "\f":
					this.consumeWhitespace();
				case "\"":
				case "'":
				case "(":
					this.consumeBadUrl();
					return { type: "bad-url", value };
				case "\\":
					if(isEscape(char + this.peekChar())){
						value += char + this.nextChar();
					} else {
						this.consumeBadUrl();
						return { type: "bad-url", value };
					}
				default:
					value += char;
			}
		}
		throw `Unterminated url starting on index ${start}`;
	}

	consumeBadUrl(){
		while(!this.isAtEnd()){
			const char = this.nextChar();
			if(char === ")") return;
			//escaped code point?
		}
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-string-token#:~:text=U+0040%20COMMERCIAL%20AT%20(@)
	consumeAt(char){
		const start = this.index - 1;
		if(isIdStart(this.text.substring(this.index, this.index + 3))){
			return { type: "at-keyword", value: this.consumeName(), index: start };
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+0023%20NUMBER%20SIGN%20(#)
	consumeNumberSign(char){
		const start = this.index - 1;
		if(isNameCodePoint(this.peekChar()) || isEscape(this.peekChar(2))){
			const hashToken = { type: "hash", flag: "unrestricted", index: start };
			if(isIdStart(this.peekChar(3))){
				hashToken.flag = "id";
			}
			hashToken.value = this.consumeName();
			return hashToken;
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+002B%20PLUS%20SIGN%20(+)
	consumePlus(char){
		const start = this.index - 1;
		if(isDigit(this.peekChar())){
			this.reconsume();
			return { ...this.consumeNumeric(), index: start };
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+002D%20HYPHEN-MINUS%20(-)%20If
	consumeMinus(char){
		const start = this.index - 1;
		if(isDigit(this.peekChar())){
			this.reconsume();
			return { ...this.consumeNumeric(), index: start };
		} else if(this.peekChar(2) === "->"){
			return { type: "CDC", value: char + this.nextChar() + this.nextChar(), index: start };
		} else if(this.remaining(3) && isIdStart(char + this.peekChar(2))){
			this.reconsume();
			return { ...this.consumeIdentLike(), index: start };
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+002E%20FULL%20STOP%20(.)
	consumePeriod(char){
		const start = this.index - 1;
		if(isDigit(this.peekChar())){
			this.reconsume();
			return { ...this.consumeNumeric(), index: start };
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+003C%20LESS-THAN%20SIGN%20(%3C)
	consumeLessThan(char){
		const start = this.index - 1;
		if(this.peekChar(3) === "!--"){
			return { type: "CDO", value: char + this.nextChar() + this.nextChar() + this.nextChar(), index: start };
		}
		return { type: "delim", value: char, index: start };
	}

	//https://www.w3.org/TR/css-syntax-3/#consume-comments#cosume-string-token#:~:text=U+005C%20REVERSE%20SOLIDUS%20(\)
	consumeReverseSolidus(char){
		const start = this.index - 1;
		if(isEscape(char + this.peekChar())){
			this.reconsume();
			return { ...this.consumeIdentLike(), index: start };
		}
		throw `invalid escape at ${start}`;
	}
}