'use strict';
(function (console, peg) {
  let config = {
    func: function () {
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
        if (head === null && tail.length===0) {
          return null;
        }
        return tail.reduce(function (result, element) {
          if (element[1] === '+') { return result + element[2]; }
          if (element[1] === '-') { return result - element[2]; }
        }, head);
      }
      function processMulDiv(head, tail) {
        if (head === null && tail.length===0) {
          return null;
        }
        return tail.reduce(function (result, element) {
          if (element[1] === '*') { return result * element[2]; }
          if (element[1] === '/') { return result / element[2]; }
        }, head);
      }
      function processFunc(head, tail) {
        if (head === null && tail.length===0) {
          return null;
        }
        return tail.reduce(function (result, element) {
          let func = element[1].join('');
          if (func === 'mod') { return result % element[2]; }
        }, head);
      }
      function processFuncEx(func, aidx, _args) {
          let args = [];
          if (aidx===null) {
            args.push(_args);
          } else {
            for (let ai=0;ai<_args.length;ai++) {
              args.push(_args[ai][aidx]);
            }
          }
          if (func === 'mod' && args.length===2) { 
            return  args[0] % args[1];
          }  else if (func === 'not' && args.length===1) { 
            if (! args[0]) {
              return 1;
            } else {
              return 0;
            }
          }  else {
            return 0;
          }
      }
      function processDash(seq, tail) {
        let result = tail.reduce(function (result, element) {
          var op = element[1];
          var arg = element[2][0];
          if (typeof (arg) === 'undefined') {
            arg = 1;
          }
          if (op.charCodeAt() === 39) {

            result.dash++;
          } else if (op.charCodeAt() === 96) {
            result.backdash++;
          }
          return result;
        }, { dash: 0, backdash: 0 });
        let hasBackdash = 0;
        if (result.backdash !== 0) {
          hasBackdash = 1;
        }
        let cidx = -(result.backdash);
        let ridx = -(result.dash + hasBackdash);
        return val(seq, cidx, ridx);
      }
      function processHashDoller(seq, idx, op) {
        var arg = idx[0];
        if (op === '#') {
          if (typeof (arg) === 'undefined') {
            return vallen(seq);
          }
          return val(seq, 0, arg);
        } else {
          if (typeof (arg) === 'undefined') {
            return inilen(seq);
          }
          return ini(seq, 0, arg);
        }
      }
    }
  };
  let funcStr = JSON.stringify(config.func, replacer);
  funcStr = funcStr.replace(/^"function \(\) {\\n/, '').replace(/}"$/, '').replace(/\\n/g, '\n');
  //console.log(funcStr);
  let pegStr = getPegStr(funcStr);
  console.log(pegStr);
  let parser = peg.generate(pegStr);
  console.log(parser.parse('10 11 '));
/*
  console.log(parser.parse('A @ 10 mod 4'));
  console.log(parser.parse('A @ mod [10][4]'));
  console.log(parser.parse('A @ not 4'));
  console.log(parser.parse('A @ not [10]'));
  */
  //console.log(parser.parse("A``'"));
  function replacer(k, v) {
    if (typeof v === 'function') { return v.toString(); };
    return v;
  }
  function getPegStr(funcStr) {
    let signed = '\\+\\-';
    let wsp = ' \\t\\n\\r';
    let dash = `"'"`;
    let backdash = "'`'";
    return `

// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.
{
${funcStr}
}
/*
Statement
= seq:SeqName _ '@' formula:Formula {
  return text() +' : '+ formula;
}
*/


Statement
= Formula Formula  _

/*
 A A | B A 
*/

SeqName
= _ seq:[A-Z]+ _ { return seq.join(''); }

Formula
= head:FuncTerm tail:(_ ('+' / '-')  FuncTerm)*  { return processAddSub(head, tail); }
/ tail:(_ ('+' / '-') FuncTerm)+ { return processAddSub(0, tail); }

FuncTerm
= head:Term tail:(_ [a-z]+ Term)* { return processFunc(head, tail); }
/ _ op:[a-z]+ _ args:Term { return processFuncEx(op.join(''), null, args); }
/ _ op:[a-z]+ args:(_ '[' Term ']')* { return processFuncEx(op.join(''), 2, args); }

Term
= head:Factor tail:(_ ('*' / '/') Factor )* { return processMulDiv(head, tail); }

Factor
= /*
_ '(' expr:Formula ')' { return expr; }
  /
  */ UnsignedNumber
  / SysOperatedDoller
  / SysOperatedHash
  / SysOperatedDash
  / seq:Sequence { return val(seq,0,now()); }

SysOperatedDash
= seq:Sequence tail:(_ [${dash}${backdash}] SysIndex*)+ { return processDash (seq,tail); }
/ tail:(_ [${dash}${backdash}]  SysIndex*)+ { return processDash (self(),tail);}

SysOperatedDoller
= seq:Sequence _ op:'$' idx:SysIndex* { return processHashDoller (seq, idx, op); }
/ _ op:'$' idx:SysIndex* { return processHashDoller (self(), idx, op); }

SysOperatedHash
= seq:Sequence _ op:'#' idx:SysIndex* { return processHashDoller (seq, idx, op); }
/ _ op:'#' idx:SysIndex* { return processHashDoller (self(), idx, op); }

SysIndex
= _ '{' signed:SignedInt '}'
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
= _ [${signed}] _UnsignedInt _
/ _UnsignedInt

_UnsignedInt
= '0'
/ [1-9] [0-9]*

_
= [${wsp}]*
  
`;
  }
})(console,
  typeof (peg) === 'undefined'
    ? { generate: function () { return { parse: function () { } } } }
    : peg
  );
