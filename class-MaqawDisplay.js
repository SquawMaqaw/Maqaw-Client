/*
 MaqawDisplay handles the graphical structure of the
 Maqaw client
 */

function MaqawDisplay(startMinimized) {
    this.startMinimized = startMinimized;
}

/*
 Constructs and styles the dom elements to display the client
 */
MaqawDisplay.prototype.setup = function () {
    // create the parent div to hold the client
    var clientContainer;
    clientContainer = document.createElement('DIV');
    clientContainer.id = 'maqaw-chat-container';
    document.body.appendChild(clientContainer);

    // The header sits on top of the client body. It is always visible, and clicking
    // on it toggles the visibility of the body. The header contents are publicly adjustable
    this.clientHeader = document.createElement('DIV');
    clientContainer.appendChild(this.clientHeader);

    // create div to contain client body
    this.clientBody = document.createElement('DIV');
    clientContainer.appendChild( this.clientBody);

    // check if the window should be minimized by default
    var isMinimized = this.startMinimized;
    if(isMinimized){
        this.clientBody.style.display = 'none';
    } else {
        this.clientBody.style.display = 'block';
    }

    // add the CSS file
    this.loadCSS();

    // when the header is clicked it should toggle between minimized and shown
    var that = this;
    function toggleMinimized() {
        if (isMinimized) {
            that.clientBody.style.display = 'block';
            isMinimized = false;
        } else {
            that.clientBody.style.display = 'none';
            isMinimized = true;
        }
    }
    this.clientHeader.addEventListener('click', toggleMinimized, false);
};

/*
Set the contents of the header. Erases any previous content
content - A single div containing the content to be placed in the header
 */
MaqawDisplay.prototype.setHeaderContents = function(content) {
    // erase any current content and replace in with the new content
    this.clientHeader.innerHTML = '';
    this.clientHeader.appendChild(content);
};

/*
Sets the body contents of the client. Erases any previous content
 content - A single div containing the content to be placed in the body
 */

MaqawDisplay.prototype.setBodyContents = function(content) {
    // erase any current content and replace in with the new content
    this.clientBody.innerHTML = '';
    this.clientBody.appendChild(content);
};

/*
Append the CSS file to the head
*/
MaqawDisplay.prototype.loadCSS = function() {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.type = 'text/css';
    link.rel = 'stylesheet';
    link.href = 'http://www.maqaw.com/cdn/maqaw.min.css';
    link.media = 'all';
    head.appendChild(link);
}