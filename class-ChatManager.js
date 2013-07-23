// Displays the visitors chat sessions
// chatWindow - the div that displays the chats
function MaqawChatManager(chatWindow) {
    this.chatWindow = chatWindow;
    this.activeVisitor = undefined;

    // create div for when no chat session is selected
    this.noChatSession = document.createElement('DIV');
    this.noChatSession.id = 'maqaw-no-chat-session-selected';
    this.noChatSession.innerHTML = 'No visitor selected';

    // default to showing noChatSession
    chatWindow.appendChild(this.noChatSession);
}

// Displays a visitors chat session
// visitor - the visitor object whose chat session will be displayed
MaqawChatManager.prototype.showVisitorChat = function(visitor) {
    this.activeVisitor = visitor;
    // reset chat window and then show this visitor's chat session
    this.chatWindow.innerHTML = '';
    this.chatWindow.appendChild(visitor.chatSession.getContainer());
};

// Clears the displayed chat session.
// if a visitor object is passed in, the chat is only cleared if that
// visitor is being displayed. If no argument is passed in then the
// window is always cleared
MaqawChatManager.prototype.clear = function(visitor) {

    if(!visitor || visitor && visitor === this.activeVisitor){
        this.chatWindow.innerHTML = '';
        this.chatWindow.appendChild(this.noChatSession);
    }

};