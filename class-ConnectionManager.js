/**
 * Created By: Eli
 * Date: 7/24/13
 */

function MaqawConnectionManager(peer) {
    var that = this;
    this.peer = peer;

    // a list of all current connections, where the key is the connecting peer id
    // and the value is the MaqawConnection object
    this.connectionList = {};

    // this function will be called if another peer tries to connection with us
    this.connectionListener;

    /*
     * Create and return a new MaqawConnection object that connects to the
     * given id. The connectionCallback is a function that will be called
     * every time the state of the connection changes.
     */
    this.newConnection = function(id, dataCallback, connectionCallback){
        var connection = new MaqawConnection(that, id, dataCallback, connectionCallback);
        that.connectionList['id'] = connection;
        return connection;
    };

    /*
     * Get a connection for a specific id. If a connection exists, its MaqawConnection
     * object is return. If no connection exists for that id, false is returned
     */
    this.getConnection = function(id){
        return false;
    };

    /* Set a callback function that will be called if a connection
     * is established with this peer. That callback function will
     * be passed a MaqawConnection object.
     */
    this.setConnectionListener = function(connectionListener){
        that.connectionListener = connectionListener;
    };

    /* Return an object that encapsulates the state of this manager, including
     * all connections it is maintaining. This state can later be loaded
     * using loadConnectionData.
     */
    this.getConnectionState = function(){

    };

    /*
     * Loads a connection data object that was created using getConnectionData
     * This clears any current state and connections and loads the connections
     * from the saved state
     */
    this.loadConnectionState = function(connectionData){

    };

}