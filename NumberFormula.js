'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse('-A'));

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
/ tail:(_ ("+" / "-") _ Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[3]; }
        if (element[1] === "-") { return result - element[3]; }
      }, 0);
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
  / UnsignedNumber
  / Sequence

Sequence 
= [^\\+\\-a-z \\t\\n\\r]+
{
  return 100;
}

UnsignedNumber
= $( UnsignedFloat / UnsignedInt)
{
  return parseFloat(text());
}

UnsignedFloat
= UnsignedInt '.' [0-9]*
/ '.' [0-9]+


UnsignedInt
= '0'
/ [1-9] [0-9]*

_ "wsp"
  = [ \\t\\n\\r]*
`;
}