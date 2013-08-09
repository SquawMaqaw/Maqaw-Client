/*
 VisitorSession manages a visitor's interaction with the Maqaw client. It contains the connection
 with a representative, and handles all display and transfer of communication with that rep.
 */
var MAQAW_VISITOR_ENUMS = {
    INFO: 0,
    ACK: 1
};
function MaqawVisitorSession(manager, visitorInfo) {
    var that = this;
    this.chatSession;
    this.maqawManager = manager;

    // Visitor info was passed in if it was previously stored. Otherwise it is undefined
    this.visitorInfo = null;
    if(visitorInfo){
        this.visitorInfo = new MaqawVisitorInfo(visitorInfo);
    }

    // the status of our connection with a peer. True for open and false for closed
    // Defaults to false until we can verify that a connection has been opened
    this.isConnected = false;

    /* initialize header container for this session */
    this.header = document.createElement('DIV');
    this.header.className = 'maqaw-default-client-header';
    // div to hold text in header
    this.headerText = document.createElement('DIV');
    this.headerText.className = 'maqaw-header-text';
    this.header.appendChild(this.headerText);
    // function to change the header text
    function changeHeaderText(text){
        that.headerText.innerHTML = text;
    }
    // set default text
    changeHeaderText("Chat with us!");

    /* initialize body container */
    this.body = document.createElement('DIV');
    this.body.className = 'maqaw-visitor-session-body';
    // content div holds the main content in the body
    this.bodyContent = document.createElement('DIV');
    this.body.appendChild(this.bodyContent);
    // function to set what content is shown
    function setBodyContent(div){
        that.bodyContent.innerHTML = '';
        that.bodyContent.appendChild(div);
    }

    /* Create chat container and session */
     var chatSessionContainer = document.createElement("DIV");
    this.chatSession = new MaqawChatSession(chatSessionContainer, sendTextFromChat, 'You', this.maqawManager.chatName);

    /* Create container for when no rep is available */
    var noRepContainer = document.createElement("DIV");
    noRepContainer.id = 'maqaw-no-rep-window';
    noRepContainer.innerHTML = 'Sorry, there are no representatives available to chat';
    // default to showing the noRepContainer until a connection with a rep is made
    setBodyContent(noRepContainer);

    /* Create a form to get the visitor's name and email address before chatting */
    var visitorInfoContainer = document.createElement("DIV");
    visitorInfoContainer.id = 'maqaw-visitor-session-info';
    // Text instructions
    var infoInstructions = document.createElement("DIV");
    infoInstructions.id = 'maqaw-visitor-info-instructions';
    infoInstructions.innerHTML = "Enter your name and email to start chatting with us!";
    visitorInfoContainer.appendChild(infoInstructions);
    // field for visitor name
    var nameField = document.createElement("input");
    nameField.setAttribute('type', "text");
    nameField.setAttribute('id', "maqaw-visitor-name-field");
    nameField.setAttribute('placeholder', 'Name');
    visitorInfoContainer.appendChild(nameField);
    // field for visitor email
    var emailField = document.createElement("input");
    emailField.setAttribute('type', "text");
    emailField.setAttribute('id', "maqaw-visitor-email-field");
    emailField.setAttribute('placeholder', 'Email');
    visitorInfoContainer.appendChild(emailField);
    // submit button
    var infoSubmitButton = document.createElement('DIV');
    infoSubmitButton.id = 'maqaw-visitor-info-button';
    infoSubmitButton.innerHTML = 'Ok';
    visitorInfoContainer.appendChild(infoSubmitButton);
    // submit button callback
    infoSubmitButton.addEventListener('click', visitorInfoEntered, false);
    function visitorInfoEntered(){
        var name = nameField.value;
        var email = emailField.value;
        // TODO: Display error message for invalid name or email
        // check to make sure name and email aren't blank
        if(name !== '' && email !== ''){
            // store the visitor's info
            that.visitorInfo = new MaqawVisitorInfo({
                name: name,
                email: email
            });
            // send the data to the rep
            that.connection.send({
                type: MAQAW_DATA_TYPE.VISITOR_INFO,
                request: MAQAW_VISITOR_ENUMS.INFO,
                info: JSON.stringify(that.visitorInfo)
            });
            // show the chat window
            setBodyContent(chatSessionContainer);
        }
    }

    /* Add footer to body */
    this.bodyFooter = document.createElement('DIV');
    this.bodyFooter.id = 'maqaw-visitor-session-footer';
    this.body.appendChild(this.bodyFooter);

    // add login button to footer
    var loginButton = document.createElement('DIV');
    loginButton.id = 'maqaw-login-button';
    loginButton.innerHTML = "Login";
    this.bodyFooter.appendChild(loginButton);

    // setup callback for when login is clicked
    loginButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // add Maqaw link to footer
    var maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://maqaw.com">MAQAW</a>';
    this.bodyFooter.appendChild(maqawLink);

    /* Set up the connection */
    this.connection = null;
    this.mirror = new Mirror();

    this.maqawManager.connectionManager.on('connection', function (maqawConnection) {
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
        that.isConnected = connectionStatus;

        // update chat session to reflect connection status
        that.chatSession.setAllowMessageSending(connectionStatus);

        // show a different page if there is no connection with a rep
        if (connectionStatus) {
            // if they've enter their info, show them the chat window
            if(that.visitorInfo){
                setBodyContent(chatSessionContainer);
            }
            // otherwise ask for their information
            else {
                setBodyContent(visitorInfoContainer);
            }
        }
        else {
            setBodyContent(noRepContainer);
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


