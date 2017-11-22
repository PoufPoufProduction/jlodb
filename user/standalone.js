var user = {
    timer       : 0,        // timer for logout
    logintimer  : false,
    settings    : {
        devmode     : false
    },       // user parameter

    onEvent : function() { },                                   // To overwrite
    getJSON : function(_url, _args, _post, _cbk, _alert) { },   // To overwrite
    load: {
        logpanel: function($elt, _args, _cbk) {
            var $logpanel = $("<div id='logpanel' class='standalone'>").load("user/standalone.html?id="+Math.floor(Math.random()*1000), _cbk);
            $elt.append($logpanel);
        }
    },
    edit: { open: function() { $("#logpanel").css("opacity",0).show().animate({opacity:1},500);; } },
    init: function() {
        user.onEvent();
    },
    islogged: function() { return (user.settings && user.settings.id); },
    login: function(_elt, _value) {
        if (!user.logintimer) {
            $("#logpanel .icon").removeClass("s");
            $(_elt).addClass("s");
            user.settings.id   = _value;
            user.settings.name = "&nbsp;";
            user.settings.tag = "";
            user.logintimer=true;
            setTimeout(function() {
                user.onEvent();
                $("#logpanel").animate({opacity:0},500, function(){
                    $(this).hide(); user.logintimer=false; }); }, 300 );
            
        }
    },
    logout : function($elt) {
       if (user.timer) {
           clearTimeout(user.timer); user.timer=0; $elt.removeClass("s");
           user.settings.id = 0;
           $("#logpanel .icon").removeClass("s");
           user.onEvent();
        }
        else { $elt.addClass("s"); user.timer = setTimeout(function() { user.timer=0; $elt.removeClass("s");}, 500); }
    }
};




