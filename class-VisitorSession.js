/*
 VisitorSession manages a visitor's interaction with the Maqaw client. It contains the connection
 with a representative, and handles all display and transfer of communication with that rep.
 */
function MaqawVisitorSession(manager) {
    var that = this;
    this.chatSession;
    this.maqawManager = manager;

    // the status of our connection with a peer. True for open and false for closed
    // Defaults to false until we can verify that a connection has been opened
    this.isConnected = false;

    // initialize header container for this session
    this.header = document.createElement('DIV');
    this.header.className = 'maqaw-default-client-header';

    // initialize body container
    this.body = document.createElement('DIV');

    /* Create elements that make up chat window */
    this.loginHeader = document.createElement('DIV');
    this.loginHeader.innerHTML = "Chat with me!";
    this.loginHeader.className = 'maqaw-chat-header-text';

    // create div to hold chat info
    this.visitorChatWindow = document.createElement('DIV');
    this.visitorChatWindow.className = 'maqaw-client-chat-window';

    // add chat session
    var chatSessionContainer = document.createElement("DIV");
    this.visitorChatWindow.appendChild(chatSessionContainer);
    this.chatSession = new MaqawChatSession(chatSessionContainer, sendTextFromChat, 'You', this.maqawManager.chatName);

    // set up a connection listener to wait for a rep to make a connection with us
    this.connection;

    this.mirror = new Mirror();

    this.maqawManager.connectionManager.on('connection', function(maqawConnection) {
      if (that.connection) {
        console.log("Warning: Overwriting existing connection");
      }
      that.connection = maqawConnection;
      that.mirror.setConnection(that.connection);

      maqawConnection.on('data', connectionDataCallback)
        .on('change', connectionStatusCallback) 
    }); 

    /*
     * For a connection received from the newConnectionListener, this function will be called by the connection
     * when data is received through the connection
     */
    function connectionDataCallback(data) {
        // handle text
        if (data.type === MAQAW_DATA_TYPE.TEXT) {
            that.chatSession.newTextReceived(data.text);
        }
        if (data.type === MAQAW_DATA_TYPE.SCREEN) {
          that.mirror && that.mirror.data(data);
        }
    }

    /*
     * For a connection received from the newConnectionListener, this function will be called by the connection
     * whenever the status of the connection changes. The connection status will be passed,
     * with true representing an open connection and false representing closed.
     */
    function connectionStatusCallback(connectionStatus) {
        //console.log("Visitor Session connection status: "+connectionStatus);
        that.isConnected = connectionStatus;

        // update chat session to reflect connection status
        that.chatSession.setAllowMessageSending(connectionStatus);

        // show a different page if there is no connection with a rep
        if (connectionStatus) {
            setClientChat();
        }
        else {
            setNoRepPage();
        }
    }

    /*
     * This function is passed to the Chat Session. The session will call it whenever it has text
     * to send to the peer.
     */
    function sendTextFromChat(text) {
        if (!that.connection || !that.connection.isConnected) {
            console.log("Error: Cannot send text. Bad connection");
        } else {
            that.connection.sendText(text);
        }
    }


    // add footer
    var chatFooter;
    chatFooter = document.createElement('DIV');
    chatFooter.id = 'maqaw-chat-footer';
    this.visitorChatWindow.appendChild(chatFooter);

    // add login button to footer
    var loginButton;
    loginButton = document.createElement('DIV');
    loginButton.id = 'maqaw-login-button';
    loginButton.innerHTML = "Login"
    chatFooter.appendChild(loginButton);

    // setup callback for when login is clicked
    loginButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://maqaw.com">MAQAW</a>';
    chatFooter.appendChild(maqawLink);

    /* Create container for when no rep is available */
    this.noRepWindow = document.createElement("DIV");
    this.noRepWindow.id = 'maqaw-no-rep-window';
    this.noRepWindow.className = 'maqaw-client-chat-window'
    this.noRepWindow.innerHTML = '';

    var noRepText = document.createElement("DIV");
    noRepText.className = 'maqaw-chat-display';
    noRepText.innerHTML = 'Sorry, there are no representatives available to chat';
    this.noRepWindow.appendChild(noRepText);

    this.noRepHeader = document.createElement('DIV');
    this.noRepHeader.innerHTML = "Send us an email!";
    this.noRepHeader.className = 'maqaw-chat-header-text';

    // add footer
    var noRepFooter;
    noRepFooter = document.createElement('DIV');
    noRepFooter.id = 'maqaw-chat-footer';
    this.noRepWindow.appendChild(noRepFooter);

    // add login button to footer
    var noRepLoginButton;
    noRepLoginButton = document.createElement('DIV');
    noRepLoginButton.id = 'maqaw-login-button';
    noRepLoginButton.innerHTML = "Login"
    noRepFooter.appendChild(noRepLoginButton);

    // setup callback for when login is clicked
    noRepLoginButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://maqaw.com">MAQAW</a>';
    noRepFooter.appendChild(maqawLink);

    // set the chat window to default to no rep
    setNoRepPage();

    function setClientChat() {
        that.body.innerHTML = '';
        that.body.appendChild(that.visitorChatWindow);
        that.header.innerHTML = '';
        that.header.appendChild(that.loginHeader);
    }

    function setNoRepPage() {
        that.body.innerHTML = '';
        that.body.appendChild(that.noRepWindow);
        that.header.innerHTML = '';
        that.header.appendChild(that.noRepHeader);
    }

    // returns an object containing the data that constitutes this visitors session
    this.getSessionData = function () {
        return {
            chatText: that.chatSession.getText()
        };
    };

    // takes an visitor session data object (from getSessionData) and loads this visitor
    // session with it
    this.loadSessionData = function (sessionData) {
        that.chatSession.setText(sessionData.chatText);
    }
}

MaqawVisitorSession.prototype.getBodyContents = function () {
    return this.body;
};

MaqawVisitorSession.prototype.getHeaderContents = function () {
    return this.header;
};
