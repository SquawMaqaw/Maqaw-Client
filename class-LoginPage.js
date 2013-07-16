/**
 * Created By: Eli
 * Date: 7/15/13
 */

function LoginPage(manager) {
    var that = this;
    var loginEndpoint = 'http://ec2-54-212-11-221.us-west-2.compute.amazonaws.com:3000/login';
    var user = 'additt';
    var password = 'MapleAdditt';

    this.maqawManager = manager;
    /* Create elements that make up the login page */
// create login header
    this.header = document.createElement('DIV');
    this.header.className = 'maqaw-default-client-header';
     // add text to header
    this.loginHeader = document.createElement('DIV');
    this.loginHeader.innerHTML = "Login";
    this.loginHeader.className = 'maqaw-chat-header-text';
    this.header.appendChild(this.loginHeader);

// create login window
    this.body = document.createElement('DIV');
    this.body.id = 'login-window';

// add title to login window
    var loginTitle;
    loginTitle = document.createElement('DIV');
    loginTitle.id = 'login-title';
    loginTitle.innerHTML = 'Login to your account';
    this.body.appendChild(loginTitle);

    // add div for error text
    var errorMessage = document.createElement("DIV");
    errorMessage.id = 'maqaw-login-error-message';
    errorMessage.innerHTML = 'Invalid username or password';
    errorMessage.style.display = 'none';
    this.body.appendChild(errorMessage);

// create login form
    var usernameField = document.createElement("input");
    usernameField.setAttribute('type', "text");
    usernameField.setAttribute('name', "username");
    usernameField.setAttribute('size', "31");
    usernameField.setAttribute('placeholder', 'username');
    usernameField.value = user;
    this.body.appendChild(usernameField);

    var passwordField = document.createElement("input");
    passwordField.setAttribute('type', "password");
    passwordField.setAttribute('name', "password");
    passwordField.setAttribute('size', "31");
    passwordField.setAttribute('placeholder', 'password');
    passwordField.value = password;
    this.body.appendChild(passwordField);

// submit button
    var loginSubmitButton = document.createElement('DIV');
    loginSubmitButton.id = 'login-submit-button';
    loginSubmitButton.className = 'login-page-button';
    loginSubmitButton.innerHTML = 'Login';
    this.body.appendChild(loginSubmitButton);

// set up submit button listener
    loginSubmitButton.addEventListener('click', submitLoginCredentials, false);

// back button
    var loginBackButton = document.createElement('DIV');
    loginBackButton.id = 'login-back-button';
    loginBackButton.className = 'login-page-button';
    loginBackButton.innerHTML = 'Back';
    this.body.appendChild(loginBackButton);

// set up back button listener
    loginBackButton.addEventListener('click', this.maqawManager.showVisitorSession, false);

// add login footer text
    var loginFooter = document.createElement('DIV');
    loginFooter.id = 'login-footer';
    loginFooter.innerHTML = "Don't have an account? Sign up at <a href='http://www.maqaw.com'>Maqaw.com</a>!";
    this.body.appendChild(loginFooter);

    function submitLoginCredentials() {
        var key = that.maqawManager.key;
        var id = that.maqawManager.id;
        var username = usernameField.value;
        var password = passwordField.value;

        var params = 'username='+username+'&password='+password+'&user[id]='+id+'&user[key]='+key;
        var encodedParams = encodeURI(params);

        // submit post request
        maqawAjaxPost(loginEndpoint, encodedParams, handleLoginPostResponse);
    }

    function handleLoginPostResponse(xhr) {
        // if credentials were denied show error message
        if(xhr.status === 401) {
            errorMessage.style.display = 'block';
        } else if(xhr.status === 200) {
            // success! hide error message
            errorMessage.style.display = 'none';
            // create new Representative object with response data
            var rep = new Representative('test');
            // tell manager to change to rep mode using our representative data
            that.maqawManager.showRepSession(rep);
        }
    }
}

LoginPage.prototype.getBodyContents = function () {
    return this.body;
}

LoginPage.prototype.getHeaderContents = function () {
    return this.header;
}