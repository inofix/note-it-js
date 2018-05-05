var svg = d3.select("svg");
var svgX = svg.node().getBoundingClientRect().left;
var svgY = svg.node().getBoundingClientRect().top;

var rstock = create_stock("Type", "#ff6ee2");
var bstock = create_stock("Type", "#6ee0ff", 8, 26);
var ystock = create_stock("Type", "", 16, 52);

// TODO - add a note-it dropped on another to the lower ones group
// TODO - colapse / expand all children on double-click
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg

