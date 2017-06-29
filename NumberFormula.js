'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse('3 * (3 + 4)+( -1 +A)'));

function getPegStr() {
  return `
// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

Formula
= head:Term tail:(_ ("+" / "-")  Term)*  {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[2]; }
        if (element[1] === "-") { return result - element[2]; }
      }, head);
    }
/ tail:(_ ("+" / "-") Term)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "+") { return result + element[2]; }
        if (element[1] === "-") { return result - element[2]; }
      }, 0);
    }

Term
= head:Factor tail:(_ ("*" / "/") Factor)* {
      return tail.reduce(function(result, element) {
        if (element[1] === "*") { return result * element[2]; }
        if (element[1] === "/") { return result / element[2]; }
      }, head);
    }

/*
SysOperated
= head:Factor tail:(_ Operator _ SysIndex)* {
      return tail.reduce(function(result, element) {

        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }
/ head:Factor tail:(_ Operator)* {
      return tail.reduce(function(result, element) {
        
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }
/ tail:(_ Operator _ Factor)* {
      return tail.reduce(function(result, element) {
        
        if (element[1] === "*") { return result * element[3]; }
        if (element[1] === "/") { return result / element[3]; }
      }, head);
    }

SysOperator 
= ['\`$#!]
*/

SysIndex
= '{' signed:$(SignedInt) '}'
{
  return signed;
}
/ SignedInt


Factor
= _ '(' expr:Formula ')' 
{
  return expr; 
}
  / UnsignedNumber
  / Sequence

Sequence 
= _ [A-Z]+ _
{
  // TODO: seq
  return 100;
}

UnsignedNumber
= _ $( _UnsignedFloat / _UnsignedInt) _
{
  return parseFloat(text());
}

_UnsignedFloat
= _UnsignedInt '.' [0-9]*
/ '.' [0-9]+

SignedInt
= _ [\\+\\-] _UnsignedInt _
/ _UnsignedInt

_UnsignedInt
= '0'
/ [1-9] [0-9]*

_
= [ \\t\\n\\r]*
`;
}