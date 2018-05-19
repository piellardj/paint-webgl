const OUTPUT = "index.html";
const VIEWS_FOLDER = "src/ejs/views/";
const DATA_FILE = "src/ejs/data.json";

const fs = require("fs");

/* Custom file loader */
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
        template = template.replace(new RegExp("[ \t]*" + alias.keyword + " (.*)", "mg"), replacement);
    });

    return template;
};

const ejs = require("ejs");
ejs.render
ejs.fileLoader = fileLoader;

const data = JSON.parse(fs.readFileSync(DATA_FILE));

/* HTML generation */
const htmlContent = fs.readFileSync(VIEWS_FOLDER + 'pages/demo-page.ejs', 'utf8');
const generated = ejs.render(htmlContent, data, {filename: VIEWS_FOLDER + 'pages/index.ejs'});

const pretty = require('pretty');
prettyfied = pretty(generated);

fs.writeFileSync(OUTPUT, prettyfied, ['utf8']);