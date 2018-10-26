import Adhesive from './adhesive';
import NoteIt from './note-it';

/**
 * A stack of adhesives such that single adhesives can be
 * created from.
 **/
class Stack {
    constructor(board, group, type="Type", color=["#f7ff72"], geometry=[10,10], position=[2,2]) {
        this.parentGroup = group;
        this.group = group.append("g").attr("class", "stack");
        new Adhesive(board, group, null, "stack1", color, geometry, [ position[0] + 4, position[1] + 4]);
        new Adhesive(board, group, null, "stack0", color, geometry, [ position[0] + 2, position[1] + 2]);
        let n = new NoteIt(board, group, null, "stack", color, geometry, [position[0], position[1]]);
        n.addType("Type");
        n.handles = ["close", "visible", "new", "color", "edit", "label", "uri", "photo"];
        n.draggable = true;
        n.persistable = true;
        n.persistableChildren = true;
        n.addHandleNew(2.4);
        n.addHandleVisible(1.6);
        n.addHandleColor();
        n.childrenGroup.raise();
        board.adhesives.set(n.id, n);
        return this;
    }
}

export default Stack
