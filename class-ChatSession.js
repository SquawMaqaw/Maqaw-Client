/*
 Creates a chat window with a unique key to talk
 to a visitor.
 */
function MaqawChatSession(chatSessionContainer, sendTextFunction, srcName, dstName) {
    var that = this;
    this.srcName = srcName;
    this.dstName = dstName;
    this.sendTextFunction = sendTextFunction;

    // parent div to display chat session
    this.mainContainer = chatSessionContainer;

    // add div to display chat text
    this.textDisplay;
    this.textDisplay = document.createElement('DIV');
    this.textDisplay.className = 'maqaw-chat-display';
    this.mainContainer.appendChild(this.textDisplay);

    // put initial text in the display window
    this.textDisplay.innerHTML = "Questions or feedback? We're online and ready to help you!";

    // add box for text entry
    this.textInput;
    this.textInput = document.createElement('textarea');
    this.textInput.className = 'maqaw-chat-entry';
    this.textInput.setAttribute('placeholder', 'Type and hit enter to chat');
    this.mainContainer.appendChild(this.textInput);

    // add listener to text input. Capture text when enter is pressed
    this.textInput.addEventListener("keyup", keyPress, false);

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
            //send data to our chat buddy
            sendTextFunction(text);
            // append new text to existing chat text
            that.textDisplay.innerHTML = that.textDisplay.innerHTML + "<p class='maqaw-chat-paragraph'>" +
                "<span class='maqaw-chat-src-name'>" + that.srcName + ": </span>" + text + "</p>";
        }
    }

    function handleResponse(text) {
        // test if string is not just whitespace
        if (/\S/.test(text)) {
            // append new text to existing chat text
            that.textDisplay.innerHTML = that.textDisplay.innerHTML + "<p class='maqaw-chat-paragraph'>" +
                "<span class='maqaw-chat-dest-name'>" + that.dstName + ": </span>" + text + "</p>";

            that.scrollToBottom();
        }

    }

    /*
     * Called when text is received from a peer
     */
    this.newTextReceived = function (text) {
        handleResponse(text);
    };

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

    /*
     * Whether or not the the chat session should allow the user to send text. If set to true
     * they can send text normally. If set to false the text input box is disabled
     */
    this.setAllowMessageSending = function (allowMessageSending) {
        if (allowMessageSending) {
            allowMessages();
        } else {
            disallowMessages();
        }

    };

    // disallow sending messages by default until we are told otherwise
    // prevent a message from being sent
    var savedTextValue = null;
    disallowMessages();

    function disallowMessages() {
        that.textInput.disabled = true;
        // save any text the user is tying, if it hasn't already been saved
        if (savedTextValue === null) {
            savedTextValue = that.textInput.value;
        }
        that.textInput.value = "Connecting to peer...";
    }

    // allow messages to be sent
    function allowMessages() {
        that.textInput.disabled = false;
        // restore original text
        if (savedTextValue !== null) {
            that.textInput.value = savedTextValue;
            savedTextValue = null;
        }
    }
}

// Returns the main div container for the chat session
MaqawChatSession.prototype.getContainer = function () {
    return this.mainContainer;
};



