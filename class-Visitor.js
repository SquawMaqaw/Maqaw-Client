// A visitor object contains all the data describing a visitor
// on the site who is accessible for chat
// name - visitor name
// key - webrtc chat key
// chatDisplayContainer - the div that will show the visitors chat session
function MaqawVisitor(manager, name, id, connectionCallback) {
    var that = this;
    this.name = name;
    this.id = id;

    // each visitor has a unique chat session
    this.chatSession = new MaqawChatSession(document.createElement("DIV"), manager.peer, 'You', name, id, connectionCallback);

    this.getChatSession = function() {
        return that.chatSession;
    };

    this.getId = function(){
        return that.id;
    };
}