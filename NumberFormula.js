'use strict';

let pegStr = getPegStr();
console.log(pegStr);
let parser = peg.generate(pegStr);

//let parser = peg.generate("start = (' '/'a' / 'b')+");
//console.log(parser.parse('a'));
console.log(parser.parse("A$"));

function getPegStr() {
  return `
// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.
{
  function now() {
    return 0;
  }
  function self(){
    return {
      inits: [-3,-2,-1,0],
      values: [1,2,3,4,5,6,7]
    };
  }
  function val(obj,idx) {
    if (typeof(idx)==='undefined'){
      return obj.values[now()];
    }
    if (idx>=0) {
      return obj.values[idx];
    } else {
      return obj.inits[obj.inits.length+idx];
    }
  }
  function len(obj) {
    return obj.values.length;
  }
  function ini(obj,idx) {
    return obj.inits[obj.inits.length-idx-1];
  }
}
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
  / SysOperated2
  / SysOperated
  / seq:Sequence {
    return val(seq)
  }

SysOperated
= seq:Sequence tail:(_ SysOperator SysIndex*)+ {
      return tail.reduce(function(result, element) {
        // TODO:
        var arg = element[2][0];
        if (typeof(arg)==='undefined'){
          arg = 1;
        }
        if (element[1] === "'") { return result - arg; }
        if (element[1] === "\`") { return result + arg; }
      }, val(seq));
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
      }, val(self()));
    }

SysOperator 
= ['\`]


SysOperated2
= seq:Sequence _ op:SysOperator2 idx:SysIndex* {
      var arg = idx[0];
      if (op === '#') {
        if (typeof(arg)==='undefined') {
          return seq.values.length;
        }
        return val(seq,arg);
      } else {
        if (typeof(arg)==='undefined') {
          return seq.inits.length;
        }
        return ini(seq,arg);
      }
    }
/ _ op:SysOperator2 idx:SysIndex* {
      var seq = self();
      if (op === '#') {
        if (typeof(arg)==='undefined') {
          return seq.values.length;
        }
        return val(seq,arg);
      } else {
        if (typeof(arg)==='undefined') {
          return seq.inits.length;
        }
        return ini(seq,arg);
      }
    }

SysOperator2
= [$#]


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
  return self();
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