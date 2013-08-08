/*
 MaqawManager is the top level class for managing the Maqaw client
 */
function MaqawManager(options, display) {
    var that = this,
        host = 'localhost',
        port = 3001;

    // the key that peers will use to connect to each other on the peer server
    this.key = options.key;
    this.chatName = options.name;

    // list of all visitors connected to the server
    this.visitors = [];

    // this id is used whenever the client makes a connection with peerjs
    this.id = maqawCookies.getItem('peerId');
    console.log("inside of cookies, the peerid is");
    console.log(this.id);
    // an array of ids of representatives that are available for chat
    this.maqawDisplay = display;
    this.visitorSession;
    this.repSession;

    // a MaqawLoginPage object that can be used to login with rep details
    this.loginPage;

    if (this.id) {
        //  peer id has been stored in the browser. Use it
        this.peer = new MaqawPeer(this.id, {key: this.key, host: host, port: port});
    } else {
        //  No peer id cookie found. Retrieve new id from browser
        this.peer = new MaqawPeer({key: this.key, host: host, port: port});
    }

    // initialize the connection manager
    this.connectionManager = new MaqawConnectionManager(this.peer);

    /* listen for peer js events */
    this.peer.on('open', function (id) {
        console.log("My id: " + id);
        that.id = id
        that.peer.id = id;
        maqawCookies.setItem('peerId', id, Infinity);
    });

    this.peer.on('visitors', function (visitors) {
        console.log('visitors: ' + visitors.msg);
        console.log(visitors.msg)
        that.visitors = visitors.msg;
        that.handleVisitorList(that.visitors);
    });

    this.peer.on('representatives', function (reps) {
        console.log('representatives');
        console.log('Reps: ' + reps.msg);
        console.log(reps.msg);
        that.representatives = reps.msg;
    });

    /*
     * Receives an array of visitors from the Peer Server and passes
     * the information along to VisitorList and ConnectionManager
     */
    this.handleVisitorList = function (visitors) {
        that.repSession && that.repSession.visitorList.setVisitorList(visitors);
        that.connectionManager.setVisitors(visitors);
    };

    this.screenShareClicked = function(event) {
      event.preventDefault();  
      event.stopPropagation();
      
    };

    // function called the VisitorSession when the login button is clicked
    this.loginClicked = function () {
        // create and display a new LoginPage object if one doesn't already exist
        if (!that.loginPage) {
            that.loginPage = new MaqawLoginPage(that);
        }
        that.maqawDisplay.setHeaderContents(that.loginPage.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.loginPage.getBodyContents());
    };


    this.logoutClicked = function () {
        // clear cookies and local data for the rep
        maqawCookies.removeItem('maqawRepLoginCookie');
        localStorage.removeItem('maqawRepSession');
        that.showVisitorSession();
    };

    // displays the saved visitor session
    this.showVisitorSession = function () {
        that.maqawDisplay.setHeaderContents(that.visitorSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.visitorSession.getBodyContents());
    };

    // tries to load a previously saved visitor session. If no session can be found
    // a new one is created
    this.startVisitorSession = function () {
        // create new visitor session
        var visitorSession = new MaqawVisitorSession(that);
        // try to pull previously saved session data
        var storedSessionData = JSON.parse(localStorage.getItem('maqawVisitorSession'));
        // if previous data was found load it into the visitorSession
        if (storedSessionData) {
            visitorSession.loadSessionData(storedSessionData);
        }
        // save the session
        that.visitorSession = visitorSession;
    };

    // Creates and displays a new MaqawRepSession using the MaqawRepresentative object that
    // is passed in.
    this.startNewRepSession = function (rep) {
        that.repSession = new MaqawRepSession(that, rep);

        // if we are loading a saved session, retrieve stored data
        if (that.loadPreviousRepSession) {
            // attempt to reload previous rep session data
            var storedSessionData = JSON.parse(localStorage.getItem('maqawRepSession'));
            // if previous data was found load it into the repSession
            if (storedSessionData) {
                that.repSession.loadSessionData(storedSessionData);
            }
        }

        // update the session with the current list of visitors
        that.peer.poll('VISITORS');
        that.repSession.updateVisitorList(that.visitors);

        // display the rep session
        that.maqawDisplay.setHeaderContents(that.repSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.repSession.getBodyContents());
    };

    // checks for a login cookie for a rep. If one is found we attempt to reload the session
    // return true if a rep session is successfully loaded and false otherwise
    this.loadRepSession = function () {
        // check for a login cookie, return false if one can't be found
        var loginCookie = maqawCookies.getItem('maqawRepLoginCookie');
        if (loginCookie === null) {
            return false;
        }

        // otherwise reload the rep session
        if (!that.loginPage) {
            that.loginPage = new MaqawLoginPage(that);
        }
        that.loginPage.loginWithParams(loginCookie);
        that.loadPreviousRepSession = true;
        return true;
    };

    // setup an event listener for when the page is changed so that we can save the
    // visitor session
    function saveVisitorSession() {
        if (typeof that.visitorSession !== 'undefined') {
            var sessionData = that.visitorSession.getSessionData();
            var jsonSession = JSON.stringify(sessionData);
            localStorage.setItem('maqawVisitorSession', jsonSession);
        }
    }

    // save the logs and details of the rep session (if there is one)
    // in local storage so it can be reloaded on page change
    function saveRepSession() {
        if (typeof that.repSession !== 'undefined') {
            var sessionData = that.repSession.getSessionData();
            var jsonSession = JSON.stringify(sessionData);
            console.log(jsonSession);
            localStorage.setItem('maqawRepSession', jsonSession);

        }
    }

    function saveSession() {
        saveVisitorSession();
        saveRepSession();

    }

    // Add listener to save session state on exit so it can be reloaded later.
    window.addEventListener('unload', saveSession, false);
}
