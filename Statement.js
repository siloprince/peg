'use strict';
let config = {
  state: {
    self: null,
    now: 0,
    here: 0,
    serial: 0,
  },
  parser: {
    mode: false,
    formula: null
  },
  limit: {
    count: 0,
    values: 10000,
  },
  starts: [],
  constval: 4,
  max: 4,
  iteraita: {},
  decls: [],
  depend: {},
  preprocess: function (str) {
    return str.trim();
  }
};

(function (console, peg) {
  let param = {
    func: function () {
      return test;

      function now() {
        return config.state.now % config.max;
      }
      function here() {
        return config.state.here;
      }
      function getRidx(_ridx) {
        return (_ridx + config.max * 10) % config.max;

      }
      function getCidx(obj, _cidx) {
        var cidx = _cidx;
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
        if (obj.values.length === 0) {
          return null;
        } else {
          let here = 0;
          let idx = obj.values[here].lastIndexOf(null);
          if (idx === -1) {
            return obj.values[here][obj.values.length - 1];
          } else {
            return obj.values[here][idx - 1];
          }
        }
      }
      function lastini(obj) {
        if (obj.inits.length === 0) {
          return 0;
        } else {
          let here = here();
          let idx = obj.inits[here].indexOf(null);
          if (idx === -1) {
            return obj.inits[here][obj.inits.length - 1];
          } else {
            return obj.inits[here][idx - 1];
          }
        }
      }
      function ini(obj, _cidx, ridx) {
        var cidx = getCidx(obj, _cidx);
        return obj.inits[cidx][ridx];
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
        let ridx = now() - (result.dash + hasBackdash);
        return val(seq, cidx, ridx);
      }
      function processHashDoller(seq, idx, op) {
        var arg = idx;
        if (op === '#') {
          if (arg === null) {
            return lastval(seq);
          }
          return val(seq, here(), arg);
        } else {
          if (arg === null) {
            return lastini(seq);
          }
          return ini(seq, here(), arg);
        }
      }
      function processTail(head, tail) {
        let ret = [];
        if (head !== null && typeof (head) !== 'undefined') {
          ret = ret.concat(head);
        }
        for (let ti = 0; ti < tail.length; ti++) {
          for (let tj = 0; tj < tail[ti][2].length; tj++) {
            if (tail[ti][2][tj] !== null && typeof (tail[ti][2][tj]) !== 'undefined') {
              ret = ret.concat(tail[ti][2][tj]);
            }
          }
        }
        return ret;
      }

      function processStatement(seq, form, formcond, argvs) {
        if (config.parser.mode) {
          return;
        }
        let _formulaStrArray = [form.pop().text];
        let _formulaArray = [form];
        let _condStrArray = [];
        let _condArray = [];
        if (formcond) {
          for (let fi = 0; fi < formcond.length; fi++) {
            let _formcond = formcond[fi];
            let cond1 = _formcond[2];
            if (cond1 && cond1.length > 0) {
              _condStrArray.push(cond1.pop().text);
              _condArray.push(cond1);
            }
            let more = _formcond[3];
            if (more && more.length > 0) {
              let morecond = more[1];
              let formula = more[0];
              if (morecond && morecond.length > 0) {
                let cond2 = morecond[2];
                _formulaStrArray.push(formula.pop().text);
                _formulaArray.push(formula);

                let _cond2Str = '';
                let _cond2 = [];
                if (cond2 && cond2.length > 0) {
                  _cond2Str = cond2[2].pop().text;
                  _cond2 = cond2[2];
                }
                _condStrArray.push(_cond2Str);
                _condArray.push(_cond2);
              }
            }
          }
        }
        let _argvsStrArray = [];
        let _argvsCondStrArray = [];
        let _argvsArray = [];
        let _argvsCondArray = [];
        let formIdx = 2;
        let condIdx = 3;
        let condPlus = 2;
        for (let ai = 0; ai < argvs.length; ai++) {
          _argvsStrArray.push(argvs[ai][formIdx].pop().text);
          _argvsArray.push(argvs[ai][formIdx]);
          if (argvs[ai][condIdx]) {
            _argvsCondStrArray.push(argvs[ai][condIdx][condPlus].pop().text);
            _argvsCondArray.push(argvs[ai][condIdx][condPlus]);
          } else {
            _argvsCondStrArray.push('');
            _argvsCondArray.push([]);
          }
        }
        processStatementSub(seq, _formulaArray, _condArray, _argvsArray, _argvsCondArray, _formulaStrArray, _condStrArray, _argvsStrArray, _argvsCondStrArray);
      }
      function processStatementSub(seq, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray, formulaStrArray, condStrArray, argvsStrArray, argvsCondStrArray) {
        let decl = seq[0].name;
        config.decls.push(decl);
        config.iteraita[decl] = {
          inits: [],
          values: [],
          formula: formulaStrArray[0],
          condition: condStrArray[0],
          argvs: argvsStrArray,
          argvsCondition: argvsCondStrArray,
          formulaDep: formulaDepArray[0],
          conditionDep: condDepArray[0],
          argvsDep: argvsDepArray,
          argvsConditionDep: argvsCondDepArray,
          sideSequences: [],
        };
        calcDepend(decl, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray);
        for (let ai = 0; ai < argvsStrArray.length; ai++) {
          let constargv = true;
          for (let aj = 0; aj < argvsDepArray[ai].length; aj++) {
            if (argvsDepArray[ai][aj].type === 'seqend_variargv') {
              constargv = false;
            }
          }
          for (let ak = 0; ak < argvsCondDepArray[ai].length; ak++) {
            if (argvsCondDepArray[ai][ak].type === 'seqend_variargv') {
              constargv = false;
            }
          }
          if (constargv) {
            continue;
          }
          let _decl = '_' + config.state.serial++;
          for (let aj = 0; aj < argvsDepArray[ai].length; aj++) {
            if (argvsDepArray[ai][aj].type === 'seqend_variargv') {
              config.iteraita[decl].argvsDep.push([{ name: _decl, type: 'seqend_variargv' }]);
              break;
            }
          }
          for (let ak = 0; ak < argvsCondDepArray[ai].length; ak++) {
            if (argvsCondDepArray[ai][ak].type === 'seqend_variargv') {
              config.iteraita[decl].argvsCondDep.push([{ name: _decl, type: 'seqend_variargv' }]);
              break;
            }
          }
          config.decls.push(_decl);
          config.iteraita[decl].sideSequences.push(_decl);
          // TODO: condDep support, argvsDepArray is always []
          config.iteraita[_decl] = {
            inits: [],
            values: [],
            formula: [argvsStrArray[ai]][0],
            condition: [argvsCondStrArray[ai]][0],
            argvs: [],
            formulaDep: [argvsDepArray[ai]][0],
            conditionDep: [argvsCondDepArray[ai]][0],
            argvsDep: null,
            sideSequences: [],
          };
          calcDepend(_decl, argvsDepArray[ai], argvsCondDepArray[ai], null, null);
        }
        // recalculate
        calcDepend(decl, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray);

        return;
        function calcDepend(decl, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray) {
          let depend = [];
          for (let fi = 0; fi < formulaDepArray.length; fi++) {
            depend = depend.concat(formulaDepArray[fi]);
          }
          if (condDepArray) {
            for (let ci = 0; ci < condDepArray.length; ci++) {
              depend = depend.concat(condDepArray[ci]);
            }
          }
          if (argvsDepArray) {
            for (let ai = 0; ai < argvsDepArray.length; ai++) {
              for (let aj = 0; aj < argvsDepArray[ai].length; aj++) {
                if ('type' in argvsDepArray[ai][aj]) {
                  // force seqend in case of argvs
                  if (argvsDepArray[ai][aj].type === 'seqend') {
                    argvsDepArray[ai][aj].type = 'seqend_constargv';
                  } else {
                    argvsDepArray[ai][aj].type = 'seqend_variargv';
                  }
                  depend.push(argvsDepArray[ai][aj]);
                }
              }
            }
          }
          if (argvsCondDepArray) {
            for (let ai = 0; ai < argvsCondDepArray.length; ai++) {
              for (let aj = 0; aj < argvsCondDepArray[ai].length; aj++) {
                if ('type' in argvsCondDepArray[ai][aj]) {
                  // force seqend in case of argvs
                  if (argvsCondDepArray[ai][aj].type === 'seqend') {
                    argvsCondDepArray[ai][aj].type = 'seqend_constargv';
                  } else {
                    argvsCondDepArray[ai][aj].type = 'seqend_variargv';
                  }
                  depend.push(argvsCondDepArray[ai][aj]);
                }
              }
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
              if (depend[di].type.indexOf('seqend') === 0) {
                config.depend[decl][name] = Math.max(config.depend[decl][name], 1);
              } else {
                config.depend[decl][name] = Math.max(0, config.depend[decl][name]);
              }
            }
          }
        }
      }
      function processStatements() {
        setStart(config.decls, config.depend, config.starts);
        run(10);
        console.log(config.iteraita);
        return;
      }
      function run(_max, _limit) {
        if (_limit) {
          config.limit.value = _limit;
        }
        if (_max) {
          config.max = _max;
        }
        config.limit.count = 0;
        let max = 0;
        for (let sk in config.starts) {
          max = Math.max(max, config.starts[sk]);
        }
        // main loop
        max = (max + 1) * config.max;
        for (let i = 0; i < max + config.max; i++) {
          config.state.now = i % max;
          for (let di = 0; di < config.decls.length; di++) {
            let decl = config.decls[di];
            config.state.self = decl;
            let iter = config.iteraita[decl];
            let argvs = iter.argvs;
            let start = config.starts[decl] * config.max;
            if (start <= i && i <= start + config.max - 1) {
              if (start === i) {
                let sideArray = [];
                let minSides = 0;
                let constargv = true;
                for (let ai = 0; ai < argvs.length; ai++) {
                  if (!(ai in config.iteraita[decl].sideSequences)) {
                    let str = argvs[ai];
                    config.parser.mode = true;
                    let evaled = config.parser.formula.parse(config.preprocess(str));
                    config.parser.mode = false;
                    sideArray.push([evaled]);
                  } else {
                    constargv = false;
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

                    //console.log(decl + '::' + _decl + ':' + minSides);
                  }
                }
                if (constargv) {
                  minSides = 1;
                }
                for (let mi = 0; mi < minSides; mi++) {
                  let tmpargv = [];
                  for (let ai = 0; ai < argvs.length; ai++) {
                    let mod = mi % sideArray[ai].length;
                    tmpargv.push((sideArray[ai][mod]));
                  }
                  if (decl.indexOf('_') !== 0) {
                    appendColumn(iter, tmpargv);
                  } else {
                    let varimax = 1;
                    let varis = [];
                    if (iter.formulaDep && iter.formulaDep.length > 0) {
                      varis = varis.concat(iter.formulaDep);
                    }
                    if (iter.conditionDep && iter.conditionDep.length > 0) {
                      varis = varis.concat(iter.conditionDep);
                    }
                    if (varis.length > 0) {
                      for (let vi = 0; vi < varis.length; vi++) {
                        if ('name' in varis[vi]) {
                          let vari = varis[vi].name;
                          varimax = Math.max(varimax, config.iteraita[vari].values.length);
                        }
                      }
                    }
                    for (let vi = 0; vi < varimax; vi++) {
                      appendColumn(iter, tmpargv);
                    }
                  }
                }
              }
              for (let ii = 0; ii < iter.values.length; ii++) {
                config.state.here = ii;
                appendRow(iter, ii);
              }
              config.state.here = 0;
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
        if (iter.condition && iter.condition.length > 0) {
          config.parser.mode = true;
          let cond = config.parser.formula.parse(config.preprocess(iter.condition), { startRule: 'Condition' });
          config.parser.mode = false;
          if (!cond) {
            iter.values[cidx].push(null);
            return;
          }
        }
        config.parser.mode = true;
        let val = config.parser.formula.parse(config.preprocess(iter.formula), { startRule: 'Formula' });
        config.parser.mode = false;
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
      /*
      function test() {
        let decls = ['LINE','A', 'C', 'S', 'G', 'SB', 'CB', 'CN', 'SN', 'H', 'L', 'R', 'P', 'PA', 'PB', 'PX', 'PY', '_0', '_1','_2','_3'];
        let depend = { 
         "PA": { "A": 0 },
         "PB": { "A": 0 }, 
         "P": { "PA": 0, "PB": 0 }, 
         "G": { "P": 4, "H": 0 }, 
         "CB": { "G": 0, "A": 0 }, 
         "C": { "CB": 0 }, 
         "SB": { "G": 4, "A": 0 }, 
         "S": { "SB": 0, "G": 4 }, 
         "CN": { "C": 4 }, 
         "SN": { "C": 4, "S": 4 }, 
         "PX": { "L": 0, "CN": 0, "A": 0, "H": 0, "R": 0 }, 
         "PY": { "L": 0, "SN": 0, "A": 0, "H": 0, "R": 0 }, 
         "LINE": { "A": 0, "PX": 4, "PY": 4, "_0": 4, "_1": 4, "_2": 4, "_3": 4  }, 
         "_0": { "PX": 4 }, 
         "_1": { "PY": 4 }, 
         "_2": { "PX": 4 }, 
         "_3": { "PY": 4 } 
        };
        setStart(decls, depend, config.starts);
        console.log(config.starts);
      }
      */
    }
  };
  // uncomment for test
  //(param.func())();


  let funcStr = JSON.stringify(param.func, replacer);
  funcStr = funcStr.replace(/^"function \(\) {\\n\s*return test;/, '').replace(/}"$/, '').replace(/\\n/g, '\n');

  function replacer(k, v) {
    if (typeof v === 'function') { return v.toString(); };
    if (typeof v === 'class') { return v.toString(); };
    return v;
  }
  let statementStr = getStatementStr(funcStr);
  let statementParser = peg.generate(statementStr);
  config.parser.formula = peg.generate(statementStr, { allowedStartRules: ['Formula', 'Condition'] });

  /*
    console.log(statementParser.parse(`A @ A'+A'' | 1=1 [0][1]
    B @ A# 
    C @ B#` + '\n'));
  */
  config.parser.mode = false;
  statementParser.parse(config.preprocess(`
A	 @ '+1 [0]
PA @ 6* ' +  (2*A-1)*(2*A-1)* '' [1] [3]
PB @ 6* ' +  (2*A-1)*(2*A-1)* '' [0] [1]
P @ PA/PB	
H @ 11	
G @ 2* P#/H
CB @ -' * G*G / (2*A * (2*A-1)) [1]
C @ ' + CB [1]
SB @ -2*' * G*G / (2*A * (2*A+1)) [G#]
S @ S' + SB [G#]
CN @ 2*C#* ' - '' [C#][0]
SN @ 2*C#* ' - '' [-S#] [0]
L	@ 20
R @ 1
PX @ '-L* CN | A <= H*R [0]
PY @ ' + L * SN | A <= H*R [0]
LINE @$1 [PX'][PY'][PX][PY]
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
SB @ -2*' * G*G / (2*A * (2*A+1)) [G#]
S @ S' + SB [G#]
CN @ 2*C#* ' - '' [C#][0]
SN @ 2*C#* ' - '' [-S#] [0]
L	@ 20
R @ 1
PX @ '-L* CN | A <= H*R [0]
PY @ ' + L * SN | A <= H*R [0]
LINE @ 

$3+1-($3 mod 1) | 

    ((
      (
        ($0-$2)*($0-$2)<0.0001
      ) 
      and 
      (
        A=($2+1-(($2+1) mod 1))
      )
    )
   or
  ( 
    (($1-$3)*($1-$3)<0.0001)
    and 
    ((A-$2-1+(($2+1) mod 1))*(A-$0+($0 mod 1))<=0)
  )   
    )

$3+($1-$3)/($0-$2)*(A-$2-1+(($2+1) mod 1))+1-(($3+($1-$3)/($0-$2)*(A-$2-1+(($2+1) mod 1))) mod 1) 
  |
(
 (
   ($0-$2)*($0-$2)>=0.0001)
  and 
  ((A-$2-1+(($2+1) mod 1))*(A-$0+($0 mod 1))<=0)
)
or
( 
  (($1-$3)*($1-$3)<0.0001)
  and 
  ((A-$2-1+(($2+1) mod 1))*(A-$0+($0 mod 1))<=0)
)
 [PX'][PY'][PX][PY]

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
/*
TODO:
* multiple duplicate names
*/
Statements
= (Statement)+ 
{
  if (config.parser.mode) {
    return;
  }
  processStatements();
}

/* 
TODO: 
* multiple Conditions
* Conditions without expr
* function and operator definition with {}
 A ( _ '|' B  ( C _ '|' D )* )?

*/
Statement
= seq:Sequence _ '@' form:Formula formcond:( _ '|' Condition? ( Formula ( _ '|' Condition? )? )* )? argvs:( _ '[' Formula ( _ '|' Condition? ( Formula ( _ '|' Condition? )? )* )? _ ']' )*
{
  processStatement(seq,form,formcond,argvs);
}

Condition
= head:FuncCondTerm tail:( _ ('and' / 'or') FuncCondTerm)*
{
  if (config.parser.mode) {
    return processAndOr(head, tail);
  } else {
    let ret = processTail(head, tail);
    ret.push({ text: text() });
    return ret;
  }
}

Formula
= head:FuncTerm tail:( _ ('+' / '-')  FuncTerm)*
{
  if (config.parser.mode) {
    return processAddSub(head, tail);
  } else {
    let ret = processTail(head, tail);
    ret.push({ text:text() });
    return ret;
  }
}
/ tail:( _ ('+' / '-') FuncTerm)+
{
  if (config.parser.mode) {
    return processAddSub(0, tail);
  } else {
    let ret = processTail(null, tail);
    ret.push({ text:text() });
    return ret;
  }
}


FuncCondTerm
= _ '(' cond:Condition _ ')'
{
  return cond;
}
/ cond:FuncCondTermSub
{
  return cond;
}

FuncCondTermSub
= head:Term tail:(_ ('<='/ '<' / '=' / '>=' / '>' / '<>' / [a-z]+ ) Term)+
{
  if (config.parser.mode) {
    let ret = processFuncCond(head, tail);
    return ret;
  } else {
    return processTail(head, tail);
  }
}
/ _ op:[a-z]+ args:Term 
{
  if (config.parser.mode) {
    return processFuncCondEx(op.join(''), null, args);
  } else {
    return args; 
  }
}
/ _ op:[a-z]+ tail:( _ '[' Term _ ']')+ 
{
  if (config.parser.mode) {
    return processFuncCondEx(op.join(''),2, tail);
  } else { 
    return processTail(null, tail);
  }
}

FuncTerm
= head:Term tail:( _ [a-z]+ Term)*
{
  if (config.parser.mode) {
    return processFunc(head, tail);
  } else {
    return processTail(head, tail);
  }
}
/ _ op:[a-z]+ args:Term 
{
  if (config.parser.mode) {
    return processFuncEx(op.join(''), null, args);
  } else { 
    return args; 
  }
}
/ _ op:[a-z]+ tail:( _ '{' Term _ '}')+
{
  if (config.parser.mode) {
    return processFuncEx(op.join(''), 2, args);
  } else {
    return processTail(null, tail);
  }
}

Term
= head:Factor tail:( _ ('*' / '/') Factor )* 
{
  if (config.parser.mode) {
    return processMulDiv(head, tail);
  } else {
    return processTail(head, tail);
  }
}

Factor
= _ '(' expr:Formula _ ')' { return expr; }
  / UnsignedNumber
  / SysOperatedDoller
  / SysOperatedHash
  / SysOperatedDash
  / seq:Sequence
  {
    if (config.parser.mode) {
      return val(seq,here(),now());
    } else {
      return seq;
    }
  }

SysOperatedDash
= seq:Sequence tail:( _ [${dash}${backdash}] SysIndex*)+ 
{
  if (config.parser.mode) {
    return processDash (seq,tail);
  } else { 
    return [{
      type: 'seqstart',
      name: seq[0].name,
    }];
  }
}
/ tail:( _ [${dash}${backdash}]  SysIndex*)+ 
{
  if (config.parser.mode) {
    return processDash (self(),tail);
  } else {
    return [];
  }
}

SysOperatedDoller
= seq:Sequence _ op:'$' idx:SysIndex?
{
  if (config.parser.mode) {
    return processHashDoller (seq, idx, op);
  } else {
    return [{
      type: 'seqend',
      name: seq[0].name,
    }]; 
  }
}
/ _ op:'$' idx:SysIndex*
{
  if (config.parser.mode) {
    return processHashDoller (self(), idx, op);
  } else {
    return [];
  }
}

SysOperatedHash
= seq:Sequence _ op:'#' idx:SysIndex? 
{
  if (config.parser.mode) {
    return processHashDoller (seq, idx, op);
  } else {
    return [{
      type: 'seqend',
      name: seq[0].name,
    }];
  }
}
/ _ op:'#' idx:SysIndex* 
{
  if (config.parser.mode) {
    return processHashDoller (self(), idx, op);
  } else {
    return [];
  }
}

SysIndex
= _ '{' signed:SignedInt _ '}'
{
  return parseInt(signed,10);
}
/ _ unsinged:_UnsignedInt
{
  return parseInt(unsinged,10);
}

Sequence 
= _ seq:[A-Z]+ { 
  if (config.parser.mode) {
    return config.iteraita[seq.join('')];
  } else { 
    return [{
      type: 'sequence',
      name: seq.join(''),
    }];
  }
}

UnsignedNumber
= _ $( _UnsignedFloat / _UnsignedInt)
{
  if (config.parser.mode) {
    return parseFloat(text());
  } else {
    return [];
  }
}

_UnsignedFloat
= _UnsignedInt '.' [0-9]*
/ '.' [0-9]+

SignedInt
= _ [${signed}] _UnsignedInt
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
