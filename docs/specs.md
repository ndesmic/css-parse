## Tokenizer:

[ ] Preprocess
[x] Consume comments. (emits a comment token)
[x] whitespace (\n, \t, " ")
[x] U+0022 QUOTATION MARK (")
[x] U+0023 NUMBER SIGN (#)
[x] U+0027 APOSTROPHE (')
[x] U+0028 LEFT PARENTHESIS (()
[x] U+0029 RIGHT PARENTHESIS ())
[x] U+002B PLUS SIGN (+)
[x] U+002C COMMA (,)
[x] U+002D HYPHEN-MINUS (-)
[x] U+002E FULL STOP (.)
[x] U+003A COLON (:)
[x] U+003B SEMICOLON (;)
[x] U+003C LESS-THAN SIGN (<)
[x] U+0040 COMMERCIAL AT (@)
[x] U+005B LEFT SQUARE BRACKET ([)
[x] U+005C REVERSE SOLIDUS (\)
[x] U+005D RIGHT SQUARE BRACKET (])
[x] U+007B LEFT CURLY BRACKET ({)
[x] U+007D RIGHT CURLY BRACKET (})
[x] digit (0-9)
[x] name-start code point
[!] EOF
[x] anything else