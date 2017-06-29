'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse("''+'"));

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

Factor
= _ '(' expr:Formula ')' 
{
  return expr; 
}
  / UnsignedNumber
  / SysOperated
  / Sequence

SysOperated
= head:Sequence tail:(_ SysOperator SysIndex*)+ {
      return tail.reduce(function(result, element) {
        // TODO:
        var arg = element[2][0];
        if (typeof(arg)==='undefined'){
          arg = 1;
        }
        if (element[1] === "'") { return result - arg; }
        if (element[1] === "\`") { return result + arg; }
      }, head);
    }
/ tail:(_ SysOperator SysIndex*)+ {
      return tail.reduce(function(result, element) {
        // TODO:
        var arg = element[2][0];
        if (typeof(arg)==='undefined'){
          arg = 1;
        }
        if (element[1] === "'") { return result - arg; }
        if (element[1] === "\`") { return result + arg; }
      }, 0);
    }

SysOperator 
= ['\`$#]


SysIndex
= _ '{' signed:$(SignedInt) '}'
{
  return parseInt(signed,10);
}
/ _ unsinged:_UnsignedInt
{
  return parseInt(unsinged,10);
}


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