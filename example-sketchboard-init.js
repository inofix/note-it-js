var board = new SketchBoard("#sketchboard");
var rstack = new Stack(board, board.group, "Type", 
                ["#f7ff72", "#ff72e3", "#6ee0ff", "#ffa800", "#a9a9ff", "#b3ff7b"], [14,14]);

var back = d3.select("#sketchboardjson");
let a = back.append("textarea").attr("rows", 10).attr("cols", 80);
a.on("keyup", function() {
    let t = d3.select("#sketchboardjson").select("textarea");
    t.attr("value", t.node().textContent);
});
back.append("input").attr("type", "button")
            .attr("value", "To JSON").on("click", function() {
    let t = d3.select("#sketchboardjson").select("textarea");
    t.text(board.toJSON("  "));
    t.attr("value", t.node().textContent);
});
back.append("input").attr("type", "button")
            .attr("value", "From JSON").on("click", function() {
    board.fromJSON(d3.select("#sketchboardjson").select("textarea")
            .node().value);
});

