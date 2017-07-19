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

    let sidebar = document.querySelector(`textarea#${config.sidebar.src_id}`);
    sidebar.addEventListener('change', function () {     
        let srcStr = sidebar.value;
        rentaku.clear();
        rentaku.parser.statement.parse(rentaku._.preprocess(srcStr));
        draw();
    });

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
        let ed = ' contenteditable="true" ';
        let theadThStyle = 'style="background-color:#444499;color:#ffffff;font-size:9pt;"';
        for (let di = 0; di < decls.length; di++) {
            let decl = decls[di];
            let instances = iteraitas[decl];
            for (let ii = 0; ii < instances.length; ii++) {
                theadTr.insertAdjacentHTML('beforeend', `<th ${theadThStyle} ${ed}>${decl}</th>`);
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
        for (let ci = 0; ci < constval; ci++) {
            let cj = constval - ci - 1;
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = '';
                    if (instance.inits && cj < instance.inits.length && typeof (instance.inits[cj]) !== 'undefined') {
                        cell = instance.inits[cj];
                    }
                    let hi = hint(cell);
                    let initsTdStyle = `style="font-size:9pt;background-color:#ccffcc;height:16pt;text-align: ${hi.align};"`;
                    tbodyTr.insertAdjacentHTML('beforeend', `<td ${initsTdStyle} ${ed}>${hi.sign}${cell}</td>`);
                }
            }
        }
        for (let mi = 0; mi < max; mi++) {
            tbody.insertAdjacentHTML('beforeend', `<tr></tr>`);
            let tbodyTr = tbody.querySelector('tr:last-child');
            for (let di = 0; di < decls.length; di++) {
                let decl = decls[di];
                let instances = iteraitas[decl];
                for (let ii = 0; ii < instances.length; ii++) {
                    let instance = instances[ii];
                    let cell = instance.values[mi];
                    let hi = hint(cell);
                    tbodyTr.insertAdjacentHTML('beforeend', `<td style="font-size:9pt;text-align: ${hi.align};">${hi.sign}${cell}</td>`);
                }
            }
        }
        function hint(val) {
            let ret = { sign: '', align: 'right' };
            if (val === null || typeof val === 'undefined') {
                return ret;
            }
            let valstr = val.toString();
            if (valstr.indexOf('-') !== 0) {
                ret.sign = '&nbsp;';
            }
            if (valstr.indexOf('.') !== -1) {
                ret.align = 'left';
            }
            return ret;
        }
    }

})(console, document, window, rentaku);