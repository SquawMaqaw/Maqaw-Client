/*
 ClientSession manages client information and interactions
 with Maqaw.
 */
function ClientSession(manager) {
    var that = this;
    this.chatSession = undefined;
    this.maqawManager = manager;
    // Whether or not there is a rep available to chat
    this.isRepAvailable = false;

    // initialize header container for this session
    this.header = document.createElement('DIV');
    this.header.className = 'maqaw-default-client-header';

    // initialize body container
    this.body = document.createElement('DIV');

    /* Create elements that make up chat window */
    this.chatHeader = document.createElement('DIV');
    this.chatHeader.innerHTML = "Chat with me!";
    this.chatHeader.className = 'maqaw-chat-header-text';

    // create div to hold chat info
    this.clientChatWindow = document.createElement('DIV');
    this.clientChatWindow.className = 'client-chat-window';

    // add chat session
    var chatSessionContainer = document.createElement("DIV");
    this.clientChatWindow.appendChild(chatSessionContainer);

    // add footer
    var chatFooter;
    chatFooter = document.createElement('DIV');
    chatFooter.id = 'chat-footer';
    this.clientChatWindow.appendChild(chatFooter);

    // add login button to footer
    var loginButton;
    loginButton = document.createElement('DIV');
    loginButton.id = 'login-button';
    loginButton.innerHTML = "Login"
    chatFooter.appendChild(loginButton);

    // setup callback for when login is clicked
    loginButton.addEventListener('click', setLoginPage, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://www.maqaw.com">MAQAW</a>';
    chatFooter.appendChild(maqawLink);

    /* Create elements that make up the login window  for when the login button is clicked */
    // create login header
    this.loginHeader = document.createElement('DIV');
    this.loginHeader.innerHTML = "Login";
    this.loginHeader.className = 'maqaw-chat-header-text';

    // create login window
    this.loginWindow = document.createElement('DIV');
    this.loginWindow.id = 'login-window';

    // add title to login window
    var loginTitle;
    loginTitle = document.createElement('DIV');
    loginTitle.id = 'login-title';
    loginTitle.innerHTML = 'Login to your account';
    this.loginWindow.appendChild(loginTitle);

    // create login form
    var usernameField = document.createElement("input");
    usernameField.setAttribute('type', "text");
    usernameField.setAttribute('name', "username");
    usernameField.setAttribute('size', "31");
    usernameField.setAttribute('placeholder', 'username');
    this.loginWindow.appendChild(usernameField);

    var passwordField = document.createElement("input");
    passwordField.setAttribute('type', "text");
    passwordField.setAttribute('name', "password");
    passwordField.setAttribute('size', "31");
    passwordField.setAttribute('placeholder', 'password');
    this.loginWindow.appendChild(passwordField);

    // submit button
    var loginSubmitButton = document.createElement('DIV');
    loginSubmitButton.id = 'login-submit-button';
    loginSubmitButton.className = 'login-page-button';
    loginSubmitButton.innerHTML = 'Login';
    this.loginWindow.appendChild(loginSubmitButton);

    // set up login button listener
    loginSubmitButton.addEventListener('click', this.maqawManager.loginClicked, false);

    // back button
    var loginBackButton = document.createElement('DIV');
    loginBackButton.id = 'login-back-button';
    loginBackButton.className = 'login-page-button';
    loginBackButton.innerHTML = 'Back';
    this.loginWindow.appendChild(loginBackButton);

    // set up back button listener
    loginBackButton.addEventListener('click', setClientChat, false);

    // add login footer text
    var loginFooter = document.createElement('DIV');
    loginFooter.id = 'login-footer';
    loginFooter.innerHTML = "Don't have an account? Sign up at <a href='http://www.maqaw.com'>Maqaw.com</a>!";
    this.loginWindow.appendChild(loginFooter);

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
    var loginButton;
    loginButton = document.createElement('DIV');
    loginButton.id = 'login-button';
    loginButton.innerHTML = "Login"
    noRepFooter.appendChild(loginButton);

    // setup callback for when login is clicked
    loginButton.addEventListener('click', setLoginPage, false);

    // add Maqaw link to footer
    var maqawLink;
    maqawLink = document.createElement('DIV');
    maqawLink.id = 'maqaw-link';
    maqawLink.innerHTML = 'POWERED BY <a href="http://www.maqaw.com">MAQAW</a>';
    noRepFooter.appendChild(maqawLink);

    // Switches the chat window to display login fields
    function setLoginPage() {
        that.body.innerHTML = '';
        that.body.appendChild(that.loginWindow);
        that.header.innerHTML = '';
        that.header.appendChild(that.loginHeader);
    }

    function setClientChat() {
        that.body.innerHTML = '';
        that.body.appendChild(that.clientChatWindow);
        that.header.innerHTML = '';
        that.header.appendChild(that.chatHeader);
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
    this.setIsRepAvailable = function(boolean){
        if(boolean !== that.isRepAvailable){
            if(boolean) {
                new ChatSession(chatSessionContainer, that.maqawManager.peer, 'src', that.maqawManager.id, 'dst', that.maqawManager.representatives[0]);
                setClientChat();
            }
            else setNoRepPage();
        }
        this.isRepAvailable = boolean;
    }

    // set the chat window to default to no rep
    setNoRepPage();
}

ClientSession.prototype.getBodyContents = function () {
    return this.body;
}

ClientSession.prototype.getHeaderContents = function () {
    return this.header;
}


