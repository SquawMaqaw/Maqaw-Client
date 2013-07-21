/*
 VisitorList manages all current visitors and displays the list in a table
 listDisplayContainer - The div that will contain the table of visitors
 chatManager - the ChatManager object that will manage chat sessions
 */
function MaqawVisitorList(listDisplayContainer, chatManager, maqawManager) {
    var that = this;
    // hashmap of all visitors on the site. Their id is the key, and their visitor object the value
    this.visitors = {};
    this.listDisplayContainer = listDisplayContainer;
    this.chatManager = chatManager;
    this.maqawManager = maqawManager;
    // a visitor wrapper object representing the visitor that is selected in the table
    this.selectedVisitor;
    this.visitorCounter = 0;

    // create table of visitors
    this.table = document.createElement('table');
    this.table.id = 'visitor-list-table';
    this.tBody = document.createElement('tbody');
    this.table.appendChild(this.tBody);
    this.listDisplayContainer.appendChild(this.table);

    // takes an array of ids of visitors that are on the site
    // checks which of the ids are new, which already exist, and which previous ids aren't active any more
    // the visitor display is updated accordingly
    // visitorIds - an array of ids of visitors on the site
    this.setVisitorList = function (visitorIds) {
        if (visitorIds) {
            // go through each id in the list
            for (var i = 0; i < visitorIds.length; i++) {
                var id = visitorIds[i];
                // check for a visitor with this id
                var visitor = that.visitors[id];
                // if one doesn't exist, create one
                if (typeof visitor === 'undefined') {
                    that.visitors[id] = createNewVisitorWithWrapper(id);
                }
                // otherwise make sure the visitor has an open connection
                else if (!visitor.getIsConnected()) {
                    visitor.setServerConnectionStatus(true);
                }

            }
        }

        // check for current connections that are no longer active
        // Ff the connection is marked as active but we didnt' get an id
        // for it from the server it means the peer disconnected
        // this could be just a page change or refresh, but the connection
        // will be re-established when they make connect with the server again
        // TODO: More efficient way of finding disconnected peers
        for (var visitorId in that.visitors) {
            var isConnected = false;
            for (i = 0; i < visitorIds.length; i++) {
                if (visitorId === visitorIds[i]) {
                    isConnected = true;
                    break;
                }
            }

            // if there are no matching ids for this visitor we need to disconnect them
            if (!isConnected) {
                that.visitors[visitorId].setServerConnectionStatus(false);
            }
        }
    };

    // create a new visitor using the specified id, and wrap the visitor in a MaqawVisitorWrapper object
    // to help manage selecting and displaying the visitor
    function createNewVisitorWithWrapper(id) {
        var visitorName = 'Visitor ' + that.visitorCounter;
        that.visitorCounter++;
        // use rowIndex of -1 so the row is added at the end of the table
        return new MaqawVisitorWrapper(id, visitorName, that, -1);
    }

    this.setSelectedVisitor = function (visitorWrapper) {
        // deselect previously selected row, if there is one
        if (that.selectedVisitor) {
            that.selectedVisitor.deselect();

            // if the previously selected visitor was selected again, leave it deselected
            if (that.selectedVisitor === visitorWrapper) {
                that.selectedVisitor = undefined;
                return;
            }
        }

        // set new visitor to be selected
        visitorWrapper.select();

        // save visitor
        that.selectedVisitor = visitorWrapper;
    };

    // a visitorwrapper calls this to tell the MaqawVisitorList that it is going inactive
    // the visitor list needs to make sure that it doesn't have this visitor set
    // as selected
    this.hideVisitor = function (visitorWrapper) {
        if (that.selectedVisitor && that.selectedVisitor === visitorWrapper) {
            that.selectedVisitor = undefined;
        }
    }

    // return the an object representing the state of this visitorList
    this.getListData = function () {
        var data = {};
        // create an entry for each visitor
        var counter = 0;
        for (var visitorId in that.visitors) {
            var visitorWrapper = that.visitors[visitorId];
            // save the data that is important to state
            var visitorData = {
                name: visitorWrapper.visitor.name,
                id: visitorWrapper.getId(),
                isSelected: visitorWrapper.isSelected,
                rowIndex: visitorWrapper.row.rowIndex,
                chatText: visitorWrapper.visitor.getChatSession().getText()
            }
            data[counter] = visitorData;
            counter++;
        }
        return data;
    }

    // load a state represented by an object from getListData
    this.loadListData = function (listData) {
          // start by clearing any existing visitors and the visitor table
        that.visitors = {};
        that.tBody.innerHTML = '';

        // go through each entry in the list data and restore it
        for(var index in listData){
            var dataObject = listData[index];
            // create and update a visitorWrapper using this data
            // ideally we would like the visitors to show up in the same order in the table, but right now
            // we just append it to the end by passing rowIndex of -1
            var visitorWrapper = new MaqawVisitorWrapper(dataObject['id'], dataObject['name'], that, -1);
            if(dataObject['isSelected']) {
                that.selectedVisitor = visitorWrapper;
                visitorWrapper.select();
            }

            // load the chat history
            visitorWrapper.visitor.getChatSession().setText(dataObject['chatText']);

            // save this visitor in the list
            that.visitors[visitorWrapper.getId()] = visitorWrapper;
        }
    }
}


// this wrapper class monitors the status of a visitor
function MaqawVisitorWrapper(id, name, visitorList, rowIndex) {
    var that = this;
    this.visitorList = visitorList;

    // whether or not this visitor is connected to the peerserver. This will fluctuate briefly
    // if they change or reload pages. If that happens we need to tell the chat session to restart
    // its connection with this visitor
    this.isConnectedToServer = true;

    // the status of the chat session's connection with the visitor. This is subtly different
    // from the visitors connection with the server. The server will
    // immediately detect if the visitor changes pages, however, the chat
    // connection takes five seconds to notice.
    this.isChatConnected = false;

    this.visitor = new MaqawVisitor(this.visitorList.maqawManager, name, id, visitorConnectionCallback);


    // create row to display this visitor in the table

    this.row = visitorList.table.insertRow(rowIndex);
    this.row.className = 'visitor-list-entry';
    // the row contains a single cell containing the visitor name
    var cell = document.createElement("td");
    var cellText = document.createTextNode(this.visitor.name);
    cell.appendChild(cellText);
    this.row.appendChild(cell);

    // append row to the visitor table
    this.visitorList.tBody.appendChild(this.row);

    this.isSelected = false;

    // append click listener to row
    this.row.addEventListener('click', clickCallBack, false);
    function clickCallBack() {
        that.visitorList.setSelectedVisitor(that);
    }


    // set the row to be hidden at first until it's visitor's chat session is established
    hide();

    // this visitor's row in the table is set to selected
    this.select = function () {
        that.isSelected = true;
        // change class to selected
        that.row.className = 'selected-visitor';
        // show visitor chat window
        that.visitorList.chatManager.showVisitorChat(that.visitor)
    };

    // the row is set to deselected
    this.deselect = function () {
        that.isSelected = false;
        // change class to default
        that.row.className = 'visitor-list-entry';
        // clear chat window
        that.visitorList.chatManager.clear(that.visitor);
    };

    this.getVisitor = function () {
        return that.visitor;
    };

    this.getId = function () {
        return that.visitor.getId();
    };

    // whether or not this visitor is connected to the server.
    this.getIsConnected = function () {
        return that.isConnectedToServer;
    };

    // tells the visitors chat session to open it's connection. The chat session will
    // only do this if it's connection has been closed. if it succeeds in reopening the
    // connection it will call the visitorConnectionCallback function
    this.openConnection = function () {
        that.visitor.getChatSession().openConnection();
    };

    // set whether or not this visitor is connected to the peer server
    this.setServerConnectionStatus = function (isConnected) {
        // if the visitor switched from disconnected to connected, tell the chat session
        // to reconnect with the visitor
        if (!that.isConnectedToServer && isConnected) {
            that.visitor.getChatSession().openConnection();
        }

        // save the connection status
        that.isConnectedToServer = isConnected;

        // if they are disconnected, tell the chat session to disallow sending messages
        updateChatSending();
    }

    // tells the chat session whether or not they should allow messages to be sent by the rep
    // if either the visitor is not currently connected to the server, or the chat connection
    // is broken, messages should be prevented
    function updateChatSending() {
        that.visitor.chatSession.setAllowMessageSending(that.isConnectedToServer && that.isChatConnected);
    }

    // the visitor's chat session calls this function whenever the chat connection
    // status changes. A bool representing the new status is passed in, with true for
    // connected and false for disconnected
    function visitorConnectionCallback(isConnected) {
        that.isChatConnected = isConnected;
        updateChatSending();

        // update row display to reflect connection status
        if (!that.isChatConnected) {
            hide();
        } else {
            show();
        }
    }

    function hide() {
        that.row.style.display = 'none';
        that.visitorList.hideVisitor(that);
        that.isSelected = false;
        // change class to default
        that.row.className = 'visitor-list-entry';
        // clear chat window
        that.visitorList.chatManager.clear(that.visitor);
    }

    function show() {
        that.row.style.display = 'block';
    }
}
