const markdownIt = require('markdown-it');
const markdownItAnchor = require("markdown-it-anchor");

const markdownLib = markdownIt({
    html: true,
    breaks: false,
    linkify: true
})
    .use(markdownItAnchor, {
        level: [2, 3],
    });

module.exports = markdownLib;
