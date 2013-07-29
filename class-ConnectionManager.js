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
    this.connectionDirectives = [];


    // a list of all connections that we've created, where the key is the connecting peer id
    // and the value is the MaqawConnection object
    this.connectionList = {};

    // a list of connections that were the result of incoming requests
    this.incomingConnections = {};

    /*
     * Passed the list of visitors connected to the PeerServer. Update connections
     * based on whether or not the associated visitor is connected
     */
    this.setVisitors = function (visitors) {
        // go through our list of connections and update their connection status
        for (var id in that.connectionList) {
            var conn = that.connectionList[id];
            // indexOf returns -1 if the array does not contain the id
            var index = visitors.indexOf(id);
            if (index !== -1) {
                conn.setServerConnectionStatus(true);
            } else {
                conn.setServerConnectionStatus(false);
            }
        }
    };

    this.on = function (_event, directive) {
        if (_event === 'connection') this.connectionDirectives.push(directive);

        return this;
    };

    /*
     * Listens for incoming connection requests. If we've already setup a MaqawConnection
     * with the incoming peer, update the MaqawConnection with the new peerjs connection.
     * Otherwise create and return a new MaqawConnection with the peerjs connection.
     */
    this.peer.on('connection', function (conn) {
        // check for an existing connection with this peer
        var existingConn = that.incomingConnections[conn.peer];
        if (existingConn) {
            existingConn.newConnectionRequest(conn);
        }
        // otherwise create a new MaqawConnection
        else {
            var i, len = that.connectionDirectives.length,
                maqawConnection = new MaqawConnection(that.peer, null, conn);
            for (i = 0; i < len; i++) {
                that.connectionDirectives[i](maqawConnection);
            }
            // save the connection in our list
            that.incomingConnections[conn.peer] = maqawConnection;
        }
    });

    /*
     * Create and return a new MaqawConnection object that connects to the
     * given id. The connectionCallback is a function that will be called
     * every time the state of the connection changes. Undetermined functionality
     * when you call this with the same id multiple times. Don't do it.
     */
    this.newConnection = function (id) {
        var connection = new MaqawConnection(that.peer, id);
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

}
