
// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.
{
    function now() {
        return 0;
    }
    function getCidx(obj, _cidx) {
        var cidx = 0;
        if (typeof (_cidx) === 'undefined') {
            cidx = (_cidx + obj.length * 10) % obj.length;
        }
        return cidx;
    }
    function self(_cidx) {
        var ret = [
            {
                inits: [-3, -2, -1, 0],
                values: [1, 2, 3, 4, 5, 6, 7]
            },
            {
                inits: [-6, -4, -2, 0],
                values: [2, 4, 6, 8, 10, 12, 14]
            }
        ];
        if (typeof (_cidx) === 'undefined') {
            return ret;
        }
        var cidx = getCidx(ret, _cidx);
        return ret[cidx];
    }
    function val(obj, _cidx, ridx) {
        var cidx = getCidx(obj, _cidx);
        if (typeof (ridx) === 'undefined') {
            return obj[cidx].values[now()];
        }
        if (ridx >= 0) {
            return obj[cidx].values[ridx];
        } else {
            return obj[cidx].inits[obj[cidx].inits.length + ridx];
        }
    }
    function vallen(obj) {
        return obj[0].values.length;
    }
    function inilen(obj) {
        return obj[0].inits.length;
    }
    function ini(obj, _cidx, ridx) {
        var cidx = getCidx(obj, _cidx);
        return obj[cidx].inits[obj[cidx].inits.length - ridx - 1];
    }
    function processAddSub(head, tail) {
        return tail.reduce(function (result, element) {
            if (element[1] === '+') { return result + element[2]; }
            if (element[1] === '-') { return result - element[2]; }
        }, head);
    }
    function processMulDiv(head, tail) {
        return tail.reduce(function (result, element) {
            if (element[1] === '*') { return result * element[2]; }
            if (element[1] === '/') { return result / element[2]; }
        }, head);
    }
    function processDash (seq,tail) {
      var count = tail.reduce(function(result, element) {
        var arg = element[2][0];
        if (typeof(arg)==='undefined'){
          arg = 1;
        }
        return result + arg;
      }, 0);
      if (element[1] === "'") { return val(seq, 0, now()-count); }
      if (element[1] === "\`") { return val(seq, 0-count,now()-1) }
    }
    function processHashDoller (seq, idx) {
      var arg = idx[0];
      if (op === '#') {
        if (typeof(arg)==='undefined') {
          return vallen(seq);
        }
        return val(seq,0,arg);
      } else {
        if (typeof(arg)==='undefined') {
          return inilen(seq);
        }
        return ini(seq,0,arg);
      }
    }
}
/*
Formula
= head:Term tail:(_ ("+" / "-")  Term)*  { return processAddSub(head, tail); }
/ tail:(_ ("+" / "-") Term)* { return processAddSub(0, tail); }

Term
= head:Factor tail:(_ ("*" / "/") Factor)* { return processMulDiv(head, tail); }

Factor
= _ '(' expr:Formula ')' { return expr; }
  / UnsignedNumber
  / SysOperated2
  / SysOperated
  / seq:Sequence { return val(seq,0,now()); }

SysOperated
= seq:Sequence tail:(_ SysOperator SysIndex*)+ { return processDash (seq,tail); }
/ tail:(_ SysOperator SysIndex*)+ { return processDash (self(),tail);}

SysOperator 
= ['\`]

SysOperated2
= seq:Sequence _ op:SysOperator2 idx:SysIndex* { return processHashDoller (seq, idx); }
/ _ op:SysOperator2 idx:SysIndex* { return processHashDoller (self(), idx); }

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
= _ [A-Z]+ _ { return self();}

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
*/