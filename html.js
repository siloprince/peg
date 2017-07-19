'use strict';

(function (console, document, window, rentaku) {

    let config = {
        page_label: 'rentaku',
        table: {
            id: 'table',
        },
        sidebar: {
            id: 'sidebar',
            src_id: 'src',
            rows: '40',
            cols: '46',
            style: `
    position:fixed;
    top:0px;
    right:0px;
    width:300px;
    max-width:600px;
    height:100%;
    z-index: 1;
        `
        }
    };
    let currentScript = document.currentScript;
    currentScript.insertAdjacentHTML(
        'afterend',
        `
        <h3>${config.page_label}</h3>
        <div id="${config.sidebar.id}" style="${config.sidebar.style}">
            <textarea id="${config.sidebar.src_id}" style="font-size:9pt;height:100%;width:300px;">${rentaku.sample}</textarea>
        </div>
        <table id="${config.table.id}"><thead><tr></tr></thead><tbody></tbody></table>`
    );

    draw();
    console.log(build());

    let sidebar = document.querySelector(`textarea#${config.sidebar.src_id}`);
    sidebar.addEventListener('input', function () {
        rentaku.clear();
        rentaku.parser.statement.parse(rentaku._.preprocess(sidebar.value));
        draw();
    });
    function build() {
        // TODO: use in case label is edited
        // if label is directly edited, it is easy
        // if formula is edited, need to detect which label is changed
        // if formula contain unknown label process diff and find the change
        // then alert only.
        let srcList = [];
        for (let ik in rentaku._.iteraitas) {
            let iters = rentaku._.iteraitas[ik];
            for (let ij = 0; ij < iters.length; ij++) {
                if (ij>0) {
                    // TODO: recover
                    continue;
                }
                let iter = iters[ij];
                // TODO: switch label to new label
                let label = iter.label;
                if (label.indexOf(rentaku._.magic)===0) {
                    continue;
                }
                let formula = iter.formula;
                if (iter.condition) {
                    formula += ' | ' + iter.condition;
                }
                let argvs = '';
                let argvsList = [];
                if (iter.argvs) {
                    for (let ii = 0; ii < iter.argvs.length; ii++) {
                        let av = iter.argvs[ii];
                        if (iter.argvsCondition[ii]) {
                            av += ' | ' + iter.argvsCondition[ii];
                        }
                        argvsList.push(av);
                    }
                    if (argvsList.length > 0) {
                        argvs = '[' + argvsList.join('][') + ']';
                    }
                }
                let statement = label + ' @ ' + formula + ' ' + argvs;
                // TODO: Statement parse replace label with new label
                srcList.push(statement);
            }
        }
        return srcList.join('\n');
    }
    function rebuild(ev) {

        let table = document.querySelector(config.table.id);
        let theadTr = table.querySelector('thead tr');
        let thList = theadTr.querySelectorAll('th');
        let decls = [];
        for (let ti = 0; ti < thList.length; ti++) {
            let val = thList[ti].textContent.trim();
            decls.push(val);
        }
        let tbodyTr = table.querySelectorAll('tbody tr');
        let formulas = [];
        for (let ri = 0; ri < 2 + rentaku._.constval; ri++) {
            if (ri === 1) {
                continue;
            }
            let tdList = tbodyTr[ri].querySelectorAll('td');
            for (let ti = 0; ti < tdList.length; ti++) {
                let val = tdList[ti].textContent.trim();
                if (ri === 0) {
                    if (val.length === 0) {
                        val = '0';
                    }
                    formulas.push(val);
                } else {
                    if (val.length === 0) {
                        continue;
                    }
                    formulas[ti] += `[${val}]`;
                }
            }
        }

        let srcList = [];
        let declHash = {};
        for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            if (decl in declHash) {
                continue;
            }
            if (decl.indexOf(rentaku._.magic) === 0) {
                continue;
            }
            srcList.push(decl + ' @ ' + formulas[di]);
            declHash[decl] = true;
        }
        let sidebar = document.querySelector(`textarea#${config.sidebar.src_id}`);
        sidebar.value = srcList.join('\n');
        rentaku.clear();
        rentaku.parser.statement.parse(rentaku._.preprocess(sidebar.value));
        draw();
    }
    function draw() {
        // TODO: API
        let iteraitas = rentaku._.iteraitas;
        let decls = [];
        for (let ik in rentaku._.iteraitas) {
            decls.push(ik);
        }
        let constval = rentaku._.constval;
        let max = rentaku._.max;

        let table = document.querySelector(config.table.id);
        let theadTr = table.querySelector('thead tr');
        theadTr.innerHTML = '';
        let tbody = table.querySelector('tbody');
        tbody.innerHTML = '';
        let ed = ' contenteditable="true" tabindex="0"';
        let theadThStyle = 'style="background-color:#444499;color:#ffffff;font-size:9pt;"';
        for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            let instances = iteraitas[decl];
            for (let ii = 0; ii < instances.length; ii++) {
                theadTr.insertAdjacentHTML('beforeend', `<th ${theadThStyle} ${ed}>${decl}</th>`);
                let th = theadTr.querySelector('th:last-child');
                th.addEventListener('input', rebuild, false);
            }
        }
        let formulaTdStyle = 'style="font-size:9pt;background-color:#ffffcc;height:16pt;vertical-align:top;text-align: left;word-wrap:break-word;max-width:100pt;"';
        {
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                for (let ii = 0; ii < instances.length; ii++) {
                    let cell = instances[ii].formula;
                    tbodyTr.insertAdjacentHTML('beforeend', `<td ${formulaTdStyle} ${ed}>${cell}</td>`);
                    let td = tbodyTr.querySelector('td:last-child');
                    td.addEventListener('input', rebuild, false);
                }
            }
        }
        let graphThStyle = 'style="font-size:9pt;background-color:#aa99ff;height:30pt;"';
        {
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                for (let ii = 0; ii < instances.length; ii++) {
                    tbodyTr.insertAdjacentHTML('beforeend', `<td ${graphThStyle}></td>`);
                }
            }
        }
        let hintHash = {};
        for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            let instances = iteraitas[decl];
            for (let ci = 0; ci < constval; ci++) {
                let cj = constval - ci - 1;
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = '';
                    let ck = instance.inits.length - cj - 1;
                    if (instance.inits && cj < instance.inits.length && typeof (instance.inits[ck]) !== 'undefined') {
                        cell = instance.inits[ck];
                    }
                    let tmp = hint(cell);
                    if (!(di in hintHash)) {
                        hintHash[di] = tmp;
                    } else {
                        if (tmp.default) {
                            hintHash[di] = tmp;
                        }
                    }
                }
            }
            for (let mi = 0; mi < max; mi++) {
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = instance.values[mi];
                    let tmp = hint(cell);
                    if (!(di in hintHash)) {
                        hintHash[di] = tmp;
                    } else {
                        if (tmp.default) {
                            hintHash[di] = tmp;
                        }
                    }
                }
            }
        }
        for (let ci = 0; ci < constval; ci++) {
            let cj = constval - ci - 1;
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                let _hi = hintHash[di];
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = '';
                    let ck = instance.inits.length - cj - 1;
                    if (instance.inits && cj < instance.inits.length && typeof (instance.inits[ck]) !== 'undefined') {
                        cell = instance.inits[ck];
                    }
                    let hi = padding(cell, _hi);
                    let initsTdStyle = `style="font-size:9pt;background-color:#ccffcc;height:16pt;text-align: ${hi.align};"`;
                    tbodyTr.insertAdjacentHTML('beforeend', `<td ${initsTdStyle} ${ed}>${hi.sign}${cell}</td>`);
                    let td = tbodyTr.querySelector('td:last-child');
                    td.addEventListener('input', rebuild, false);
                }
            }
        }
        for (let mi = 0; mi < max; mi++) {
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                let _hi = hintHash[di];
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = instance.values[mi];
                    let hi = padding(cell, _hi);
                    tbodyTr.insertAdjacentHTML('beforeend', `<td style="font-size:9pt;text-align: ${hi.align};">${hi.sign}${cell}</td>`);
                }
            }
        }
        function hint(val) {
            let ret = { sign: '', align: 'right' , default: false};
            if (val === null || typeof val === 'undefined') {
                return ret;
            }
            let valstr = val.toString();
            if (valstr.indexOf('.') !== -1) {
                ret.default = true;
                ret.align = 'left';
            }
            return ret;
        }
        function padding(val,hint) {
            if (hint.default===false) {
                return hint;
            }            
            if (val === null || typeof val === 'undefined') {
                return hint;
            }
            let ret = JSON.parse(JSON.stringify(hint));
            let valstr = val.toString();
            if (valstr.indexOf('-') !== 0) {
                ret.sign = '&nbsp;';
            }
            return ret;
        }
    }

})(console, document, window, rentaku);