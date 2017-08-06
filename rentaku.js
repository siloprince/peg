'use strict';
var global = Function('return this')();
global.rentaku = {
  '_': null,
  debug: true,
  parser: {
    statement: null,
    formula: null
  },
};
//try {
(function (console, peg, srcStr) {
  rentaku.sample = srcStr;
  rentaku.clear = clear;

  function clear() {
    rentaku._ = {
      state: {
        self: null,
        now: 0,
        here: 0,
        what: 0,
        serial: 0,
        decl_serial: {},
        mode: false, // TODO: add more modes : preprocess interpretor
      },
      limit: {
        count: 0,
        values: 10000,
      },
      orders: [],
      starts: [],
      constval: 4,
      max: 10,
      iteraitas: {},
      decls: [],
      dependOrder: {},
      depend: {},
      magic: '_',
      preprocess: function (str) {
        return str.trim();
      }
    };
  }

  let param = {
    func: function () {
      return test;

      function now() {
        return rentaku._.state.now % rentaku._.max;
      }
      function here() {
        return rentaku._.state.here;
      }
      function what() {
        return rentaku._.state.what;
      }
      function getRidx(_ridx) {
        return (_ridx + rentaku._.max * 10) % rentaku._.max;
      }
      function getCidx(iters, _cidx) {
        var cidx = _cidx;
        if (typeof (_cidx) === 'undefined') {
          cidx = here();
        } else {
          cidx = (_cidx + iters.length * 10) % iters.length;
        }
        return cidx;
      }
      function self() {
        var ret = rentaku._.iteraitas[rentaku._.state.self][here()];
        return ret;
      }
      // called by run
      function one(value) {
        if (!value) {
          return null;
        }
        for (let vi = 0; vi < value.length; vi++) {
          if (typeof value[vi] !== 'undefined' && value[vi] !== null) {
            return value[vi];
          }
        }
        return null;
      }
      // called by parser
      function val(iter, _cidx, ridx) {
        var iters = rentaku._.iteraitas[iter.label];
        var cidx = getCidx(iters, _cidx);
        if (typeof (ridx) === 'undefined') {
          return one(iters[cidx].values[now()]);
        }
        if (ridx >= 0) {
          return iters[cidx].values[getRidx(ridx)][what()];
        } else {
          return iters[cidx].inits[getRidx(iters[cidx].inits.length + ridx)];
        }
      }
      // called by parser
      function lastval(iter) {
        if (iter.values.length === 0) {
          return null;
        } else {
          let here = 0;
          let idx = iter.values.indexOf(null);
          if (idx === -1) {
            return iter.values[iter.values.length - 1][what()];
          } else {
            return iter.values[idx - 1][what()];
          }
        }
      }
      // called by run
      function vallen(iter) {
        if (iter.values.length === 0) {
          return 0;
        } else {
          let here = 0;
          // TODO: ones
          let ones = [];
          for (let vi = 0; vi < iter.values.length; vi++) {
            ones.push(one(iter.values[vi]));
          }
          let idx = ones.indexOf(null);
          if (idx === -1) {
            return ones.length;
          } else {
            return idx;
          }
        }
      }
      // called by run
      function inilen(iter) {
        if (iter.inits.length === 0) {
          return 0;
        } else {
          let idx = iter.inits.indexOf(null);
          if (idx === -1) {
            return iter.inits.length;
          } else {
            return idx;
          }
        }
      }
      // called by parser
      function lastini(iter) {
        if (iter.inits.length === 0) {
          return 0;
        } else {
          let idx = iter.inits.indexOf(null);
          if (idx === -1) {
            return iter.inits[iter.inits.length - 1];
          } else {
            return iter.inits[idx - 1];
          }
        }
      }
      // called by parser
      function ini(iter, _cidx, ridx) {
        var iters = rentaku._.iteraitas[iter.label];
        var cidx = getCidx(iters, _cidx);
        return iters[cidx].inits[ridx];
      }
      function processAndOr(head, tail) {
        return tail.reduce(function (result, element) {
          if (element[1] === ',') { return result && element[3]; }
          if (element[1] === 'and') { return result && element[3]; }
          if (element[1] === 'or') { return result || element[3]; }
        }, head);
      }
      function processAddSub(head, tail) {
        return tail.reduce(function (result, element) {
          if (element[1] === '+') {
            return result + element[3];
          }
          if (element[1] === '-') { return result - element[3]; }
        }, head);
      }
      function processMulDiv(head, tail) {
        return tail.reduce(function (result, element) {
          if (Array.isArray(element[1])) {
            element[1] = '*';
          }
          if (element[1] === '*') { return result * element[3]; }
          if (element[1] === '/') { return result / element[3]; }
        }, head);
      }
      function processFuncCond(head, tail) {
        return tail.reduce(function (result, element) {
          let func = element[1];
          // TODO: dynamic func operator
          if (func === '<') { return result < element[3]; }
          if (func === '<=') { return result <= element[3]; }
          if (func === '=') { return result === element[3]; }
          if (func === '>') { return result > element[3]; }
          if (func === '>=') { return result >= element[3]; }
          if (func === '<>') { return result !== element[3]; }
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
          let func = element[1];
          // TODO: dynamic func operator
          if (func === '%' || func === 'mod') {
            return result % element[3];
          }
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
          var op = element[0];
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
        let cidx = here() - (result.backdash);
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
          for (let tj = 0; tj < tail[ti][3].length; tj++) {
            if (tail[ti][3][tj] !== null && typeof (tail[ti][3][tj]) !== 'undefined') {
              ret = ret.concat(tail[ti][3][tj]);
            }
          }
        }
        return ret;
      }
      function processArgvs(argvs) {
        if (rentaku._.state.mode) {
          return;
        }
        // =argvs:( _ '[' Formula ( _ '|' Condition? ( Formula ( _ '|' Condition? )? )* )? _ ']' )
        // =argvs:( _ '[' _ Formula ( _ '|' _ Condition? ( _ Formula ( _ '|' _ Condition? )? )* )? _ ']' )

        let _argvsStr = null;
        let _argvsCondStr = null;
        let _argvs = null;
        let _argvsCond = null;
        let formIdx = 3;
        let condIdx = 4;
        let condPlus = 3;
        _argvsStr = argvs[formIdx].pop().text;
        _argvs = argvs[formIdx];
        if (argvs[condIdx]) {
          _argvsCondStrArray = argvs[condIdx][condPlus].pop().text;
          _argvsCondArray = argvs[condIdx][condPlus];
        } else {
          _argvsCondStr = '';
          _argvsCond = [];
        }

        return [
          _argvs, _argvsCond, _argvsStr, _argvsCondStr
        ];
      }
      function processStatement(seq, form, formcond, argvs) {
        if (rentaku._.state.mode) {
          return;
        }
        let lastFormStr = JSON.stringify(form);
        let _formulaStrArray = [form.pop().text];

        let _formulaArray = [form];
        let _condStrArray = [];
        let _condArray = [];
        if (formcond) {
          let cond1 = formcond[2];
          if (cond1 && cond1.length > 0) {
            _condStrArray.push(cond1.pop().text);
            _condArray.push(cond1);
          }
          let more = formcond[3];
          if (more && more.length > 0) {
            for (let mi = 0; mi < more.length; mi++) {
              let formula = more[mi][0];
              if (formula === null) {
                formula = JSON.parse(lastFormStr);
              }
              _formulaStrArray.push(formula.pop().text);
              _formulaArray.push(formula);
              let morecond = more[mi][3];
              if (morecond) {
                _condStrArray.push(morecond.pop().text);
                _condArray.push(morecond);
              }
            }
          }
          let lastformula = formcond[4];
          if (lastformula) {
            _formulaStrArray.push(lastformula.pop().text);
            _formulaArray.push(lastformula);
          }
        }
        let _argvsArray = [];
        let _argvsCondArray = [];
        let _argvsStrArray = [];
        let _argvsCondStrArray = [];
        for (let ai = 0; ai < argvs.length; ai++) {
          _argvsArray.push(argvs[ai][0]);
          _argvsCondArray.push(argvs[ai][1]);
          _argvsStrArray.push(argvs[ai][2]);
          _argvsCondStrArray.push(argvs[ai][3]);
        }
        /*
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
        */
        let declLabel = seq[0].name;
        if (!(declLabel in rentaku._.state.decl_serial)) {
          rentaku._.state.decl_serial[declLabel] = -1;
          rentaku._.iteraitas[declLabel] = [];
        }
        processStatementSub(declLabel,
          _formulaArray, _condArray, _argvsArray, _argvsCondArray,
          _formulaStrArray, _condStrArray, _argvsStrArray, _argvsCondStrArray);
      }
      function processStatementSub(declLabel, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray, formulaStrArray, condStrArray, argvsStrArray, argvsCondStrArray) {
        rentaku._.state.decl_serial[declLabel]++;
        let decl = declLabel + rentaku._.magic + rentaku._.state.decl_serial[declLabel];
        rentaku._.decls.push(decl);
        let iter = {
          label: declLabel,
          name: decl,
          inits: [],
          values: [],
          formula: formulaStrArray,
          condition: condStrArray,
          argvs: argvsStrArray,
          argvsCondition: argvsCondStrArray,
          formulaDep: formulaDepArray,
          conditionDep: condDepArray,
          argvsDep: argvsDepArray,
          argvsConditionDep: argvsCondDepArray,
          sideSequences: [],
        };
        rentaku._.iteraitas[declLabel].unshift(iter);
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
          let _decl = rentaku._.magic + rentaku._.state.serial++;
          rentaku._.state.decl_serial[_decl] = 0;
          for (let aj = 0; aj < argvsDepArray[ai].length; aj++) {
            if (argvsDepArray[ai][aj].type === 'seqend_variargv') {
              iter.argvsDep.push([{ name: _decl, type: 'seqend_variargv' }]);
              break;
            }
          }
          for (let ak = 0; ak < argvsCondDepArray[ai].length; ak++) {
            if (argvsCondDepArray[ai][ak].type === 'seqend_variargv') {
              iter.argvsCondDep.push([{ name: _decl, type: 'seqend_variargv' }]);
              break;
            }
          }
          rentaku._.decls.push(_decl);
          iter.sideSequences.push(_decl);
          // TODO: condDep support, argvsDepArray is always []
          rentaku._.iteraitas[_decl] = [{
            label: _decl,
            name: _decl,
            inits: [],
            values: [],
            formula: [argvsStrArray[ai]],
            condition: [argvsCondStrArray[ai]],
            argvs: [],
            formulaDep: [argvsDepArray[ai]],
            conditionDep: [argvsCondDepArray[ai]],
            argvsDep: null,
            sideSequences: [],
          }];
          calcDepend(_decl, argvsDepArray[ai], argvsCondDepArray[ai], null, null);
        }
        // recalculate
        calcDepend(decl, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray);
        return;
        function calcDepend(decl, formulaDepArray, condDepArray, argvsDepArray, argvsCondDepArray) {
          let depend = [];
          for (let fi = 0; fi < formulaDepArray.length; fi++) {
            if (formulaDepArray[fi]) {
              depend = depend.concat(formulaDepArray[fi]);
            }
          }
          if (condDepArray) {
            for (let ci = 0; ci < condDepArray.length; ci++) {
              if (condDepArray[ci]) {
                depend = depend.concat(condDepArray[ci]);
              }
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
            let declLabel = parseDecl(decl)[0];
            if (name !== declLabel) {
              if (!(decl in rentaku._.depend)) {
                rentaku._.depend[decl] = {};
              }
              if (!(decl in rentaku._.dependOrder)) {
                rentaku._.dependOrder[decl] = {};
              }
              if (!(name in rentaku._.depend[decl])) {
                rentaku._.depend[decl][name] = 0;
                rentaku._.dependOrder[decl][name] = 0;
              }
              if (depend[di].type.indexOf('seqend') === 0) {
                rentaku._.depend[decl][name] = Math.max(rentaku._.depend[decl][name], 1);
                rentaku._.dependOrder[decl][name] = Math.max(rentaku._.dependOrder[decl][name], 2);
              } else {
                rentaku._.depend[decl][name] = Math.max(0, rentaku._.depend[decl][name]);
                rentaku._.dependOrder[decl][name] = Math.max(1, rentaku._.dependOrder[decl][name]);
              }
            }
          }
        }
      }
      function parseDecl(decl) {
        let regfull = RegExp('^([^' + rentaku._.magic + ']+)' + rentaku._.magic + '([0-9]+)$');
        let regless = RegExp('^' + rentaku._.magic + '([0-9]+)$');
        if (regfull.test(decl)) {
          let name = RegExp.$1;
          let idx = RegExp.$2;
          return [name, parseInt(idx, 10)];
        } else if (regless.test(decl)) {
          return [decl, 0];
        }
        return null;
      }
      function processStatements() {
        run();
        if (rentaku.debug) {
          for (let ik in rentaku._.iteraitas) {
            for (let ii = 0; ii < rentaku._.iteraitas[ik].length; ii++) {
              console.log(ik + '[' + ii + ']:' + JSON.stringify(rentaku._.iteraitas[ik][ii].values));
            }
          }
        }
        return;
      }
      function run(_max, _limit) {
        // just in case of adding new sequence
        setStart(rentaku._.decls, rentaku._.depend, rentaku._.starts);
        setStart(rentaku._.decls, rentaku._.dependOrder, rentaku._.orders);
        let order = {};
        let groupMax = 0;
        for (let ok in rentaku._.orders) {
          let declLabel = parseDecl(ok)[0];
          if (!(declLabel in order)) {
            order[declLabel] = 0;
          }
          order[declLabel] = Math.max(order[declLabel], rentaku._.orders[ok]);
          groupMax = Math.max(groupMax, order[declLabel]);
        }
        let group = [];
        for (let gi = 0; gi < groupMax + 1; gi++) {
          group.push([]);
        }
        for (let ok in order) {
          group[order[ok]].push(ok);
        }
        let groupOrder = [];
        for (let gi = 0; gi < group.length; gi++) {
          groupOrder = groupOrder.concat(group[gi]);
        }

        if (_limit) {
          rentaku._.limit.value = _limit;
        }
        if (_max) {
          rentaku._.max = _max;
        }
        rentaku._.limit.count = 0;
        let max = 0;
        for (let sk in rentaku._.starts) {
          max = Math.max(max, rentaku._.starts[sk]);
        }
        // main loop
        max = (max + 1) * rentaku._.max;
        for (let i = 0; i < max + rentaku._.max; i++) {
          rentaku._.state.now = i % max;
          for (let gi = 0; gi < groupOrder.length; gi++) {
            let dk = groupOrder[gi];
            let iters = rentaku._.iteraitas[dk];
            let tmp_iters = [];
            for (let dj = 0; dj < iters.length; dj++) {
              tmp_iters.push(iters[dj]);
            }
            for (let dj = 0; dj < tmp_iters.length; dj++) {
              let iter = tmp_iters[dj];
              let decl = iter.name;
              let declLabelIdx = parseDecl(decl);
              let declIdx = declLabelIdx[1];
              rentaku._.state.self = iter.label;
              let argvs = iter.argvs;
              let start = rentaku._.starts[decl] * rentaku._.max;
              if (start <= i && i <= start + rentaku._.max - 1) {
                if (start !== i) {
                  rentaku._.state.here = dj;
                  appendRow(iter);
                } else {
                  let sideArray = [];
                  let minSides = 0;
                  let constargv = true;
                  for (let ai = 0; ai < argvs.length; ai++) {
                    if (!(ai in iter.sideSequences)) {
                      let str = argvs[ai];
                      rentaku._.state.mode = true;
                      let evaled = rentaku.parser.formula.parse(rentaku._.preprocess(str));
                      rentaku._.state.mode = false;
                      sideArray.push([evaled]);
                    } else {
                      constargv = false;
                      let _decl = iter.sideSequences[ai];
                      // _decl is always 0
                      let _iter = rentaku._.iteraitas[_decl][0];
                      let tmp = [];
                      for (let ii = 0; ii < vallen(_iter); ii++) {
                        // TODO: one?
                        tmp.push(one(_iter.values[ii]));
                      }
                      if (minSides) {
                        minSides = Math.min(minSides, tmp.length);
                      } else {
                        minSides = tmp.length;
                      }
                      sideArray.push(tmp);
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
                    prepareColumn(decl, mi, minSides, dj, iter, tmpargv);

                    rentaku._.state.here = dj;
                    appendRow(iters[dj]);
                  }
                  rentaku._.state.here = 0;
                }
              }
            }
          }
        }
        return;
      }
      function prepareColumn(decl, idx, max, loc, iter, argvs) {
        let new_iter;

        if (max === 1) {
          new_iter = iter;
        } else {
          if (idx === 0) {
            new_iter = iter;
          } else {
            let iters = rentaku._.iteraitas[iter.label];
            new_iter = JSON.parse(JSON.stringify(iter));
            iters.splice(loc, 0, new_iter);
            //iters.push(new_iter);
          }
        }
        new_iter.inits.length = 0;
        for (let ai = 0; ai < argvs.length; ai++) {
          new_iter.inits.push(argvs[ai]);
        }
        new_iter.values = [];
      }
      function appendRow(iter) {
        rentaku._.state.mode = true;
        let newval = [];
        for (let fi = 0; fi < iter.formula.length; fi++) {
          rentaku._.state.what = fi;
          let val = rentaku.parser.formula.parse(rentaku._.preprocess(iter.formula[fi]), { startRule: 'Formula' });
          newval.push(val);
          if (iter.condition && iter.condition.length > 0) {
            let cond = true;
            if (typeof iter.condition[fi] !== 'undefined' && iter.condition[fi].length > 0) {
              cond = rentaku.parser.formula.parse(rentaku._.preprocess(iter.condition[fi]), { startRule: 'Condition' });
            }
            if (!cond) {
              newval.pop();
              newval.push(null);
            }
          }
        }
        rentaku._.state.what = 0;
        iter.values.push(newval);
        rentaku._.state.mode = false;
      }
      function setStart(decls, _depend, starts) {
        let depend = {};
        for (let dk in _depend) {
          depend[dk] = {};
          for (let depdecl in _depend[dk]) {
            for (let di = 0; di < rentaku._.state.decl_serial[depdecl] + 1; di++) {
              if (depdecl.indexOf(rentaku._.magic) === 0) {
                depend[dk][depdecl] = _depend[dk][depdecl];
              } else {
                depend[dk][depdecl + rentaku._.magic + di] = _depend[dk][depdecl];
              }
            }
          }
        }
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
        setStart(decls, depend, rentaku._.starts);
        console.log(rentaku._.starts);
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
  rentaku.parser.statement = peg.generate(statementStr);
  rentaku.parser.formula = peg.generate(statementStr, { allowedStartRules: ['Formula', 'Condition'] });
  clear();
  rentaku.parser.statement.parse(rentaku._.preprocess(srcStr));
  function getStatementStr(funcStr) {

    let signed = '\\+\\-';
    let sp = ' \\t';
    let wsp = ' \\t\\n\\r';
    let dash = `"'"`;
    let backdash = "'`'";
    let except = '~\\-\\+\\*\\/<>=!#\'"%&;:,\\[\\]\\(\\)\\|\\.\\\\\\^\\?`{}@\\$';
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
= (_ Statement)+ 
{
  if (rentaku._.state.mode) {
    return;
  }
  processStatements();
}

/* 
TODO: 
* multiple Conditions
* Conditions without expr
* function and operator definition with {}
 A ( _ '|' B?  ( C ( _ '|' D?) )* )?

*/
Statement
= seq:Sequence _  argvs:Argvs* _ ('@' / ':=') form:Formula formcond:( _ '|' Condition? ( Formula? _ '|' Condition? )* )?
{  
  processStatement(seq,form,formcond,argvs);
}

Argvs
=argvs:( _ '[' _ Formula ( _ '|' _ Condition? ( _ Formula ( _ '|' _ Condition? )? )* )? _ ']' )
{
  return processArgvs(argvs);
}


Condition
= head:FuncCondTerm tail:( _ ('and' / 'or' / ',') _ FuncCondTerm)*
{
  if (rentaku._.state.mode) {
    return processAndOr(head, tail);
  } else {
    let ret = processTail(head, tail);
    ret.push({ text: text() });
    return ret;
  }
}

Formula
= head:FuncTerm tail:( _ ('+' / '-') _ FuncTerm)*
{
  if (rentaku._.state.mode) {
    return processAddSub(head, tail);
  } else {
    let ret = processTail(head, tail);
    ret.push({ text:text() });
    return ret;
  }
}
/ tail:( _ ('+' / '-') _ FuncTerm)+
{
  if (rentaku._.state.mode) {
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
= head:Term tail:(_ ('<='/ '<' / '=' / '>=' / '>' / '<>' / [a-z]+ ) _ Term)+
{
  if (rentaku._.state.mode) {
    let ret = processFuncCond(head, tail);
    return ret;
  } else {
    return processTail(head, tail);
  }
}
/ op:$('%' / [a-z]+) _ args:Term 
{
  if (rentaku._.state.mode) {
    return processFuncCondEx(op, null, args);
  } else {
    return args; 
  }
}
/ op:$('%' / [a-z]+) tail:( _ '[' _ Term _ ']')+ 
{
  if (rentaku._.state.mode) {
    return processFuncCondEx(op, 2, tail);
  } else { 
    return processTail(null, tail);
  }
}

FuncTerm
= head:Term tail:( _ op:$('%' / [a-z]+) _ Term)*
{
  if (rentaku._.state.mode) {
    return processFunc(head, tail);
  } else {
    return processTail(head, tail);
  }
}
/ op:$('%' / [a-z]+) _ args:Term 
{
  if (rentaku._.state.mode) {
    return processFuncEx(op, null, args);
  } else { 
    return args; 
  }
}
/ op:$('%' / [a-z]+) tail:( _ '{' _ Term _ '}')+
{
  if (rentaku._.state.mode) {
    return processFuncEx(op, 2, args);
  } else {
    return processTail(null, tail);
  }
}

Term
= _ head:UnsignedNumber tail:( _ ('*' / '/') _ (UnsignedNumber / Factor) / [${sp}]* [${sp}]* [${sp}]* Factor)* 
{
  if (rentaku._.state.mode) {
    return processMulDiv(head, tail);
  } else {
    return processTail(head, tail);
  }
}
/ _ head:Factor tail:( _ ('*' / '/') _ (UnsignedNumber / Factor) /  [${sp}]* [${sp}]* [${sp}]* Factor)* 
{
  if (rentaku._.state.mode) {
    return processMulDiv(head, tail);
  } else {
    return processTail(head, tail);
  }
}

Factor
= '(' expr:Formula _ ')' { return expr; }
  / SysOperatedDoller
  / SysOperatedHash
  / SysOperatedDash
  / seq:Sequence
  {
    if (rentaku._.state.mode) {
      return val(seq,here(),now());
    } else {
      return seq;
    }
  }

SysOperatedDash
= seq:Sequence tail:( [${dash}${backdash}] [${sp}]* SysIndex*)+ 
{
  if (rentaku._.state.mode) {
    return processDash (seq,tail);
  } else {
    return [{
      type: 'seqstart',
      name: seq[0].name,
    }];
  }
}
/ tail:([${dash}${backdash}] [${sp}]* SysIndex*)+ 
{
  if (rentaku._.state.mode) {
    return processDash (self(),tail);
  } else {
    return [];
  }
}

SysOperatedDoller
= seq:Sequence op:'$' idx:SysIndex?
{
  if (rentaku._.state.mode) {
    return processHashDoller (seq, idx, op);
  } else {
    return [{
      type: 'seqend',
      name: seq[0].name,
    }];
  }
}
/ op:'$' idx:SysIndex*
{
  if (rentaku._.state.mode) {
    return processHashDoller (self(), idx, op);
  } else {
    return [];
  }
}

SysOperatedHash
= seq:Sequence op:'#' idx:SysIndex? 
{
  if (rentaku._.state.mode) {
    return processHashDoller (seq, idx, op);
  } else {
    return [{
      type: 'seqend',
      name: seq[0].name,
    }];
  }
}
/ op:'#' idx:SysIndex* 
{
  if (rentaku._.state.mode) {
    return processHashDoller (self(), idx, op);
  } else {
    return [];
  }
}

SysIndex
= '{' _ signed:SignedInt _ '}'
{
  return parseInt(signed,10);
}
/ unsinged:_UnsignedInt
{
  return parseInt(unsinged,10);
}

Sequence
= seq:([^0-9a-z${wsp}${except}][^${wsp}${except}]*)  {
  let seqname = seq[0]+seq[1].join('');
  if (rentaku._.state.mode) {
    // TODO: use 0 if not specified by '?'
    return rentaku._.iteraitas[seqname][0];
  } else {
    return [{
      type: 'sequence',
      name: seqname,
    }];
  }
}

UnsignedNumber
= $( _UnsignedFloat / _UnsignedInt)
{
  if (rentaku._.state.mode) {
    return parseFloat(text());
  } else {
    return [];
  }
}

_UnsignedFloat
= _UnsignedInt '.' [0-9]*
/ '.' [0-9]+

SignedInt
= [${signed}] _UnsignedInt
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
    ? (function () {
      const peg = require('./peg-0.10.0');
      return peg;
    })()
    : peg,
  typeof (peg) === 'undefined'
    ? (function () {
      let fs = require('fs');
      if (process.argv.length <= 2) {
        throw 'Usage: node rentaku.js file.ren\n';
      } else {
        let file = process.argv[2];
        try {
          fs.statSync(file);
        } catch (e) {
          throw 'ERROR: no such a file: ' + file + '\n';
        }
        return fs.readFileSync(file, 'utf-8');
      }
    })()
    : (function () {
      return `
自然数 [0] := '+1
パイの素A [1][3] := 6 ' +  (2自然数-1)(2自然数-1) '' 
パイの素B [0][1] := 6 ' +  (2自然数-1)(2自然数-1) '' 
パイ := パイの素A/パイの素B	
辺数 := 5
外角 := 2パイ#/辺数
コサインの素 [1] := -' 外角 外角 / (2自然数(2自然数-1)) 
コサイン [1] := ' + コサインの素
サインの素 [外角#] := -2 ' 外角 外角 / (2自然数(2自然数+1)) 
サイン  [外角#] := ' + サインの素
コサインN倍角 [コサイン#][0] := 2コサイン# ' - '' 
サインN倍角 [-サイン#][0] := 2コサイン# ' - '' 
辺長 := 20
回転数 := 1
点X座標 [0] := '-辺長 コサインN倍角 | 自然数 <=  辺数 回転数  
点Y座標 [0] := ' + 辺長 サインN倍角 | 自然数 <= 辺数 回転数
線 
[点X座標'][点Y座標'][点X座標][点Y座標] :=  $3+($1-$3)/($0-$2)*(自然数-$2-1+(($2+1) mod 1))+1-(($3+($1-$3)/($0-$2)*(自然数-$2-1+(($2+1) mod 1))) mod 1) 
| (
 (
   ($0-$2)*($0-$2)>=0.0001)
  and 
  ((自然数-$2-1+(($2+1) mod 1))*(自然数-$0+($0 mod 1))<=0)
)
or
( 
  (($1-$3)*($1-$3)<0.0001)
  and 
  ((自然数-$2-1+(($2+1) mod 1))*(自然数-$0+($0 mod 1))<=0)
)
`;
    })()
  );
/*
} catch (ex) {
  console.error(ex);
}*/