/*
 ClientSession manages client information and interactions
 with Maqaw.
 */
function VisitorSession(manager) {
    var that = this;
    this.chatSession;
    this.maqawManager = manager;
    // Whether or not there is a rep available to chat
    this.isRepAvailable = false;

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
    this.visitorChatWindow.className = 'client-chat-window';

    // add chat session
    var chatSessionContainer = document.createElement("DIV");
    this.visitorChatWindow.appendChild(chatSessionContainer);

    // create ChatSession
    // don't include a connection id so that no connection is started from this end. Leave
    // it to the rep to start a connection
    chatSessionContainer.innerHTML = '';
    this.chatSession = new ChatSession(chatSessionContainer, that.maqawManager.peer, 'src', 'dst');

    // add footer
    var chatFooter;
    chatFooter = document.createElement('DIV');
    chatFooter.id = 'chat-footer';
    this.visitorChatWindow.appendChild(chatFooter);

    // add login button to footer
    var loginButton;
    loginButton = document.createElement('DIV');
    loginButton.id = 'login-button';
    loginButton.innerHTML = "Login"
    chatFooter.appendChild(loginButton);

    // setup callback for when login is clicked
    loginButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://www.maqaw.com">MAQAW</a>';
    chatFooter.appendChild(maqawLink);

    /* Create container for when no rep is available */
    this.noRepWindow = document.createElement("DIV");
    this.noRepWindow.id = 'maqaw-no-rep-window';
    this.noRepWindow.className = 'client-chat-window'
    this.noRepWindow.innerHTML = '';

    var noRepText = document.createElement("DIV");
    noRepText.className = 'chat-display';
    noRepText.innerHTML = 'Sorry, there are no representatives available to chat';
    this.noRepWindow.appendChild(noRepText);

    this.noRepHeader = document.createElement('DIV');
    this.noRepHeader.innerHTML = "Send us an email!";
    this.noRepHeader.className = 'maqaw-chat-header-text';

    // add footer
    var noRepFooter;
    noRepFooter = document.createElement('DIV');
    noRepFooter.id = 'chat-footer';
    this.noRepWindow.appendChild(noRepFooter);

    // add login button to footer
    var noRepLoginButton;
    noRepLoginButton = document.createElement('DIV');
    noRepLoginButton.id = 'login-button';
    noRepLoginButton.innerHTML = "Login"
    noRepFooter.appendChild(noRepLoginButton);

    // setup callback for when login is clicked
    noRepLoginButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://www.maqaw.com">MAQAW</a>';
    noRepFooter.appendChild(maqawLink);




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

    /*
     Updates whether or not their is an available rep for the visitor to chat with.
     Pass in true if there is a rep available or false otherwise.
     */
    this.setIsRepAvailable = function(isRepAvailable){
        if(isRepAvailable !== that.isRepAvailable){
            if(isRepAvailable) {
                setClientChat();
            }
            else {
                setNoRepPage();
            }
        }
        this.isRepAvailable = isRepAvailable;
    }

    // set the chat window to default to no rep
    setNoRepPage();

    // returns an object containing the data that constitutes this visitors session
    this.getSessionData = function() {
        return {
            chatText: that.chatSession.getText()
        };
    }

    // takes an visitor session data object (from getSessionData) and loads this visitor
    // session with it
    this.loadSessionData = function(sessionData) {
        that.chatSession.setText(sessionData.chatText);
    }
}

VisitorSession.prototype.getBodyContents = function () {
    return this.body;
}

VisitorSession.prototype.getHeaderContents = function () {
    return this.header;
}




