/*
 * A Visitor object represents a visitor on the site from the representative's point of view. Each visitor
 * has a row in the visitor display table where we can click on them to select or deselect them for chat. The
 * visitor object maintains all connection data that the rep needs to communicate with the visitor on the site.
 * id - the peerjs id of this visitor
 * name - the name we are using for this visitor
 * repSession - the MaqawRepSession object
 */
function MaqawVisitor(id, name, repSession) {
    var that = this;
    this.repSession = repSession;
    this.visitorList = repSession.visitorList;
    this.id = id;
    this.name = name;

    /* Set up visitor display row in table */
    // create row to display this visitor in the table
    this.row = this.visitorList.table.insertRow(-1);
    this.row.className = 'maqaw-visitor-list-entry';
    // the row contains a single cell containing the visitor name
    var cell = document.createElement("td");
    var cellText = document.createTextNode(this.name);
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

    /* ************************************* */

    // whether or not we have an open connection with this visitor. Default to false
    // until we can verify a connection is open
    this.isConnected = false;

    // each visitor has a unique chat session
    this.chatSession = new MaqawChatSession(document.createElement("DIV"), sendTextFromChat, 'You', this.name);

    // create a new connection
    this.connection = this.repSession.maqawManager.connectionManager.newConnection(this.id, connectionDataCallback, connectionStatusCallback, true);

    /*
     * This function is passed to the chat session, which calls it every time it has text
     * to send across the connection
     */
    function sendTextFromChat(text) {
        if (!that.connection || !that.connection.isConnected) {
            console.log("Visitor Error: Cannot send text. Bad connection");
        } else {
            that.connection.sendText(text);
        }
    }

    /*
     * This function is passed to the MaqawConnection, which calls it whenever it receives data for us
     */
    function connectionDataCallback(data) {
        // handle text
        if (data.text) {
            that.chatSession.newTextReceived(data.text);
        }
    }

    /*
     * Passed to MaqawConnection and called whenever the connection's status changes
     */
    function connectionStatusCallback(connectionStatus) {
        that.isConnected = connectionStatus;

        // tell the chatsession whether or not to accept text based on the connection status
        that.chatSession.setAllowMessageSending(connectionStatus);

        // update row display to reflect connection status
        if (!connectionStatus) {
            hide();
        } else {
            show();
        }
    }



    /*
     * Change the row that displays this visitor to reflect that it's been selected.
     * Tell the ChatManager to display this Visitor's ChatSession
     */
    this.select = function () {
        that.isSelected = true;
        // change class to selected
        that.row.className = 'maqaw-selected-visitor';
        // show visitor chat window
        that.visitorList.chatManager.showVisitorChat(that)
    };

    /*
     * Update the visitor display to not show this visitor as selected.
     * Tell the ChatManager to not display this visitor's ChatSession
     */
    this.deselect = function () {
        that.isSelected = false;
        // change class to default
        that.row.className = 'maqaw-visitor-list-entry';
        // clear chat window
        that.visitorList.chatManager.clear(that);
    };

    /*
     * Hide this visitor from being in the visitor table. Deselect it if applicable
     */
    function hide() {
        that.isSelected = false;
        // change class to default
        that.row.className = 'maqaw-visitor-list-entry';
        that.row.style.display = 'none';
        // tell the VisitorList that we are going to hide this visitor so that it can deselect
        // it if necessary
        that.visitorList.hideVisitor(that);
        // clear chat window
        that.visitorList.chatManager.clear(that);
    }

    /*
     * Show this visitor in the visitor table
     */
    function show() {
        that.row.style.display = 'block';
    }
}