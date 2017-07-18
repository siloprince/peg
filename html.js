'use strict';

(function(console,document,window,rentaku) {

    let config = {
        page_label: 'rentaku',
        src_id: 'src',
        rows: '40',
        cols: '46',
        sidebar_style: `
    position:absolute;
    top:0;
    right:0px;
    width:300px;
    height:100%;
        `
    };
    let currentScript = document.currentScript;
    currentScript.insertAdjacentHTML(
        'afterend',
        `
        <h3>${config.page_label}</h3>
        <div id="sidebar" style="${config.sidebar_style}">
            <textarea id="${config.src_id}" rows="${config.rows}" cols="${config.cols}" style="font-size:9pt;">${rentaku.sample}</textarea>
        </div>`
    );

})(console,document,window,rentaku);