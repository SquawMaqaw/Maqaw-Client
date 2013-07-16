/*
 MaqawManager is the top level class for managing the Maqaw client
 */
function MaqawManager(display) {
    var that = this,
        key = 'cat',
        host = 'ec2-54-212-11-221.us-west-2.compute.amazonaws.com',
        port = 3000;

    // this id is used whenever the client makes a connection with peerjs
    this.id = docCookies.getItem('peerId');
    this.key = key;
    // an array of all visitors on the site. This is kept updated with web sockets
    this.visitors;
    // an array of ids of representatives that are available for chat
    this.representatives;
    this.maqawDisplay = display;
    this.visitorSession;
    this.repSession;
    // a LoginPage object that is initialized the first time the login page is visited
    this.loginPage;


    if (this.id) {
        //  peer id has been stored in the browser. Use it
        this.peer = new Peer(this.id, {key: key, host: host, port: port});
    } else {
        //  No peer id cookie found. Retrieve new id from browser
        this.peer = new Peer({key: key, host: host, port: port});
    }

    /* listen for peer js events */
    this.peer.on('open', function (id) {
        that.id = id;
        console.log(id);
        docCookies.setItem('peerId', id, Infinity);
    });

    this.peer.on('clients', function (clients) {
        console.log('clients: '+clients.msg);
        that.visitors = parseVisitors(clients.msg);
        that.repSession && that.repSession.setVisitors();
    });

    this.peer.on('representatives', function (reps) {
        console.log('Reps: '+reps.msg);
        that.representatives = reps.msg;
        updateReps();
    });

    this.loginClicked = function () {
        if(!that.loginPage) that.loginPage = new LoginPage(that);
        that.maqawDisplay.setHeaderContents(that.loginPage.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.loginPage.getBodyContents());
    }


    this.logoutClicked = function () {
        that.showVisitorSession();
    }

    this.showVisitorSession = function() {
        that.maqawDisplay.setHeaderContents(that.visitorSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.visitorSession.getBodyContents());
    }

    // changes the maqaw client to display a Representative Session
    // a Representative object can be passed in to start a new rep session
    // for that rep. If no representative object is passed in an existing rep
    // session is used. If no previous rep session exists, nothing is done
    // rep - A
    this.showRepSession = function(rep) {
     var repSession;
        // if a rep was passed, create a new session for it
        if(typeof rep !== "undefined") {
            repSession = new RepSession(that, rep);
            that.repSession = repSession;
        }
        // otherwise check if an existing session can be used
        else if(typeof that.repSession !== "undefined") {
            repSession = that.repSession;
        }
        // otherwise we have no rep to work with so just return
        else {
            return;
        }

        // display the rep session
        that.maqawDisplay.setHeaderContents(that.repSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.repSession.getBodyContents());
    }

    // take the list of visitors from the server and parse them into Visitor objects
    function parseVisitors(visitors) {
        var list = [];
        for (var i = 0; i < visitors.length; i++) {
            list.push(new Visitor(that, 'Visitor ' + i, visitors[i]));
        }
        return list;
    }

    // updates the status of the available reps for visitor chat
    function updateReps() {
        that.visitorSession.setIsRepAvailable(that.representatives.length !== 0);
    }
}


MaqawManager.prototype.setVisitorSession = function(visitorSession) {
    this.visitorSession = visitorSession;
}



