// Displays the visitors chat sessions
// chatWindow - the div that displays the chats
function ChatManager(chatWindow) {
    this.chatWindow = chatWindow;
    this.activeVisitor = undefined;

    // create div for when no chat session is selected
    this.noChatSession = document.createElement('DIV');
    this.noChatSession.id = 'no-chat-session-selected';
    this.noChatSession.innerHTML = 'No visitor selected';

    // default to showing noChatSession
    chatWindow.appendChild(this.noChatSession);
}

// Displays a visitors chat session
// visitor - the visitor object whose chat session will be displayed
ChatManager.prototype.showVisitorChat = function(visitor) {
    this.activeVisitor = visitor;
    // reset chat window and then show this visitor's chat session
    this.chatWindow.innerHTML = '';
    this.chatWindow.appendChild(visitor.chatSession.getContainer());
};

// Clears any current chat sessions displayed
ChatManager.prototype.clear = function() {
    this.chatWindow.innerHTML = '';
    this.chatWindow.appendChild(this.noChatSession);
};