/* File loader 1.0.0 */
const fs = require("fs");

const ALIASES = [
    {keyword: "#=", open: "<%=", close: "%>"},
    {keyword: "#_", open: "<%_", close: "_%>"},
    {keyword: "#",  open: "<%",  close: "%>"}];

const fileLoader = function(filepath) {
    let template = '' + fs.readFileSync(filepath, ['utf-8']);

    ALIASES.forEach(function(alias) {
        const replacement = alias.open + " $1 " + alias.close;

        /* inline commands, then full line commands */
        template = template.replace(new RegExp(alias.keyword + "\\(([^\)]*)\\)", "mg"), replacement);
        template = template.replace(new RegExp("^[ \t]*" + alias.keyword + " (.*)$", "mg"), replacement);
    });

    //if (filepath.includes('card-1')) throw new Error(template);
    return template;
};

const ejs = require("ejs");
ejs.fileLoader = fileLoader;

/* HTML generation */
const files = JSON.parse(fs.readFileSync("src/ejs/build-html.json"));

files.forEach(function(file) {
    const filepath = 'src/ejs/views/pages/' + file.src + '.ejs';
    const output = file.output + '.html';

    let data = {};
    if (file.data && file.data !== "") {
        data = JSON.parse(fs.readFileSync('src/ejs/views/pages/' + file.data));
    }

    const htmlContent = fileLoader(filepath);
    const generated = ejs.render(htmlContent, data, {filename: filepath});

    const pretty = require('pretty');
    prettyfied = pretty(generated);

    fs.writeFileSync(output, prettyfied, ['utf8']);
});