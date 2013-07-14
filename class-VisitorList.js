/*
 VisitorList manages all current visitors and displays the list in a table
 listDisplayContainer - The div that will contain the table of visitors
 chatManager - the ChatManager object that will manage chat sessions
 */
function VisitorList(listDisplayContainer, chatManager) {
    this.visitors = [];
    this.listDisplayContainer = listDisplayContainer;
    this.chatManager = chatManager;
    // the row containing the selected visitor
    this.selectedRow = undefined;

    // create table of visitors
    this.table = document.createElement('table');
    this.table.id = 'visitor-list-table';
    this.tBody = document.createElement('tbody');
    this.table.appendChild(this.tBody);
    this.listDisplayContainer.appendChild(this.table);
}

// add a visitor to the existing list
VisitorList.prototype.setVisitors = function (visitors) {
    this.visitors = visitors;
    this.tBody.innerHTML = '';
    var that = this;
    for (var i = 0; i < that.visitors.length; i++) {
        // add an entry to the table for this visitor   W
        var row = document.createElement("tr");
        row.className = 'visitor-list-entry';
        // each row contains a single cell containing the visitor name
        var cell = document.createElement("td");
        var cellText = document.createTextNode(visitors[i].name);
        cell.appendChild(cellText);
        row.appendChild(cell);

        var event = clickCallback(row, visitors[i]);
        // When the visitor's row is clicked they should be selected as active
        row.addEventListener('click', event, false);

        // add the row to the end of the table body
        this.tBody.appendChild(row);
    }

    function clickCallback(row, visitor) {
        return function () {
            if (that.selectedRow) that.selectedRow.className = 'visitor-list-entry';
            // style row to show click
            row.className = 'selected-visitor';
            that.selectedRow = row;
            // tell chat manager to display this visitor if they are new,
            that.chatManager.showVisitorChat(visitor);
        }
    }
}
