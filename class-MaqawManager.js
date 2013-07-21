/*
 MaqawManager is the top level class for managing the Maqaw client
 */
function MaqawManager(display) {
    var that = this,
        key = 'cat',
        host = 'ec2-54-214-126-127.us-west-2.compute.amazonaws.com',
        port = 3000;

    // this id is used whenever the client makes a connection with peerjs
    this.id = maqawCookies.getItem('peerId');
    this.key = key;
    // an array of ids of representatives that are available for chat
    this.representatives;
    this.maqawDisplay = display;
    this.visitorSession;
    this.repSession;
    // a MaqawLoginPage object that can be used to login with rep details
    this.loginPage = new MaqawLoginPage(this);
    // the most recent list of visitors from the server
    this.visitors = [];


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
        console.log("My id: "+id);
        maqawCookies.setItem('peerId', id, Infinity);
    });

    this.peer.on('clients', function (visitors) {
        console.log('visitors: ' + visitors.msg);
        that.visitors = visitors.msg;
        that.repSession && that.repSession.updateVisitorList(visitors.msg);
    });

    this.peer.on('representatives', function (reps) {
        console.log('Reps: ' + reps.msg);
        that.representatives = reps.msg;
        updateReps();
    });

    this.loginClicked = function () {
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
                // update the loaded data with the current visitor list
                that.repSession.updateVisitorList(that.visitors);
            }
        }

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
        that.loginPage.loginWithParams(loginCookie);
        that.loadPreviousRepSession = true;
        return true;
    }


    // updates the status of the available reps for visitor chat
    function updateReps() {
        that.visitorSession.setIsRepAvailable(that.representatives.length !== 0);
    }

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

    window.addEventListener('unload', saveSession, false);
}

// takes a MaqawVisitorSession object and loads it as the current visitor session
MaqawManager.prototype.setVisitorSession = function (visitorSession) {
    this.visitorSession = visitorSession;
};




