/*
 * A Visitor object represents a visitor on the site from the representative's point of view. Each visitor
 * has a row in the visitor display table where we can click on them to select or deselect them for chat. The
 * visitor object maintains all connection data that the rep needs to communicate with the visitor on the site.
 * id - the peerjs id of this visitor
 * info -An object containing information about this visitor, like name and email address.
 *      This is optional, but can be provided if we have previously saved it for later
 * visitorList - The MaqawVisitorList object storing this visitor
 */
function MaqawVisitor(id, visitorList, info) {
    var that = this;
    this.visitorList = visitorList;
    this.connectionManager = visitorList.maqawManager.connectionManager;
    this.id = id;
    this.info = null;
    if (info) {
        this.info = new MaqawVisitorInfo(info);
    }

    /* Set up visitor display row in table */
    // create row to display this visitor in the table
    // -1 inserts the row at the end of the table
    var row = this.visitorList.table.insertRow(-1);
    row.className = 'maqaw-visitor-list-entry';
    // the cell containing the visitor info
    var cell = document.createElement("td");
    row.appendChild(cell);
    // function to update the visitor info in the row when we get personalized data
    // from the visitor
    function updateRowInfo() {
        cell.innerHTML = '';
        var text = "visitor";
        // use personal information if we have it
        if (that.info) {
            text = that.info.name + " (" + that.info.email+")";
        }
        var textNode = document.createTextNode(text);
        cell.appendChild(textNode);
    }
    // update the row data now for the case that visitor info was loaded from storage
    updateRowInfo();

    // This function is passed any data that is received from the visitor peer
    // about their personal information
    function handleVisitorInfo(data) {
        // create a new VisitorInfo object with this data
        that.info = JSON.parse(data.info);
        // update the chat session name
        that.chatSession.setPeerName(that.info.name);
        //update the display in the visitor table
        updateRowInfo();
        // call the connectionStatusCallback so that this visitor can be
        //shown in the list now that we have their info
        connectionStatusCallback(that.isConnected);
        // send an acknowledgement back
        that.connection.send({
            type: MAQAW_DATA_TYPE.VISITOR_INFO,
            request: MAQAW_VISITOR_ENUMS.ACK
        });
    }

    // append row to the visitor table
    this.visitorList.tBody.appendChild(row);

    this.isSelected = false;

    // append click listener to row
    row.addEventListener('click', clickCallBack, false);
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
    this.chatSession = new MaqawChatSession(document.createElement("DIV"), sendTextFromChat, 'You', "Visitor");

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
            that.connection.sendReliable({
                type: MAQAW_DATA_TYPE.TEXT,
                text: text
            });
        }
    }

    /*
     * This function is passed to the MaqawConnection, which calls it whenever it receives data for us
     */
    function connectionDataCallback(data) {
        // handle text
        if (data.type === MAQAW_DATA_TYPE.TEXT) {
            that.chatSession.newTextReceived(data.text);
            // show an alert that new text has been received
            alertNewText();
        }
        if (data.type === MAQAW_DATA_TYPE.SCREEN) {
            that.mirror && that.mirror.data(data);
        }
        // information about the visitor
        if (data.type === MAQAW_DATA_TYPE.VISITOR_INFO) {
            handleVisitorInfo(data);
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
                    row.className = 'maqaw-alert-visitor';
                } else {
                    row.className = 'maqaw-visitor-list-entry';
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

            // TODO: Tell mirror to stop sending data

        } else {
            // cancel any timeout that was started
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }
            // only show this visitor if we have gotten their info
            if (that.info) {
                show();
            }
        }

        // if we were previously disconnected but are now connected then restart the mirror
        // if applicable
        if (!that.isConnected && connectionStatus) {
            that.mirror && that.mirror.connectionReset();
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
        row.className = 'maqaw-selected-visitor';
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
        row.className = 'maqaw-visitor-list-entry';
        // clear chat window
        that.visitorList.chatManager.clear(that);
    };

    this.requestScreen = function () {
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
    };

    /*
     * Hide this visitor from being in the visitor table. Deselect it if applicable
     */
    function hide() {
        that.isSelected = false;
        // change class to default
        row.className = 'maqaw-visitor-list-entry';
        row.style.display = 'none';
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
        row.style.display = 'block';
    }
}

/*
 * Store information about this visitor
 */
function MaqawVisitorInfo(info) {
    this.name = info.name;
    this.email = info.email;
}
