const svg = d3.select("svg");
var svgX = svg.node().getBoundingClientRect().left;
var svgY = svg.node().getBoundingClientRect().top;

var rstock = create_stock("Pink", "#ff6ee2", 16, 4, 4);
var bstock = create_stock("Cyan", "#6ee0ff", 16, 8, 24);
var ystock = create_stock("Yellow", undefined, 16, 12, 44);

// TODO - add a note-it dropped on another to the lower ones group
// TODO - colapse / expand all children on double-click
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg

