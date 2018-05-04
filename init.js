var svg = d3.select("svg");

var rstock = draw_noteit("#ff6ee2");
rstock.append("text").text("+").attr("x", "9em").attr("y", "1em");
rstock.on("click", function() {
    let n = create_noteit("#ff6ee2", "...");
    n.attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
} );

var bstock = draw_noteit("#6ee0ff");
bstock.attr("transform", "translate(26,26)");
bstock.append("text").text("+").attr("x", "9em").attr("y", "1em");
bstock.on("click", function() {
    let n = create_noteit("#6ee0ff", "...");
    n.attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
} );

var ystock = draw_noteit();
ystock.attr("transform", "translate(52,52)");
ystock.append("text").text("+").attr("x", "9em").attr("y", "1em");
ystock.on("click", function() {
    let n = create_noteit(null, "...");
    n.attr("transform", "translate(" + d3.event.x + "," + d3.event.y + ")");
} );

// TODO - add a note-it dropped on another to the lower ones group
// TODO - colapse / expand all children on double-click
// TODO - add a textbox for content / functions below the title (9em remaining)
// TODO - display the config as json
// TODO - add sync between json:svg

