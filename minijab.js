var MINIJAB =  {
    connection: null,
    NS_MUC: 'http://jabber.org/protocol/muc',
    userLogin: null
};

MINIJAB.connect = function(ev, data){
    var conn = new Strophe.Connection(MINIJAB.bosh_url);
    conn.connect(data.jid, data.password, function(status){
	if (status === Strophe.Status.CONNECTING){
	    $('#connStatusIndicator').html('Connecting...');
	} else if (status === Strophe.Status.AUTHENTICATING){
	    $('#connStatusIndicator').html('Authenticating...');
	} else if (status === Strophe.Status.CONNECTED){
	    $(document).trigger('connected');
	} else if (status === Strophe.Status.DISCONNECTING){
	    $('#connStatusIndicator').html('Disconnecting...');
	} else if (status === Strophe.Status.DISCONNECTED){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.connection = null;
	    MINIJAB.showLoginDialog('Disconnected from server. Please, try again.');
	} else if (status === Strophe.Status.CONNFAIL){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.showLoginDialog('Connection Failure. Please, try again.');
	} else if (status === Strophe.Status.AUTHFAIL){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.showLoginDialog('Wrong user or password.');
	}
    });
    MINIJAB.connection = conn;
};

MINIJAB.showLoginDialog = function(message){
    $('#login_dialog').dialog({
	autoOpen: true,
	draggable: false,
	modal: true,
	title: 'Welcome!',
	buttons: {
	    "Connect": function(){
		MINIJAB.userLogin = $('#jid').val();
		var userJid = $('#jid').val(), userPass = $('#password').val();
		if (userJid.indexOf('@') == -1){
		    userJid += ('@' + MINIJAB.anonymous_domain);
		}
		$(document).trigger('connect', {jid: userJid, password: userPass});
		$('#password').val('');
		$(this).dialog('close');
	    }    
	}
    });
    $('#loginMessage').html(message);
};

MINIJAB.handleMessage = function(message){
    var vars = {jid: $(message).attr('from'), msg: $(message).children('body').text()};
    var template = '<p><strong>{{jid}}</strong>: {{msg}}</p>'; 
    $('#chatArea').append(Mustache.to_html(template, vars)).scrollTop(100000);
    return true;
};

MINIJAB.connected = function(){
    $('#connStatusIndicator').html('Connected');
    //var domain = Strophe.getDomainFromJid(MINIJAB.connection.jid);
    MINIJAB.connection.addHandler(MINIJAB.handleMessage, null, "message");
    MINIJAB.connection.send($pres());
    var replaced = MINIJAB.userLogin.replace('@', '_at_');
    MINIJAB.joinRoom(replaced + '@' + MINIJAB.conference + '/' + 'Some User');
    return true;
};

MINIJAB.joinRoom = function(room){
    MINIJAB.connection.send($pres({to: room}).c('x',{xmlns: MINIJAB.NS_MUC}));
};

MINIJAB.chatInputEnter = function(e) {
    if (e.which == 13 /* Return */) {
        e.preventDefault();
	var chatinp = $("#chatinput");
	var text = chatinp.val();
	var msg = $msg({to: MINIJAB.jid, type: 'chat'}).c('body').t(text);
	MINIJAB.connection.send(msg);
        chatinp.val('');
    }
};


$('document').ready(
    function(){
	$('#channels').tabs();
	//$('#channels').tabs("remove", 0);
	$('#channels').tabs("add", "#room-some-room", "Some Room");
	$(document).bind('connect', MINIJAB.connect);
	$(document).bind('connected', MINIJAB.connected);
	$('#chatinput').bind('keydown', MINIJAB.chatInputEnter);
	$("button, input:submit").button();
	$("a", ".demo").click(function() { return false; });
	MINIJAB.layout =  $('body').layout({});
	MINIJAB.showLoginDialog();
    }
);