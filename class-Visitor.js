/*
 * A Visitor object represents a visitor on the site from the representative's point of view. Each visitor
 * has a row in the visitor display table where we can click on them to select or deselect them for chat. The
 * visitor object maintains all connection data that the rep needs to communicate with the visitor on the site.
 * id - the peerjs id of this visitor
 * name - the name we are using for this visitor
 * repSession - the MaqawRepSession object
 */
function MaqawVisitor(id, name, visitorList) {
    var that = this;
    this.visitorList = visitorList;
    this.connectionManager = visitorList.maqawManager.connectionManager;
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
    this.connection = this.connectionManager.newConnection(this.id);

    this.mirror = new Mirror({'conn': this.connection});

    this.connection.on('data', connectionDataCallback)
        .on('change', connectionStatusCallback);

    // create a new screen sharing session after connection is made //

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
            // show an alert that new text has been received
            alertNewText();
        }
        if (data.type === 'SCREEN') {
          that.mirror && that.mirror.data(data);
        }
    }

    /*
     * Display an alert to the rep that new text has been received
     */
    function alertNewText() {
        // only show an alert if the visitor is not currently selected
        var flashSpeed = 1000;
        var on = true;
        (function flashRow() {
            if (!that.isSelected) {
                if (on) {
                    that.row.className = 'maqaw-alert-visitor';
                } else {
                    that.row.className = 'maqaw-visitor-list-entry';
                }
                on = !on;
                setTimeout(flashRow, flashSpeed);
            }
        })();

    }

    /*
     * Passed to MaqawConnection and called whenever the connection's status changes
     */
    function connectionStatusCallback(connectionStatus) {
        // tell the chatsession whether or not to accept text based on the connection status
        that.chatSession.setAllowMessageSending(connectionStatus, 'Waiting for visitor...');

        // update row display to reflect connection status
        var timeoutId;
        if (!connectionStatus) {
            // if the connection was previously active, allow a few seconds for the visitor to
            // return before hiding them in the list
            var timeout = 5000;
            timeoutId = setTimeout(function () {
                // if the visitor is still not connected after the timeout period then hide them
                if (!that.isConnected) {
                    hide();
                }
                timeoutId = null;
            }, timeout);

        } else {
            // cancel any timeout that was started
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            show();
        }

        // save status
        that.isConnected = connectionStatus;
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

    this.requestScreen = function() {
      // Initialize new mirror if it exists. 
      // pass mirror the connection.
      // ----------------------------------
      // 
      if (this.mirror) {
        // Start sharing dat screen //
        this.mirror.requestScreen();
      } else {
        // unable to share
       console.log("mirror unable to initialize"); 
      }
    }

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
