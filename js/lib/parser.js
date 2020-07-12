export class Parser {
	constructor(tokens){
		this.tokens = tokens;
		this.index = 0;
	}
	parse(){
		return this.parseStylesheet();
	}
	parseStylesheet(){
		return {
			rules: this.parseRules()
		};
	}
	parseRules(){
		const rules = [];
		while(!this.isAtEnd()){
			rules.push(this.parseRule());
		}
		return rules;
	}
	parseRule(){
		while(this.peekToken().type === "whitespace"){
			this.getToken();
		}
		if(this.peekToken().type === "EOF"){
			throw "Syntax Error: expected start of rule but got end of file";
		}
		if(this.peekToken().type === "at-rule"){
			return this.getAtRule();
		}
		const rule = this.getQualifiedRule();
		if(!rule) throw "Syntax Error: rule incomplete";
		return rule;
	}
	getQualifiedRule(){

	}
	getAtRule(){
		
	}
	getToken(){
		return this.tokens[this.index++];
	}
	peekToken(){
		return this.tokens[this.index];
	}
	isAtEnd(){
		this.index = this.tokens.length;
	}
}