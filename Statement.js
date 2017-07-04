'use strict';
(function (console, peg) {
  let config = {
    func: function () {
      let param = {
        limit: {
          count: 0,
          values: 10000,
        },
        constval: 4,
        max: 4,
        iteraita: {},
        instances: {},
        rentaku: {
          decls: [],
          rules: [],
          argvs: [],
          tmp: 0,
          sub: {},
          vari: {},
        },
        depend: {},
      }
      return test;
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
      function processFunc(head, tail) {
        return tail.reduce(function (result, element) {
          let func = element[1].join('');
          if (func === 'mod') { return result % element[2]; }
        }, head);
      }
      function processFuncEx(func, aidx, _args) {
        let args = [];
        if (aidx === null) {
          args.push(_args);
        } else {
          for (let ai = 0; ai < _args.length; ai++) {
            args.push(_args[ai][aidx]);
          }
        }
        if (func === 'mod' && args.length === 2) {
          return args[0] % args[1];
        } else if (func === 'not' && args.length === 1) {
          if (!args[0]) {
            return 1;
          } else {
            return 0;
          }
        } else {
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
      function processTail(head, tail) {
        let ret = [];
        for (let ti = 0; ti < tail.length; ti++) {
          if (tail[ti][2][0]) {
            ret.push(tail[ti][2][0]);
          }
        }
        if (head !== null) {
          return head.concat(ret);
        } else {
          return ret;
        }
      }
      function processStatement(seq, formulaDep, condDep, argvsDep, text) {
        let decl = seq[0].name;
        param.rentaku.decls.push(decl);
        param.rentaku.rules.push(text);

        console.log(text);
        
        param.depend[decl] = {};
        let depend = [];
        depend = depend.concat(formulaDep);
        depend = depend.concat(condDep);
        depend = depend.concat(argvsDep);
        for (let di = 0; di < depend.length; di++) {
          if (!('name' in depend[di])) {
            continue;
          }
          let name = depend[di].name;
          if (name !== decl) {
            if (!(name in param.depend[decl])) {
              param.depend[decl][name] = 0;
            }
            if (depend[di].type === 'seqend') {
              param.depend[decl][name] = Math.max(param.depend[decl][name], param.max);
            } else {
              param.depend[decl][name] = Math.max(0, param.depend[decl][name]);
            }
          }
        }
      }
      function processStatements() {
        let starts = {};
        let checked = {};
        console.log(param.depend);
        setStart(param.rentaku.decls, starts, checked);
        console.log(starts);
        return;
        
      }
      function setStart(decls, depend, starts, checked) {
          // clear
          for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            if (decl in starts) {
              delete starts[decl];
            }
            if (decl in checked) {
              delete checked[decl];
            }
          }
          for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            if (!(decl in depend)) {
              starts[decl] = 0;
            }
          }
          let tmp = {};
          for (let di = 0; di < decls.length; di++) {
            let outs = [];
            let decl = decls[di];
            setStartRepeat(0, decls.length, [decl], depend, starts, [0], outs);
            let maxout = 0;
            for (let oi = 0; oi < outs.length; oi++) {
              maxout = Math.max(maxout, outs[oi]);
            }
            tmp[decl] = maxout;
          }
          for (let decl in tmp) {
            starts[decl] = tmp[decl];
          }
          return;

          function setStartRepeat(depth, maxdepth, decls, depend, starts, ins, outs) {
            if (decls.length === 0) {
              return;
            }
            if (depth > maxdepth) {
              throw 'loop detected:' + depth;
            }
            for (let di = 0; di < decls.length; di++) {
              let nextins = [];
              let decl = decls[di];
              let array = [];
              for (let dk in depend[decl]) {
                if (dk in starts) {
                  outs.push(ins[di] + depend[decl][dk]);
                } else {
                  array.push(dk);
                  nextins.push(ins[di] + depend[decl][dk]);
                }
              }
              setStartRepeat(depth + 1, maxdepth, array, depend, starts, nextins, outs);
            }
          }
        }
        function test() {
          let decls = ['A','B'];
          let depend = {
            A: {},
            B: {A:10}
          };
          let starts = {};
          let checked = {};
          setStart(decls, depend, starts, checked);
          console.log(starts);
        }
    }
  };
  (config.func())();
  let funcStr = JSON.stringify(config.func, replacer);
  funcStr = funcStr.replace(/^"function \(\) {\\n/, '').replace(/}"$/, '').replace(/\\n/g, '\n');
  //console.log(funcStr);

  let formulaStr = getFormulaStr(funcStr);
  //console.log(formulaStr);
  config.formulaParser = peg.generate(formulaStr);
  /*
    console.log(config.formulaParser.parse('10 mod 4'));
    console.log(config.formulaParser.parse('mod [10][4]'));
    console.log(config.formulaParser.parse('not 4'));
    console.log(config.formulaParser.parse('not [10]'));
    //console.log(config.formulaParser.parse("A``'"));
  */
  let statementStr = getStatementStr(funcStr);
  let statementParser = peg.generate(statementStr);
  console.log(statementParser.parse(`A @ A'+1 | A > 0 [0]
  B @ A# 
  C @ B#` + '\n'));
  /*
  console.log(statementParser.parse(`A @ B# + 1 
  +2 | A=B
  [1][B]
  B @ 1` + '\n'));
*/
  function replacer(k, v) {
    if (typeof v === 'function') { return v.toString(); };
    return v;
  }
  function getStatementStr(funcStr) {

    let signed = '\\+\\-';
    let wsp = ' \\t\\n\\r';
    let dash = `"'"`;
    let backdash = "'`'";
    return `

// Simple Arithmetics Grammar
// ==========================
//
{
${funcStr}
}
Statements
= Statement+ 
{
  processStatements();
}

Statement
= _ seq:Sequence _ '@' _ formula:Formula  cond:( _ '|' Condition )? _ argvs:('[' Formula ']' _ )*
{
  let _condStr = '';
  let _cond = [];
  if (cond && cond.length>0) {
    _condStr = cond[2].pop().text;
    _cond = cond[2];
  }
  let _argvsStr = [];
  let _argvs = [];
  for (let ai=0;ai<argvs.length;ai++) {
    _argvsStr.push(argvs[ai][1].pop().text);
    _argvs = _argvs.concat(argvs[ai][1]);
  }
  let condStr = '';
  let argvsStr = '';
  if (_condStr.length>0) {
    condStr = ' | '+_condStr;
  }
  if (_argvsStr.length>0) {
    argvsStr = ' ['+_argvsStr.join('][')+']';
  }
  let text = seq[0].name + ' @ '+ formula.pop().text + condStr + argvsStr;
  processStatement(seq,formula, _cond, _argvs, text);
}

Condition
= head:FuncCondTerm tail:(('and' / 'or') FuncCondTerm)*
{
  let ret = processTail(head, tail);
  ret.push({ text: text() });
  return ret;
}

Formula
= head:FuncTerm tail:(_ ('+' / '-')  FuncTerm)*  
{
  let ret = processTail(head, tail);
  ret.push({ text:text() });
  return ret;
}
/ tail:(_ ('+' / '-') FuncTerm)* 
{
  return processTail(null, tail);
}

FuncCondTerm
= head:Term tail:(_ ('<='/ '<' / '=' / '>=' / '>' / [a-z]+ ) Term)* 
{
  return processTail(head, tail);
}
/ _ op:[a-z]+ _ args:Term 
{
  return args; 
}
/ _ op:[a-z]+ tail:(_ '[' Term ']')* 
{
  return processTail(null, tail);
}

FuncTerm
= head:Term tail:(_ [a-z]+ Term)* 
{
  return processTail(head, tail);
}
/ _ op:[a-z]+ _ args:Term 
{
  return args; 
}
/ _ op:[a-z]+ tail:(_ '[' Term ']')* 
{
  return processTail(null, tail);
}
Term
= head:Factor tail:(_ ('*' / '/') Factor )* 
{
  return processTail(head, tail);
}

Factor
= _ '(' expr:Formula ')' { return expr; }
  / UnsignedNumber
  / SysOperatedDoller
  / SysOperatedHash
  / SysOperatedDash
  / Sequence

SysOperatedDash
= seq:Sequence tail:(_ [${dash}${backdash}] SysIndex*)+ 
{
  return [{
    type: 'seqstart',
    name: seq[0].name,
  }];
}
/ tail:(_ [${dash}${backdash}]  SysIndex*)+ 
{
  return [];
}

SysOperatedDoller
= seq:Sequence _ '$' idx:SysIndex*
{
    return [{
      type: 'seqend',
      name: seq[0].name,
    }]; 
}
/ _ '$' idx:SysIndex*
{
    return [];
}

SysOperatedHash
= seq:Sequence _ '#' idx:SysIndex* 
{
    return [{
      type: 'seqend',
      name: seq[0].name,
    }];
 }
/ _ '#' idx:SysIndex* 
{
    return [];
}

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
= _ seq:[A-Z]+ _ { 
  return [{
    type: 'sequence',
    name: seq.join(''),
  }];
}

UnsignedNumber
= _ $( _UnsignedFloat / _UnsignedInt) _
{
  return [];
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
  function getFormulaStr(funcStr) {
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

Formula
= head:FuncTerm tail:(_ ('+' / '-')  FuncTerm)*  { return processAddSub(head, tail); }
/ tail:(_ ('+' / '-') FuncTerm)* { return processAddSub(0, tail); }


FuncTerm
= head:Term tail:(_ [a-z]+ Term)* { return processFunc(head, tail); }
/ tail:_ op:[a-z]+ _ args:Term { return processFuncEx(op.join(''), null, args); }
/ tail:_ op:[a-z]+ args:(_ '[' Term ']')* { return processFuncEx(op.join(''), 2, args); }

Term
= head:Factor tail:(_ ('*' / '/') Factor )* { return processMulDiv(head, tail); }

Factor
= _ '(' expr:Formula ')' { return expr; }
  / UnsignedNumber
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
