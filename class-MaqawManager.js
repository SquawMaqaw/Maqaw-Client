/*
 MaqawManager is the top level class for managing the Maqaw client
 */
function MaqawManager(display) {
    var that = this,
        key = 'cat',
        host= 'ec2-54-212-11-221.us-west-2.compute.amazonaws.com',
        port= 3000;

    // this id is used whenever the client makes a connection with peerjs
    this.id = docCookies.getItem('peerId');
    // an array of all visitors on the site. This is kept updated with web sockets
    this.visitors;
    // an array of ids of representatives that are available for chat
    this.representatives;
    // The visitor or representative session currently being used
    this.activeSession = undefined;
    this.maqawDisplay = display;

    if (this.id) {
      //  peer id has been stored in the browser. Use it
      this.peer = new Peer(this.id, {key: key, host: host, port: port});
    } else {
      //  No peer id cookie found. Retrieve new id from browser
      this.peer = new Peer({key: key, host: host, port: port});
    }

    /* listen for peer js events */
    this.peer.on('open', function(id) {
        that.id = id;
        docCookies.setItem('peerId', id, Infinity);
    });

    this.peer.on('clients', function(clients) {
        console.log(clients.msg);
        that.visitors = parseVisitors(clients.msg);
        that.activeSession && that.activeSession.setVisitors && that.activeSession.setVisitors();
    });

    this.peer.on('representatives', function(reps) {
        console.log(reps.msg);
        that.representatives = reps.msg;
        updateReps();
    });

    this.updateDisplay = function () {
        that.maqawDisplay.setHeaderContents(that.activeSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.activeSession.getBodyContents());
    }

    this.loginClicked = function () {
        /*
        maqawAjaxPost(host+':'+port, params, function(){
            that.clientSession = that.activeSession;
            that.activeSession = new RepSession(that);
            that.updateDisplay();
        });     */
        $.ajax({
            type: 'POST',
            url: "http://ec2-54-212-11-221.us-west-2.compute.amazonaws.com:3000/login",
            data: { username: 'additt', password: 'MapleAdditt', user : { id: that.id, key: 'cat'} },
            success: function() {
                that.clientSession = that.activeSession;
                that.activeSession = new RepSession(that);
                that.updateDisplay();
            }
        });
    }

    this.logoutClicked = function () {
        that.repSession = that.activeSession;
        that.activeSession = that.clientSession;
        that.updateDisplay();
    }

    // take the list of visitors from the server and parse them into Visitor objects
    function parseVisitors(visitors){
        var list = [];
        for(var i = 0; i < visitors.length; i ++){
            list.push(new Visitor(that, 'Visitor '+i, visitors[i]));
        }
        return list;
    }

    // updates the status of the available reps for visitor chat
    function updateReps(){
        // this function only works for ClientSession
      that.activeSession.setIsRepAvailable(that.representatives.length !== 0);
    }
}

MaqawManager.prototype.setActiveSession = function (session) {
    this.activeSession = session;
}


