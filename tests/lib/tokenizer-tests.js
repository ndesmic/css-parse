import { Tokenizer, isAlpha, isHex, isNonAscii, isNameStartCodePoint, isEscape, isIdStart, isWhitespace } from "../../js/lib/tokenizer.js";

describe("nextChar", () => {
	it("returns char and advances", () => {
		const tokenizer = new Tokenizer(":root{}");
		const char = tokenizer.nextChar();
		expect(char).toBe(":")
		expect(tokenizer.index).toBe(1);
	});
});
describe("isAlpha", () => {
	[
		["f", true],
		["_", true],
		["Z", true],
		["-", false],
		["1", false],
		[" ", false]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isAlpha(test[0])).toBe(test[1]);
		})
	);
});
describe("isHex", () => {
	[
		["f", true],
		["0", true],
		["1", true],
		["A", true],
		["g", false],
		[" ", false]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isHex(test[0])).toBe(test[1]);
		})
	);
});
describe("isNonAscii", () => {
	[
		["A", false],
		["a", false],
		["1", false],
		["#", false],
		[" ", false],
		["❤", true]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isNonAscii(test[0])).toBe(test[1]);
		})
	);
});
describe("isWhitespace", () => {
	[
		[" ", true],
		["\n", true],
		["\t", true],
		["#", false],
		["A", false],
		["❤", false]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isWhitespace(test[0])).toBe(test[1]);
		})
	);
});
describe("isNameStartCodePoint", () => {
	[
		["1", false],
		["-", false],
		["z", true],
		["A", true],
		["_", true],
		["❤", true]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isNameStartCodePoint(test[0])).toBe(test[1]);
		})
	);
});
describe("isEscape", () => {
	[
		["1a", false],
		["--", false],
		["zb", false],
		["\\A", true],
		["\\1", true],
		["\\❤", true],
		["\\\n", false],
		["_A", false],
		["❤B", false]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isEscape(test[0])).toBe(test[1]);
		})
	);
});
describe("isIdStart", () => {
	[
		["1aa", false],
		["--a", true],
		["-\\A", true],
		["zbv", true],
		["A--", true],
		["\\1C", true],
		["\\❤C", true],
		["\\\nC", false],
		["_AB", true],
		["❤BC", true]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			expect(isIdStart(test[0])).toBe(test[1]);
		})
	);
});
describe("nextToken", () => {
	it("returns comment", () => {
		const tokenizer = new Tokenizer("/*hello*/foo");
		const token = tokenizer.nextToken();
		expect(token.type).toBe("comment");
		expect(token.value).toBe("/*hello*/");
		expect(token.index).toBe(0);
	});
	it("returns string (double quote)", () => {
		const tokenizer = new Tokenizer(`"hello"foo`);
		const token = tokenizer.nextToken();
		expect(token.type).toBe("string");
		expect(token.value).toBe("hello");
		expect(token.index).toBe(0);
	});
	it("returns string (single quote)", () => {
		const tokenizer = new Tokenizer(`'hello'foo`);
		const token = tokenizer.nextToken();
		expect(token.type).toBe("string");
		expect(token.value).toBe("hello");
		expect(token.index).toBe(0);
	});
	//whitespace
	[
		"\n",
		"\r",
		"\r\n",
		"\f",
		" ",
		"\t",
		"\t\t"
	].forEach(text =>
		it("returns whitespace", () => {
			const tokenizer = new Tokenizer(text);
			const token = tokenizer.nextToken();
			expect(token.type).toBe("whitespace");
			expect(tokenizer.isAtEnd()).toBeTrue;
			expect(token.index).toBe(0);
		})
	);
	//single character tokens
	[
		["{", "leftbrace"],
		["}", "rightbrace"],
		["(", "leftparen"],
		[")", "rightparen"],
		["[", "leftbracket"],
		["]", "rightbracket"],
		[",", "comma"],
		[":", "colon"],
		[";", "semicolon"]
	].forEach(test => 
		it(`returns ${test[1]} for ${test[0]}`, () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.type).toBe(test[1]);
			expect(tokenizer.isAtEnd()).toBeTrue;
			expect(token.index).toBe(0);
		})
	);

	//at-rule
	[
		["@foo", ["at-keyword", "foo", 4]],
		["@supports", ["at-keyword", "supports", 9]],
		["@-@-", ["delim", "@", 1]]
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.type).toBe(test[1][0]);
			expect(token.value).toBe(test[1][1]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][2]);
		})
	);

	//number sign
	[
		["#foo", ["hash", "id","foo", 4]],
		["#112", ["hash", "unrestricted","112", 4]],
		["#\\AB", ["hash", "id", "\\AB", 4]],
		["#$$", ["delim", undefined, "#", 1]],
	].forEach(test =>
		it(`returns ${test[1]} for ${test[0]}`, () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.type).toBe(test[1][0]);
			expect(token.flag).toBe(test[1][1]);
			expect(token.value).toBe(test[1][2]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][3]);
		})
	);

	//Plus
	[
		["+1", [1, "number", "integer", undefined, 2]],
		["+123", [123, "number", "integer", undefined, 4]],
		["+03", [3, "number", "integer", undefined, 3]],
		["+1e3", [1000, "number", "number", undefined, 4]],
		["+1em", [1, "dimension", "integer", "em", 4]],
		["+1.23", [1.23, "number", "number", undefined, 5]],
		["+@@", ["+", "delim", undefined, undefined, 1]]
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.flag).toBe(test[1][2]);
			expect(token.unit).toBe(test[1][3]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][4]);
		})
	);


	//Minus
	[
		["-1", [-1, "number", "integer", undefined, 2]],
		["-123", [-123, "number", "integer", undefined, 4]],
		["-03", [-3, "number", "integer", undefined, 3]],
		["-1e3", [-1000, "number", "number", undefined, 4]],
		["-1em", [-1, "dimension", "integer", "em", 4]],
		["-1.23", [-1.23, "number", "number", undefined, 5]],
		["-@@", ["-", "delim", undefined, undefined, 1]],
		["-->", ["-->", "CDC", undefined, undefined, 3]],
		["--foo", ["--foo", "ident", undefined, undefined, 5]]
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.flag).toBe(test[1][2]);
			expect(token.unit).toBe(test[1][3]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][4]);
		})
	);

	//period
	[
		[".123", [0.123, "number", "number", undefined, 4]],
		[".123em", [0.123, "dimension", "number", "em", 6]],
		[".@@", [".", "delim", undefined, undefined, 1]],
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.flag).toBe(test[1][2]);
			expect(token.unit).toBe(test[1][3]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][4]);
		})
	);


	//less than
	[
		["<123", ["<", "delim", 1]],
		["<!--", ["<!--", "CDO", 4]],
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][2]);
		})
	);

	//reverse solidus
	[
		["\\4foo", ["\\4foo", "ident", 5]],
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][2]);
		})
	);

	//other
	[
		["\\4", ["\\4", "ident", 2]],
		["foo", ["foo", "ident", 3]],
		["123", [123, "number", 3]],
		["?", ["?", "delim", 1]],
	].forEach(test =>
		it("returns token", () => {
			const tokenizer = new Tokenizer(test[0]);
			const token = tokenizer.nextToken();
			expect(token.value).toBe(test[1][0]);
			expect(token.type).toBe(test[1][1]);
			expect(token.index).toBe(0);
			expect(tokenizer.index).toBe(test[1][2]);
		})
	);

	[
		["\\\nfoo", "invalid escape at 0"],
	].forEach(test =>
		it("will error", () => {
			const tokenizer = new Tokenizer(test[0]);
			expect(() => tokenizer.nextToken()).toThrow(test[1]);
		})
	);


});