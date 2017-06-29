'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse('-.20 * (3 + 4)/(1+1)'));

function getPegStr() {
  return `
// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

NumberFormula
= head:Term tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, head);
    }

Term
= head:Factor tail:(_ ("*" / "/") _ Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

Factor
= "(" _ expr:NumberFormula _ ")" { return expr; }
  / Number

Number
= $(Int / Float)
{
  return parseFloat(text());
}

Float
= Int '.' Digit*
/ '.' Digit+
/ Signed '.' Digit+


Int
= Zero
/ NonZeroInt

NonZeroInt
= Digit19 Digit*
/ Signed Digit19 Digit*

Zero
= '0'
/ Signed '0'

Signed
= [\+\-]

Digit19
= [1-9]

Digit
= [0-9]

_ "wsp"
  = [ \\t\\n\\r]*
`;
}