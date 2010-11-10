var MINIJAB =  {
    connection: null,
    NS_MUC: 'http://jabber.org/protocol/muc',
    removed_default_tab: false
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
	title: 'Sign In',
	buttons: {
	    "Connect": function(){
		$(document).trigger('connect', {
		    jid: $('#jid').val() + '@' + MINIJAB.server,
		    password: $('#password').val()
		});
		$('#password').val('');
		$(this).dialog('close');
	    }    
	}
    });
    $('#loginMessage').html(message);
};

MINIJAB.sendPing = function(to){
    var ping = $iq({to: to, type: 'get', id: 'ping1'}).c('ping', {xmlns: "urn:xmpp:ping"});
    MINIJAB.connection.send(ping);
};

MINIJAB.handleMessage = function(message){
    var vars = {jid: $(message).attr('from'), msg: $(message).children('body').text()};
    var template = '<p><strong>{{jid}}</strong>: {{msg}}</p>'; 
    $('#chatArea').append(Mustache.to_html(template, vars)).scrollTop(100000);
    return true;
};

MINIJAB.connected = function(){
    $('#connStatusIndicator').html('Connected');
    var domain = Strophe.getDomainFromJid(MINIJAB.connection.jid);
    MINIJAB.connection.addHandler(MINIJAB.handleMessage, null, "message");
    MINIJAB.connection.send($pres());
    MINIJAB.connection.send( 
	$pres({
		  to: 'support@conference.metin-sfco.office.n7/Metin Akat'
              }).c('x', {xmlns: MINIJAB.NS_MUC}));
    return true;
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

MINIJAB.drawMap = function (){
    var row_cnt = 0, col_cnt = 0, yCoord = 0, xCoord = 0;
    var map_table = "";
    for(row_cnt = 0; row_cnt < 40; row_cnt ++){
        map_table += "<tr class='mapRow'>";
        for(col_cnt = 0; col_cnt < 25; col_cnt ++){
            var vars = {xC: (col_cnt), yC: (row_cnt)};
            //template = "<td class='mapCell' id='x{{xC}}y{{yC}}'>{{xC}};{{yC}}</td>";
	    template = "<td class='mapCell' id='x{{xC}}y{{yC}}'></td>";
            map_table += Mustache.to_html(template, vars);
        };
        map_table += "</tr>";
    }
    $(this).append(map_table);
};



$('document').ready(
    function(){
	$('#channels').tabs();
	//$('#channels').tabs("remove", 0);
	//$('#channels').tabs("add", "#bla", "Bla");
	$(document).bind('connect', MINIJAB.connect);
	$(document).bind('connected', MINIJAB.connected);
	$('#chatinput').bind('keydown', MINIJAB.chatInputEnter);
	$("button, input:submit").button();
	$("a", ".demo").click(function() { return false; });
	MINIJAB.layout =  $('body').layout({});
	MINIJAB.showLoginDialog();
    }
);