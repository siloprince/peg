'use strict';
let config = {
  state: { 
    self: null,
    now: 0,
  },
  formulaParser: null,
  limit: {
    count: 0,
    values: 10000,
  },
  starts: [],
  constval: 4,
  max: 4,
  iteraita: {},
  decls: [],
  serial: 0,
  depend: {},
};

(function (console, peg) {
  let param = {
    func: function () {
      return test;

      function now() {
        return config.state.now % config.max;
      }
      function getRidx(_ridx) {
        return (_ridx + config.max * 10) % config.max;
        
      }
      function getCidx(obj, _cidx) {
        var cidx = 0;
        if (typeof (_cidx) === 'undefined') {
          cidx = (_cidx + obj.values.length * 10) % obj.values.length;
        }
        return cidx;
      }
      function self() {
        var ret = config.iteraita[config.state.self];
        return ret;
      }
      function val(obj, _cidx, ridx) {
        var cidx = getCidx(obj, _cidx);
        if (typeof (ridx) === 'undefined') {
          return obj.values[cidx][now()];
        }
        if (ridx >= 0) {
          return obj.values[cidx][getRidx(ridx)];
        } else {
          return obj.inits[cidx][getRidx(obj.inits[cidx].length + ridx)];
        }
      }
      function lastval(obj) {
        if (obj.values.length===0) {
          return null;
        } else {
          // TODO: in case of non 0
          let idx = obj.values[0].lastIndexOf(null);
          if (idx===-1) {
            return obj.values[0][obj.values.length-1];
          } else {
            return obj.values[0][idx-1];
          }
        }
      }
      function lastini(obj) {
        if (obj.inits.length===0) {
          return 0;
        } else {
          // TODO: in case of non 0
          let idx = obj.inits[0].indexOf(null);
          if (idx===-1) {
            return obj.inits[0][obj.inits.length-1];
          } else {
            return obj.inits[0][idx-1];
          }
        }
      }
      function ini(obj, _cidx, ridx) {
        var cidx = getCidx(obj, _cidx);
        return obj.inits[cidx][obj.inits[cidx].length - ridx - 1];
      }
      function processAndOr(head, tail) {
        return tail.reduce(function (result, element) {
          if (element[1] === 'and') { return result && element[2]; }
          if (element[1] === 'or') { return result || element[2]; }
        }, head);
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
      function processFuncCond(head, tail) {
        return tail.reduce(function (result, element) {
          let func = element[1];
          // TODO: dynamic func operator
          if (func === '<') { return result < element[2]; }
          if (func === '<=') { return result <= element[2]; }
          if (func === '=') { return result === element[2]; }
          if (func === '>') { return result > element[2]; }
          if (func === '>=') { return result >= element[2]; }
          if (func === '<>') { return result !== element[2]; }
        }, head);
      }
      function processFuncCondEx(func, aidx, _args) {
        let args = [];
        if (aidx === null) {
          args.push(_args);
        } else {
          for (let ai = 0; ai < _args.length; ai++) {
            args.push(_args[ai][aidx]);
          }
        }
        // TODO:
        return 0;
      }
      function processFunc(head, tail) {
        return tail.reduce(function (result, element) {
          let func = element[1].join('');
          // TODO: dynamic func operator
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
        let ridx = now()-(result.dash + hasBackdash);
        return val(seq, cidx, ridx);
      }
      function processHashDoller(seq, idx, op) {
        var arg = idx;
        if (op === '#') {
          if (arg === null) {
            return lastval(seq);
          }
          return val(seq, 0, arg);
        } else {
          if (arg === null) {
            return lastini(seq);
          }
          return ini(seq, 0, arg);
        }
      }
      function processTail(head, tail) {
        let ret = [];
        if (head !== null && typeof(head)!=='undefined') {
          ret = ret.concat(head);
        }
        for (let ti = 0; ti < tail.length; ti++) {
          if (tail[ti][2][0]!== null && typeof(tail[ti][2][0])!=='undefined') {
            ret = ret.concat(tail[ti][2][0]);
          }
        }
        return ret;
      }
      function processStatement(seq, formulaDep, condDep, argvsDepArray, argvsCondDepArray, formulaStr, condStr, argvsStrArray, argvsCondStrArray) {
        let decl = seq[0].name;
        config.decls.push(decl);
        config.iteraita[decl] = {
          inits: [],
          values: [],
          formula: formulaStr,
          condition: condStr,
          argvs: argvsStrArray,
          argvsCondition: argvsCondStrArray,
          formulaDep: formulaDep,
          conditionDep: condDep,
          argvsDep: argvsDepArray,
          argvsConditionDep: argvsCondDepArray,
          sideSequences: [],
        };
        calcDepend(decl, formulaDep, condDep, argvsDepArray,argvsCondDepArray);

        for (let ai = 0; ai < argvsStrArray.length; ai++) {
          let _decl = '_' + config.serial++;
          config.decls.push(_decl);
          config.iteraita[decl].sideSequences.push(_decl);
          // TODO: condDep support, argvsDepArray is always []
          config.iteraita[_decl] = {
            inits: [],
            values: [],
            formula: argvsStrArray[ai],
            condition: argvsCondStrArray[ai],
            argvs: [],
            formulaDep: argvsDepArray[ai],
            conditionDep: argvsCondDepArray[ai],
            argvsDep: null,
            sideSequences: [],
          };
          calcDepend(_decl, argvsDepArray[ai], argvsCondDepArray[ai], null, null);
        }
        return;
        function calcDepend(decl, formulaDep, condDep, argvsDepArray, argvsCondDepArray) {
          let depend = [];
          depend = depend.concat(formulaDep);
          if (condDep) {
            depend = depend.concat(condDep);
          }
          if (argvsDepArray) {
            for (let ai = 0; ai < argvsDepArray.length; ai++) {
              depend = depend.concat(argvsDepArray[ai]);
            }
          }
          if (argvsCondDepArray) {
            for (let ai = 0; ai < argvsCondDepArray.length; ai++) {
              depend = depend.concat(argvsCondDepArray[ai]);
            }
          }
          for (let di = 0; di < depend.length; di++) {
            if (!('name' in depend[di])) {
              continue;
            }
            let name = depend[di].name;
            if (name !== decl) {
              if (!(decl in config.depend)) {
                config.depend[decl] = {};
              }
              if (!(name in config.depend[decl])) {
                config.depend[decl][name] = 0;
              }
              if (depend[di].type === 'seqend') {
                config.depend[decl][name] = Math.max(config.depend[decl][name], config.max);
              } else {
                config.depend[decl][name] = Math.max(0, config.depend[decl][name]);
              }
            }
          }
        }
      }
      function processStatements() {
        setStart(config.decls, config.depend, config.starts);
        run();
        console.log(config.iteraita);
        return;
      }
      function run(_limit) {
        if (_limit) {
          config.limit.value = _limit;
        }
        config.limit.count = 0;
        let max = 0;
        for (let sk in config.starts) {
          max = Math.max(max, config.starts[sk]);
        }
        // main loop
        max += config.max;
        for (let i = 0; i < max + config.max; i++) {
          config.state.now = i%max;
          for (let di = 0; di < config.decls.length; di++) {
            let decl = config.decls[di];
            config.state.self = decl;
            let iter = config.iteraita[decl];
            let argvs = iter.argvs;
            let argvsDep = iter.argvsDep;
            if (config.starts[decl] <= i && i <= config.starts[decl] + config.max - 1) {
              if (config.starts[decl] === i) {
                let sideArray = [];
                let minSides = 0;
                let constarg = true;
                for (let ai = 0; ai < argvs.length; ai++) {
                  if (argvsDep[ai].length === 0) {
                    let str = argvs[ai];
                    let evaled = config.formulaParser.parse(str);
                    sideArray.push([evaled]);
                  } else {
                    constarg = false;
                    let _decl = config.iteraita[decl].sideSequences[ai];
                    let tmp = [];
                    for (let ii = 0; ii < config.iteraita[_decl].values.length; ii++) {
                      tmp = tmp.concat(config.iteraita[_decl].values[ii]);
                    }
                    if (minSides) {
                      minSides = Math.min(minSides, tmp.length);
                    } else {
                      minSides = tmp.length;
                    }
                    sideArray.push(tmp);
                  }
                }
                if (constarg) {
                  minSides = 1;
                }
                //console.log(decl + ':' + minSides);
                for (let mi = 0; mi < minSides; mi++) {
                  let tmpargv = [];
                  for (let ai = 0; ai < argvs.length; ai++) {
                    let mod = mi % sideArray[ai].length;
                    tmpargv.push((sideArray[ai][mod]));
                  }
                  if (decl.indexOf('_') !== 0) {
                    appendColumn(iter,tmpargv);
                  } else {
                    let varimax = 1;
                    let varis = [];
                    if (iter.formulaDep && iter.formulaDep.length>0) {
                      varis = varis.concat(iter.formulaDep);
                    }
                    if (iter.conditionDep && iter.conditionDep.length>0) {
                      varis = varis.concat(iter.conditionDep);
                    }
                    if (varis.length>0) {
                      for (let vi = 0; vi < varis.length; vi++) {
                        if ('name' in varis[vi]) {
                          let vari = varis[vi].name;
                          varimax = Math.max(varimax, config.iteraita[vari].values.length);
                        }
                      }
                    }
                    for (let vi = 0; vi < varimax; vi++) {
                      appendColumn(iter,tmpargv);
                    }
                  }
                }
              }
              for (let ii = 0; ii < iter.values.length; ii++) {
                appendRow(iter, ii);
              }
            }
          }
        }
        return;
      }
      function appendColumn(iter, argvs) {
        iter.inits.push(argvs.concat([]));
        iter.values.push([]);
      }
      function appendRow(iter, cidx) {
        if (iter.condition.length>0) {
          let cond = config.formulaParser.parse(iter.condition,{startRule:'Condition'});
          if (!cond) {
            iter.values[cidx].push(null);
            return;
          } 
        }
        let val = config.formulaParser.parse(iter.formula);
        iter.values[cidx].push(val);
      }
      function setStart(decls, depend, starts) {
        // clear
        for (let di = 0; di < decls.length; di++) {
          let decl = decls[di];
          if (decl in starts) {
            delete starts[decl];
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
        let decls = ['A', 'B'];
        let depend = {
          B: { A: 10 }
        };
        setStart(decls, depend, config.starts);
        console.log(config.starts);
      }
    }
  };
  // uncomment for test
  //(param.func())();


  let funcStr = JSON.stringify(param.func, replacer);
  funcStr = funcStr.replace(/^"function \(\) {\\n\s*return test;/, '').replace(/}"$/, '').replace(/\\n/g, '\n');

  let formulaStr = getFormulaStr(funcStr);
  config.formulaParser = peg.generate(formulaStr,{allowedStartRules:['Formula','Condition']});

  function replacer(k, v) {
    if (typeof v === 'function') { return v.toString(); };
    if (typeof v === 'class') { return v.toString(); };
    return v;
  }
  let statementStr = getStatementStr(funcStr);
  let statementParser = peg.generate(statementStr);

/*
  console.log(statementParser.parse(`A @ A'+A'' | 1=1 [0][1]
  B @ A# 
  C @ B#` + '\n'));
*/
console.log(config.starts);
console.log(statementParser.parse(`
A @ ' + 1 [0]
B @ B' + 1 [0]
D @ (D')+1 [0]
E @ (')+1 [0]
F @ -(F')+1 [0]
G @ -(')+1 [0]
`));
  /*
A	 @ '+1 [0]
PA @ 6* ' +  (2*A-1)*(2*A-1)* '' [1] [3]
PB @ 6* ' +  (2*A-1)*(2*A-1)* '' [0] [1]
P @ PA/PB	
H @ 11	
G @ 2* P#/H
CB @ -' * G*G / (2*A * (2*A-1)) [1]
C @ ' + CB [1]
SB @ -(') * G*G / (2*A * (2*A+1)) [G#]
S @ S' + SB [G#]
CN @ 2*C#* ' - ''  [C#] [1]
SN @ 2*C#* ' - '' [S#*(-1)] [0]
L	@ 20
R @ 1

PX @ '-L*(CN) | A <= H*R [0]
PY @ ' + L * SN | A <= H*R [0]

  console.log(statementParser.parse(`A @ B# + 1 
  +2 | A=B
  [1][B]
  B @ 1` + '\n'));
*/

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
= _ seq:Sequence _ '@' _ formula:Formula  cond:( _ '|' Condition )? _ argvs:('[' Formula ( _ '|' Condition )? ']' _ )* 
{
  let _condStr = '';
  let _cond = [];
  if (cond && cond.length>0) {
    _condStr = cond[2].pop().text;
    _cond = cond[2];
  }
  let _argvsStrArray = [];
  let _argvsCondStrArray = [];
  let _argvsArray = [];
  let _argvsCondArray = [];
  for (let ai=0;ai<argvs.length;ai++) {
    _argvsStrArray.push(argvs[ai][1].pop().text);
    _argvsArray.push(argvs[ai][1]);
    if (argvs[ai][2]) {
      _argvsCondStrArray.push(argvs[ai][2][2].pop().text);
      _argvsCondArray.push(argvs[ai][2][2]);
    } else {
      _argvsCondStrArray.push('');
      _argvsCondArray.push([]);
    }
  }
  let _formulaStr = formula.pop().text;
  processStatement(seq,formula, _cond, _argvsArray, _argvsCondArray, _formulaStr, _condStr,_argvsStrArray, _argvsCondStrArray);
}

Condition
= head:FuncCondTerm tail:( _ ('and' / 'or') FuncCondTerm)*
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
  let ret = processTail(null, tail);
  ret.push({ text:text() });
  return ret;
}

FuncCondTerm
= head:Term tail:(_ ('<='/ '<' / '=' / '>=' / '>' / '<>' / [a-z]+ ) Term)+
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
= seq:Sequence _ '$' idx:SysIndex?
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
= seq:Sequence _ '#' idx:SysIndex? 
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
    let backdash = "'\\\`'";
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


Condition
= head:FuncCondTerm tail:(('and' / 'or') FuncCondTerm)*
{
  return processAndOr(head, tail);
}

FuncCondTerm
= head:Term tail:(_ ('<='/ '<' / '=' / '>=' / '>' / [a-z]+ ) Term)+
{
  let ret = processFuncCond(head, tail);
  return ret;
}
/ _ op:[a-z]+ _ args:Term 
{
  return processFuncCondEx(op.join(''), null, args);
}
/ _ op:[a-z]+ tail:(_ '[' Term ']')* 
{
  return processFuncCondEx(op.join(''),2, tail);
}

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
= seq:Sequence _ op:'$' idx:SysIndex? { return processHashDoller (seq, idx, op); }
/ _ op:'$' idx:SysIndex* { return processHashDoller (self(), idx, op); }

SysOperatedHash
= seq:Sequence _ op:'#' idx:SysIndex? { return processHashDoller (seq, idx, op); }
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
= _ seq:[A-Z]+ _ { return config.iteraita[seq.join('')];}

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
    ? { generate: function () { return require("pegjs"); } }
    : peg
  );
