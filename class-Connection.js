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

    // queue of messages to send reliably
    this.reliableQueue = [];
    // message that we are currently trying to send
    this.reliableMessage = null;
    // timeout to resend message when we don't hear back
    this.reliableTimeout = null;
    // keep track of which messages we have acked and sent
    this.ackNo = 0;
    this.seqNo = 0;

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
        this.conn = this.peer.connect(this.dstId, {reliable: true});
    }

    // check the current status of the connection. It may already be open if one was passed in
    setConnectionStatus(this.conn.open);

    setConnectionCallbacks();

    /*
     * Handle data that was received by this connection. Extract any meta data we need
     * and pass the rest of it on to the data callback
     */
    function handleData(data) {
        // if this is a reliable message, handle the acknowledgement
        if (data.isReliable) {
            // check if this message is an ack and handle it if it is
            var hash = data.hash;
            // if there is no data, then the message is an ack
            if (!data.data) {
                // if this hash matches the message we sent, we can stop
                // sending it and start sending the next one
                if(that.reliableMessage && that.reliableMessage.hash === hash){
                    // cancel timeout to resend this message
                    if(that.reliableTimeout){
                        clearTimeout(that.reliableTimeout);
                        that.reliableTimeout = null;
                    }
                    that.reliableMessage = null;
                    // send the next message in the queue
                    that.sendReliable();
                }
                // no data to process so we just return
                return;
            }

            else {
                sendAck(hash);
                // remove the reliable wrapper and process the data normally
                data = data.data;
            }
        }
        // pass the data to any onData callbacks that are binded
        var i, dataLen = that.dataDirectives.length;
        for (i = 0; i < dataLen; i++) {
            that.dataDirectives[i](data);
        }
    }

    /*
     * Send our peer an acknowledgement of the reliable messages that we have received.
     * Our ackNo is the next seqNo that we are expecting from our peer
     */
    function sendAck(hash) {
        that.conn.send({
            isReliable: true,
            hash: hash
        });
    }

    /*
     * Update the status of the connection, and pass the status on to
     * the connectionListener
     */
    function setConnectionStatus(connectionStatus) {
        var i, len = that.changeDirectives.length;

        // alert all of the binded callbacks
        for (i = 0; i < len; i++) {
            that.changeDirectives[i](connectionStatus);
        }

        // save the status
        that.isConnected = connectionStatus;
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
                if (that.conn) {
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
    this.newConnectionRequest = function (conn) {
        console.log("erasing old connection");
        // close the old connection
        if (that.conn) {
            that.conn.close();
        }

        // set up the new connection with callbacks
        that.conn = conn;
        setConnectionCallbacks();
    };

    /*
     * Unreliable send function. No guarantee that the peer
     * receives this data
     */
    this.send = function (data) {
        that.conn.send({
            isReliable: false,
            data: data
        });
    };

    /*
     * Reliably sends data to the peer. A queue of items to send is made, and each item is resent
     * until an ack is received. When this is called the next item in the queue is sent. If a data
     * argument is included it is added to the queue.
     * data - Optional message to add to the sending queue
     */
    this.sendReliable = function (data) {
        // add data to queue
        if (data) {
            that.reliableQueue.push(data);
        }

        // send the first message, if a message isn't already being sent
        // and if the queue isn't empty
        if (!that.reliableMessage && that.reliableQueue.length > 0) {
            that.reliableMessage = {
                isReliable: true,
                hash: maqawHash(Date.now()),
                data: that.reliableQueue.shift()
            };

            (function send() {
                // if the connection is closed, try to open it
                if (!that.conn.open) {
                    attemptConnection();
                } else {
                    that.conn.send(that.reliableMessage);
                }
                console.log("sending reliable");
                // try again soon
                that.reliableTimeout = setTimeout(send, 10);
            })();
        }
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
            handleOpen();
        });

        that.conn.on('data', function (data) {
            // if we are receiving data the connection is definitely open
            setConnectionStatus(true);
            handleData(data);
        });

        that.conn.on('close', function (err) {
            setConnectionStatus(false);
            handleClose();
        });

        that.conn.on('error', function (err) {
            console.log("Connection error: " + err);
            var i, errorLen = that.errorDirectives.length;
            for (i = 0; i < errorLen; i++) {
                that.errorDirectives[i](err);
            }
            // try to reopen connection
            setConnectionStatus(false);
            attemptConnection();
        });
    }

    function handleOpen() {
        var i, len = that.openDirectives.length;
        for (i = 0; i < len; i++) {
            that.openDirectives[i]();
        }
    }

    function handleClose() {
        var i, len = that.closeDirectives.length;
        for (i = 0; i < len; i++) {
            that.closeDirectives[i]();
        }
    }
}
