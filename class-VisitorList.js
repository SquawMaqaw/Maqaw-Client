/*
 VisitorList manages all current visitors and displays the list in a table
 listDisplayContainer - The div that will contain the table of visitors
 chatManager - the ChatManager object that will manage chat sessions
 */
function MaqawVisitorList(listDisplayContainer, repSession) {
    var that = this;
    // hash of all visitors on the site. Their id is the key, and their visitor object the value
    this.visitors = {};
    this.listDisplayContainer = listDisplayContainer;
    this.chatManager = repSession.chatManager;
    this.maqawManager = repSession.maqawManager;
    this.repSession = repSession;
    // a visitor object representing the visitor that is selected in the table
    this.selectedVisitor;
    this.visitorCounter = 1;

    // create table of visitors
    this.table = document.createElement('table');
    this.table.id = 'maqaw-visitor-list-table';
    this.tBody = document.createElement('tbody');
    this.table.appendChild(this.tBody);
    this.listDisplayContainer.appendChild(this.table);

    // takes an array of ids of visitors that are on the site
    // checks which of the ids are new, which already exist, and which previous ids aren't active any more
    // the visitor display is updated accordingly
    // visitorIds - an array of ids of visitors on the site
    this.setVisitorList = function (visitorIds) {
            // go through each id in the list
            for (var i = 0; i < visitorIds.length; i++) {
                var id = visitorIds[i];
                // check for a visitor with this id
                var visitor = that.visitors[id];
                // if one doesn't exist, create one
                if (!visitor) {
                    that.visitors[id] = createNewVisitor(id);
                }
            }
    };

    // create a new visitor using the specified id, and wrap the visitor in a MaqawVisitorWrapper object
    // to help manage selecting and displaying the visitor
    function createNewVisitor(id) {
        var visitorName = 'Visitor ' + that.visitorCounter;
        that.visitorCounter++;
        // use rowIndex of -1 so the row is added at the end of the table
        return new MaqawVisitor(id, visitorName, that.repSession);
    }

    this.setSelectedVisitor = function (visitor) {
        // deselect previously selected row, if there is one
        if (that.selectedVisitor) {
            that.selectedVisitor.deselect();

            // if the previously selected visitor was selected again, leave it deselected
            if (that.selectedVisitor === visitor) {
                that.selectedVisitor = undefined;
                return;
            }
        }

        // set new visitor to be selected
        visitor.select();

        // save visitor
        that.selectedVisitor = visitor;
    };


    // a visitorwrapper calls this to tell the MaqawVisitorList that it is going inactive
    // the visitor list needs to make sure that it doesn't have this visitor set
    // as selected
    this.hideVisitor = function (visitor) {
        if (that.selectedVisitor && that.selectedVisitor === visitor) {
            that.selectedVisitor = undefined;
        }
    };

    // return the an object representing the state of this visitorList
    this.getListData = function () {
        var data = {};
        // create an entry for each visitor
        var counter = 0;
        for (var visitorId in that.visitors) {
            var visitor = that.visitors[visitorId];
            // save the data that is important to state
            var visitorData = {
                name: visitor.visitor.name,
                id: visitor.getId(),
                isSelected: visitor.isSelected,
                rowIndex: visitor.row.rowIndex,
                chatText: visitor.chatSession.getText()
            };
            data[counter] = visitorData;
            counter++;
        }
        return data;
    };

    // load a state represented by an object from getListData
    this.loadListData = function (listData) {
          // start by clearing any existing visitors and the visitor table
        that.visitors = {};
        that.tBody.innerHTML = '';

        // set the visitor counter to be the number of visitors stored
        that.visitorCounter = listData.length + 1;

        // go through each entry in the list data and restore it
        for(var index in listData){
            var dataObject = listData[index];
            // create and update a visitor using this data
            var visitor = new MaqawVisitor(dataObject['id'], dataObject['name'], that);

            if(dataObject['isSelected']) {
                that.selectedVisitor = visitor;
                visitor.select();
            }

            // load the chat history
            visitor.chatSession.setText(dataObject['chatText']);

            // save this visitor in the list
            that.visitors[visitor.id] = visitor;
        }
    }
}
