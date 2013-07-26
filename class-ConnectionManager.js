/*
 * The ConnectionManager keeps track of existing connections and assists in creating
 * new connections. You can explicitly create a new connection, or set a listener
 * that alerts you when another peer establishes a connection with this peer.
 * peer - Our peer object
 */

function MaqawConnectionManager(peer) {
    var that = this;
    this.peer = peer;
    this.visitors;
    this.representatives;

    // a list of all current connections, where the key is the connecting peer id
    // and the value is the MaqawConnection object
    this.connectionList = {};

    /* listen for peer js events */
    this.peer.on('open', function (id) {
        console.log("My id: " + id);
        maqawCookies.setItem('peerId', id, Infinity);
    });

    this.peer.on('clients', function (visitors) {
        console.log('visitors: ' + visitors.msg);
        that.visitors = visitors.msg;
    });

    this.peer.on('representatives', function (reps) {
        console.log('Reps: ' + reps.msg);
        that.representatives = reps.msg;
    });


    /* Set a callback function that will be called if a connection
     * is established with this peer. That callback function will
     * be passed a MaqawConnection object.
     */
    this.setConnectionListener = function (connectionListener, dataCallback, connectionCallback) {
        // use the peer onConnection event to listen for connections
        that.peer.on('connection', function (conn) {
            // when a peer connection is opened, use it to set up a MaqawConnection
            var maqawConnection = new MaqawConnection(that.peer, null, dataCallback, connectionCallback, conn);
            // return the new connection to the callback listener
            connectionListener(maqawConnection);
        });
    };

    /*
     * Create and return a new MaqawConnection object that connects to the
     * given id. The connectionCallback is a function that will be called
     * every time the state of the connection changes. Undetermined functionality
     * when you call this with the same id multiple times. Don't do it.
     */
    this.newConnection = function (id, dataCallback, connectionCallback) {
        var connection = new MaqawConnection(that, id, dataCallback, connectionCallback);
        that.connectionList[id] = connection;
        return connection;
    };

    /*
     * Get a connection for a specific id. If a connection exists, its MaqawConnection
     * object is return. If no connection exists for that id, undefined is returned
     */
    this.getConnection = function (id) {
        return that.connectionList[id];
    };

    /* Return an object that encapsulates the state of this manager, including
     * all connections it is maintaining. This state can later be loaded
     * using loadConnectionData.
     */
    this.getConnectionState = function () {

    };

    /*
     * Loads a connection data object that was created using getConnectionData
     * This clears any current state and connections and loads the connections
     * from the saved state
     */
    this.loadConnectionState = function (connectionData) {

    };


}