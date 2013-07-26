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
 * attemptReconnect - True if this connection should try to reconnect to it's peer on connection loss
 * conn - Optional. This is a peerjs DataConnection object. If included, the MaqawConnection will use it
 *      instead of creating a new one.
 */
function MaqawConnection(peer, dstId, dataCallback, connectionCallback, attemptReconnect, conn) {
    var that = this;
    this.peer = peer;
    this.dstId = dstId;
    this.connectionCallback = connectionCallback;
    this.dataCallback = dataCallback;
    this.attempReconnect = attemptReconnect;

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
    // attach event listeners to our connection
    function setConnectionCallbacks() {
        // set up connection events for the connection
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
        });
    }

    /*
     * Handle data that was received by this connection. Extract any meta data we need
     * and pass the rest of it on to the data callback
     */
    function handleData(data) {
        // for now we are just sending text
        that.dataCallback(data);
    }

    /*
     * Update the status of the connection, and pass the status on to
     * the connectionListener
     */
    function setConnectionStatus(connectionStatus) {
        that.isConnected = Boolean(connectionStatus);
        that.connectionCallback(that.isConnected);
    }

    /*
     * Whether or not our peer is connected to the PeerServer. They will be briefly disconnected every time
     * they change pages or reload. This is a faster way of knowing that our connection is broken than
     * waiting for the DataConnection to alert us (which takes a few seconds). Once our peer reconnects to the
     * server we need to reopen our DataConnection with them.
     * connectionStatus - true if the peer is connected and false otherwise
     */
    this.setServerConnectionStatus = function (connectionStatus) {
        if (that.attempReconnect) {
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
        }
    };

    /*
     * Tries to open a DataChannel with our  peer. Will retry at a set interval for a set number
     * of attempts before giving up.
     */
    function attemptConnection() {
        // how many milliseconds we will wait until trying to connect again
        var retryInterval = 8000;

        //  The max number of times a connection will be attempted
        var retryLimit = 5;
        var numAttempts = 0;

        // create a function that will attempt to open a connection, and will retry
        // every retryInterval milliseconds until a connection is established
        // this function is immediately invoked
        (function tryOpeningConnection() {
            // start the connection opening process
            if (!that.isConnected && numAttempts < retryLimit) {
                numAttempts++;

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
     * Send text through this connection
     */
    this.sendText = function (text) {
        that.conn.send({
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

    }
}
