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
 */
function MaqawConnection(peer, dstId, dataCallback, connectionCallback) {
    this.peer = peer;
    this.dstId = dstId;
    this.connectionCallback = connectionCallback;
    this.dataCallback = dataCallback;

    /* Get the connection status.
     * Returns true if the connection is open and false otherwise
     */
    this.isConnected = function() {
        return false;
    };

    /*
     * Send text through this connection
     */
    this.sendText = function(text){

    };

    /*
     * Initializes a screen sharing session
     */
    this.startScreenShare = function(options){

    };

    /*
     * Sends screen data
     */
    this.sendScreen = function(screenData){

    }
}
