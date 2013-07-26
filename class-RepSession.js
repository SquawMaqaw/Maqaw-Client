/*
 RepSession manages all of the details of a logged in
 representatives session
 */
function MaqawRepSession(manager, rep) {
    this.maqawManager = manager;
    this.rep = rep;
    var that = this;

    /* Create dom elements to display the rep session */
    this.body = document.createElement("DIV");
    this.header = document.createElement("DIV");
    this.header.className = 'maqaw-default-client-header';

    // add text to header
    var header = document.createElement("DIV");
    header.innerHTML = 'Welcome!';
    header.className = 'maqaw-chat-header-text';
    this.header.appendChild(header);

    // create window for logged in users
    var loggedInWindow = document.createElement('DIV');
    this.body.appendChild(loggedInWindow);

    var loggedInChatWindow = document.createElement('DIV');
    loggedInChatWindow.id = 'maqaw-logged-in-chat-window';
    loggedInWindow.appendChild(loggedInChatWindow);

// create div to hold chat sessions
    var chatSessions = document.createElement('DIV');
    loggedInChatWindow.appendChild(chatSessions);

// add footer for logged in chat window
    var loggedInChatFooter = document.createElement('DIV');
    loggedInChatFooter.id = 'maqaw-logged-in-chat-footer';
    loggedInChatWindow.appendChild(loggedInChatFooter);

// add logout button
    var logoutButton = document.createElement('DIV');
    logoutButton.id = 'maqaw-logout-button';
    logoutButton.innerHTML = 'Logout';
    loggedInChatFooter.appendChild(logoutButton);
// add logout listener
    logoutButton.addEventListener('click', this.maqawManager.logoutClicked, false);

// create dashboard for logged in users
    var loggedInDashboard = document.createElement('DIV');
    loggedInDashboard.id = 'maqaw-logged-in-dashboard';
    loggedInWindow.appendChild(loggedInDashboard);

// create title for dashboard
    var dashboardTitle = document.createElement('DIV');
    dashboardTitle.id = 'maqaw-dashboard-title';
    dashboardTitle.innerHTML = 'Visitors';
    loggedInDashboard.appendChild(dashboardTitle);

// div to hold table of visitors
    var visitorListContainer = document.createElement('DIV');
    visitorListContainer.id = 'maqaw-visitor-list-container';
    loggedInDashboard.appendChild(visitorListContainer);

    // create new chat manager
    this.chatManager = new MaqawChatManager(chatSessions);

    // create new visitor list
    this.visitorList = new MaqawVisitorList(visitorListContainer, this);

    // takes an array of ids representing visitors on the site
    this.updateVisitorList = function(visitors){
        // pass the list along to the MaqawVisitorList so it can take care of updates
        that.visitorList.setVisitorList(visitors);
    }

    // takes an object created by getSessionData and attempts to restore
    // that session
    this.loadSessionData = function(sessionData){
         that.visitorList.loadListData(sessionData);
    }

    // returns an object representing the state of this session
    this.getSessionData = function(){
        // the only thing that really matters is the information on the visitors in the list
         return that.visitorList.getListData();
    }
}

MaqawRepSession.prototype.getBodyContents = function() {
    return this.body;
};

MaqawRepSession.prototype.getHeaderContents = function() {
    return this.header;
};

