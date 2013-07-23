/*
 Creates a chat window with a unique key to talk
 to a visitor.
 */
function MaqawChatSession(chatSessionContainer, peer, srcName, dstName, dstId, connectionCallback) {

    this.srcName = srcName;
    this.dstName = dstName;
    this.dstId = dstId;
    var that = this;
    this.peer = peer;
    this.isConnected = false;
    var conn;

    // whether or not the chat session should allow a rep to send a message
    // this will be updated based on the connection status with the visitor
    this.isSendingAllowed;

    // callback function for when the connection status changes. True is passed if a connection
    // becomes open, and false is passed if the connection closes
    this.connectionCallback = connectionCallback;

    // parent div to display chat session
    this.mainContainer = chatSessionContainer;

    // add div to display chat text
    this.textDisplay;
    this.textDisplay = document.createElement('DIV');
    this.textDisplay.className = 'chat-display';
    this.mainContainer.appendChild(this.textDisplay);

    this.textDisplay.addEventListener('load', function () {
        alert('hi')
    }, false);

    // put initial text in the display window
    this.textDisplay.innerHTML = "Questions or feedback? We're online and ready to help you!";

    // add box for text entry
    this.textInput;
    this.textInput = document.createElement('textarea');
    this.textInput.className = 'chat-entry';
    this.textInput.setAttribute('placeholder', 'Type and hit enter to chat');
    this.mainContainer.appendChild(this.textInput);


    // add listener to text input. Capture text when enter is pressed
    try {
        this.textInput.addEventListener("keyup", keyPress, false);
    } catch (e) {
        this.textInput.attachEvent("onkeyup", keyPress);
    }


    function keyPress(e) {
        // check if enter was pressed
        if (e.keyCode === 13) {
            // get entered text and reset the box
            var text = that.textInput.value;
            that.textInput.value = "";
            handleInput(text);
            // scroll to bottom of chat window
            that.scrollToBottom();
        }
    }

    // This function is passed any text that the user inputs
    function handleInput(text) {
        // test if string is not just whitespace
        if (/\S/.test(text)) {
            //send data to other side
            if (conn) conn.send(text);
            // append new text to existing chat text
            that.textDisplay.innerHTML = that.textDisplay.innerHTML + "<p class='chat-paragraph'>" +
                "<span class='chat-src-name'>" + that.srcName + ": </span>" + text + "</p>";
        }
    }

    function handleResponse(text) {
        // test if string is not just whitespace
        if (/\S/.test(text)) {
            // append new text to existing chat text
            that.textDisplay.innerHTML = that.textDisplay.innerHTML + "<p class='chat-paragraph'>" +
                "<span class='chat-dest-name'>" + that.dstName + ": </span>" + text + "</p>";

            that.scrollToBottom();
        }

    }

    // takes a boolean representing if the peer is connected or not
    // updates the setting, and turns off the text input box if
    // a connection is not active. Calls a connectionCallback as well
    // if one was provided
    function setConnectionStatus(connectionStatus) {
        that.isConnected = connectionStatus;

        // change status of text input depending on connection
        if (connectionStatus) {
            allowMessages();
        } else {
            disallowMessages();
        }

        if (that.connectionCallback) {
            that.connectionCallback(connectionStatus);
        }
    }

    /* Set up peerjs connection handling for this chat session */
    this.peer.on('connection', connect);
    function connect(c) {
        setConnectionStatus(true);
        conn = c;
        conn.on('data', function (data) {
            console.log(data);
            handleResponse(data);
        });
        conn.on('close', function (err) {
            setConnectionStatus(false);
        });


    }

    // scroll chat window to most recent text
    this.scrollToBottom = function () {
        that.textDisplay.scrollTop = that.textDisplay.scrollHeight;
    };

    // returns to current text in the chat window
    this.getText = function () {
        return that.textDisplay.innerHTML;
    };

    // sets the chat window to have this text
    this.setText = function (text) {
        that.textDisplay.innerHTML = text;
    };

    // Attempts to open a peerjs connection if the connection is currently closed,
    // and an id has been provided
    this.openConnection = function (onOpenCallback) {
        if (that.dstId) {
            console.log("attempting connection with "+that.dstId+"at "+(new Date()).toLocaleTimeString());
            var c = that.peer.connect(that.dstId, {reliable: false});
            c.on('open', function () {
                console.log("Connection opened with "+that.dstId+" at "+(new Date()).toLocaleTimeString());
                // invoke the callback if one was provided
                onOpenCallback && onOpenCallback();
                connect(c);
            });
            c.on('error', function (err) {
                console.log("Connection error: " + err);
            });
        }
    };

    this.getIsConnected = function () {
        return that.isConnected;
    };

    // if the connection is open, close it
    this.disconnect = function () {
        if (that.isConnected) {
            conn.close();
        }
    };

    // the allowMessageSending flag tells the chatsession whether or not they
    // should let the rep send messages to the client. This should be disallowed
    // when the client's connection stop, and reallowed when the connection starts again
    this.setAllowMessageSending = function (allowMessageSending) {
        // only do something if the state changed
        if (allowMessageSending !== that.isSendingAllowed) {
            if (allowMessageSending) {
                allowMessages();
            } else {
                disallowMessages();
            }
        }
    }

    // prevent a message from being sent
    var savedTextValue = null;

    function disallowMessages() {
        if (that.textInput) {
            that.isSendingAllowed = false;
            that.textInput.disabled = true;
            // change text to reflect this, if it hasn't already been saved
            if (savedTextValue == null) {
                savedTextValue = that.textInput.value;
                console.log("Saving value: " + savedTextValue);
                that.textInput.value = "Connecting to peer...";
            }
        }
        console.log('disallow messages');
    }

    // allow messages to be sent
    function allowMessages() {
        if (that.textInput) {
            that.isSendingAllowed = true;
            that.textInput.disabled = false;
            // restore original text
            if (savedTextValue !== null) {
                console.log("Restoring value: " + savedTextValue);
                that.textInput.value = savedTextValue;
                savedTextValue = null;
            }
        }
    }

    // disallow sending messages until a connection is opened
    disallowMessages();

    // Finish by attempting to open a connection if applicable
    if(that.dstId){
        attemptConnection();
    }


    function attemptConnection(){
        // how many milliseconds we will wait until trying to connect again
        var retryInterval = 8000;
        var isConnected = false;

        //  The max number of times a connection will be attempted
        var retryLimit = 5;
        var numAttempts = 0;

        // this function is called when a successful connection is opened
        function successCallback(){
            isConnected =  true;
        }

        // create a function that will attempt to open a connection, and will retry
        // every retryInterval milliseconds until a connection is established
        // this function is immediately invoked
        (function tryOpeningConnection(){
            // start the connection opening process
            if(!isConnected && numAttempts < retryLimit){
                numAttempts++;
                that.openConnection(successCallback);

                // schedule it to try again in a bit.
                setTimeout(tryOpeningConnection, retryInterval);
            }
        })();


    }
}

// Returns the main div container for the chat session
MaqawChatSession.prototype.getContainer = function () {
    return this.mainContainer;
};



