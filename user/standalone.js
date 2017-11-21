var user = {
    timer       : 0,        // timer for logout
    settings    : {
        devmode     : false
    },       // user parameter

    onEvent : function() { },  // To override 
            
    getJSON : function(_url, _args, _post, _cbk, _alert) {
        var url = _url+"?standalone=1";
        if (typeof(_args)=="object") {  for (var i in _args) { url+="&"+i+"="+_args[i]; } }
        else if (_args.length) { url+=(_args[0]=='&'?"":"&")+_args; }
        if (_alert){ console.log("+ user.getJSON( "+url+" )"); }
        if (user.onrequest) { user.onrequest(); }
        if (_post) { $.post(url, _post, function(_data) {if (user.onreply) { user.onreply(); } if(_data.error==102){location.reload();} else { _cbk(_data); } }, "json"); }
        else       { $.getJSON(url, function(_data)     {if (user.onreply) { user.onreply(); } if(_data.error==102){location.reload();} else { _cbk(_data); } }); }
    },
    load: {
        logpanel: function($elt, _args, _cbk) {
            var $logpanel = $("<div id='logpanel' class='standalone'>").load("user/standalone.html?id="+Math.floor(Math.random()*1000), _cbk);
            $elt.append($logpanel);
        }
    },
    edit: { open: function() { $("#logpanel").show(); } },
    init: function() {
        user.onEvent();
    },
    islogged: function() { return (user.settings && user.settings.name); },
    login: function(_elt, _value) {
        $("#logpanel .icon").removeClass("s");
        $(_elt).addClass("s");
        user.settings.username = "user"+_value;
        $("#logpanel").hide();
        user.onEvent();
    },
    logout : function($elt) {
       
    },
    onlogin: function(_data) {
        user.onEvent();
    }
};




