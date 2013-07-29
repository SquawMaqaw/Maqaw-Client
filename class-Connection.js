/**
 * Created By: Eli
 * Date: 7/24/13
 */

/*
 * This is a wrapper class for a peerjs connection. It gracefully handles making the connection,
 * reopening the connection when it drops, saving and loading connection state, and reliably transferring
 * data over the connection.
 *
 * peer - The Peer object representing our client
 * dstId - The peer id we want to connect with
 * dataCallback - This function is passed any data that the connection receives
 * connectionCallback - This function is called whenever the connection status changes. It is passed true
 *      if the connection is open and false otherwise
 * conn - Optional. This is a peerjs DataConnection object. If included, the MaqawConnection will use it
 *      instead of creating a new one.
 */

function MaqawConnection(peer, dstId, conn) {
    var that = this;
    this.peer = peer;
    this.dstId = dstId;

    //  Callback arrays //
    this.closeDirectives = [];
    this.openDirectives = [];
    this.dataDirectives = [];
    this.errorDirectives = [];
    this.changeDirectives = [];
    //          

    // whether or not this connection is open. True if open and false otherwise
    this.isConnected = false;

    // whether or not the peer we are talking to has an established connection with the PeerServer.
    // Their connection with the server will drop whenever they leave the page
    this.isPeerConnectedToServer = true;

    // the peerjs DataConnection object we are using
    this.conn;

    // if a DataConnection was provided then use it. Otherwise make a new one
    if (conn) {
        this.conn = conn;
    } else {
        this.conn = this.peer.connect(this.dstId);
    }

    // check the current status of the connection. It may already be open if one was passed in
    setConnectionStatus(this.conn.open);

    setConnectionCallbacks();

    /*
     * Handle data that was received by this connection. Extract any meta data we need
     * and pass the rest of it on to the data callback
     */
    function handleData(data) {
        // for now we are just sending text
        var i, dataLen = that.dataDirectives.length;
        for (i = 0; i < dataLen; i++) {
            that.dataDirectives[i](data);
        }
    }

    /*
     * Update the status of the connection, and pass the status on to
     * the connectionListener
     */
    function setConnectionStatus(connectionStatus) {
        var i,
            changeLen = that.changeDirectives.length,
            openLen = that.openDirectives.length,
            closeLen = that.closeDirectives.length;

        for (i = 0; i < changeLen; i++) {
            that.changeDirectives[i](connectionStatus);
        }

        if (connectionStatus === false) {
            for (i = 0; i < closeLen; i++) {
                that.closeDirectives[i](connectionStatus);
            }
        } else if (connectionStatus === true) {
            for (i = 0; i < openLen; i++) {
                that.openDirectives[i](connectionStatus);
            }
        }
        that.isConnected = Boolean(connectionStatus);
    }

    /*
     * Whether or not our peer is connected to the PeerServer. They will be briefly disconnected every time
     * they change pages or reload. This is a faster way of knowing that our connection is broken than
     * waiting for the DataConnection to alert us (which takes a few seconds). Once our peer reconnects to the
     * server we need to reopen our DataConnection with them.
     * connectionStatus - true if the peer is connected and false otherwise
     */
    this.setServerConnectionStatus = function (connectionStatus) {
        // if our peer is not connected to the server, disconnect our DataChannel with them
        if (!connectionStatus) {
            setConnectionStatus(false);
        }
        // if the peer was previously disconnected but is now connected, try to reopen a DataChannel
        // with them
        if (!that.isPeerConnectedToServer && connectionStatus) {
            attemptConnection();
        }

        // save connection status
        that.isPeerConnectedToServer = connectionStatus;
    };

    /*
     * Tries to open a DataChannel with our  peer. Will retry at a set interval for a set number
     * of attempts before giving up.
     */
    function attemptConnection() {
        // how many milliseconds we will wait until trying to connect again

        /* TODO: Exponential backoff instead? */

        var retryInterval = 8000;

        //  The max number of times a connection will be attempted
        var retryLimit = 5;
        var numAttempts = 0;

        /** TODO: We should look into running web workers **/

            // create a function that will attempt to open a connection, and will retry
            // every retryInterval milliseconds until a connection is established
            // this function is immediately invoked
        (function tryOpeningConnection() {
            // start the connection opening process
            if (!that.isConnected && numAttempts < retryLimit) {
                numAttempts++;

                // close old connection
                if(that.conn){
                    that.conn.close();
                }

                // open a new connection
                that.conn = that.peer.connect(that.dstId);

                // attach event listeners to our new connection
                setConnectionCallbacks();

                // schedule it to try again in a bit. This will only run
                // if our latest connection doesn't open
                setTimeout(tryOpeningConnection, retryInterval);
            }
        })();
    }

    /*
     * Handle a new peerjs connection request from our peer
     */
    this.newConnectionRequest = function(conn){
        console.log("erasing old connection");
        // close the old connection
        if(that.conn){
            that.conn.close();
        }

        // set up the new connection with callbacks
        that.conn = conn;
        setConnectionCallbacks();
    };

    /*
     * Send text through this connection
     */
    this.sendText = function (text) {
        that.conn.send({
            'type': 'text',
            'text': text
        });
    };

    /*
     * Initializes a screen sharing session
     */
    this.startScreenShare = function (options) {

    };

    /*
     * Sends screen data
     */
    this.sendScreen = function (screenData) {

    };

    this.on = function (_event, directive) {
        // bind callback
        if (_event === 'data')   this.dataDirectives.push(directive);
        else if (_event === 'open')   this.openDirectives.push(directive);
        else if (_event === 'close')  this.closeDirectives.push(directive);
        else if (_event === 'error')  this.errorDirectives.push(directive);
        else if (_event === 'change') this.changeDirectives.push(directive);

        return this;
    };

    function setConnectionCallbacks() {
        that.conn.on('open', function () {
            setConnectionStatus(true);
        });

        that.conn.on('data', function (data) {
            // if we are receiving data the connection is definitely open
            setConnectionStatus(true);
            handleData(data);
        });

        that.conn.on('close', function (err) {
            setConnectionStatus(false);
        });

        that.conn.on('error', function (err) {
            console.log("Connection error: " + err);
            var i, errorLen = that.errorDirectives.length;
            for (i = 0; i < errorLen; i++) {
                that.errorDirectives[i](err);
            }
        });
    }
}
