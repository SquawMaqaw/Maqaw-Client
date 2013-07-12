// A visitor object contains all the data describing a visitor
// on the site who is accessible for chat
// name - visitor name
// key - webrtc chat key
// chatDisplayContainer - the div that will show the visitors chat session
function Visitor(name, id) {
    this.name = name;
    this.key = id;

    // each visitor has a unique chat session
    this.chatSession = new ChatSession(name, 'dst');
}