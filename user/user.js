var user = {
    timer       : 0,        // timer for logout
    locale      : {},       // localization
    settings    : {},       // user parameter
    avatar      : "",       // avatar save

    onEvent : function() { },  // To override 

    getJSON : function(_url, _args, _post, _cbk) {
        var url = _url+"?username="+user.settings.name+"&code="+user.settings.code;
        if (typeof(_args)=="object") {  for (var i in _args) { url+="&"+i+"="+_args[i]; } }
        else if (_args.length) { url+=(_args[0]=='&'?"":"&")+_args; }
        // alert(url);
        if (_post) { $.post(url, _post, function(_data) {if(_data.error==102){location.reload();} else { _cbk(_data); } }, "json"); }
        else       { $.getJSON(url, function(_data)     {if(_data.error==102){location.reload();} else { _cbk(_data); } }); }
    },
    load: {
        logpanel: function($elt, _args, _cbk) {
            var $logpanel = $("<div id='logpanel'>").load("user/logpanel.html?id="+Math.floor(Math.random()*1000), _cbk);
            $elt.append($logpanel);
            if (_args && _args.close) {
                $logpanel.bind("touchstart mousedown", function(_event) { $(this).hide();_event.preventDefault(); });
            }
        },
        edit    : function($elt, _cbk) { $elt.append($("<div id='upuser'>").load("user/edit.html", _cbk)); }
    },
    init: function(_lang) {
        $.getJSON("user/locale/"+_lang+"/text.json?debug="+Math.floor(Math.random()*1000), function(_locale) {
            user.locale = _locale;
            for (var i in _locale.template) { var $elt = $("#"+i);
                if ($elt.attr("value") && $elt.attr("value").length) { $elt.attr("value", _locale.template[i]); }
                else { $elt.html(_locale.template[i]); }
            }
        });

        setTimeout(function() {
            if ($.cookie("jlodb-name") && $.cookie("jlodb-code")) {
                $.getJSON("user/api/login.php?username="+$.cookie("jlodb-name")+"&code="+$.cookie("jlodb-code"),
                    function(_data) { user.onlogin(_data); } );
            }
            else { user.onEvent(); }
        },500);
    },
    login: function() {
        if ($("#logpanel").hasClass("s")) {
            $.getJSON("user/api/usernew.php"+
                "?username="+$("input[name=username]").val()+"&password="+$("input[name=password]").val()+
                "&confirm="+$("input[name=password2]").val(),user.onlogin);
        }
        else {
            $.getJSON("user/api/login.php"+
                "?username="+$("input[name=username]").val()+"&password="+$("input[name=password]").val(),user.onlogin);
        }
    },
    logout : function($elt) {
        if (user.timer) {
            clearTimeout(user.timer); user.timer=0; $elt.removeClass("s");

            if (user.settings.name) {
                user.getJSON("user/api/login.php", {"action":"logout"}, 0, function(_data) {
                    $.cookie("jlodb-code",0); user.settings = {}; user.onEvent();
                });
            }
        }
        else { $elt.addClass("s"); user.timer = setTimeout(function() { user.timer=0; $elt.removeClass("s");}, 500); }
    },
    onlogin: function(_data) {
        if (_data.status=="success"&& _data.code && _data.code.length) {
            $("#logpanel").hide();
            user.settings = _data;

            $.cookie("jlodb-name", _data.name, { expires : 1 });
            $.cookie("jlodb-code", _data.code, { expires : 1 });

            user.onEvent();
        }
        else {
            if ($("#logpanel").is(":visible")) {
                $("#logpanel").show().addClass("wrong");
                setTimeout(function(){$("#logpanel").removeClass("wrong");}, 800);
            }
            else { user.onEvent(); }
        }
    },


    edit    : {
        avatar : function() {
            if ($("#upuser #gonz").children().length==0) {
                $("#upuser #gonz").gonz({class:"nosnapshot", code:user.avatar,
                    context:{onquit:function($this, _ret){
                        $("#upuser #header").show(); $("#upuser #footer").show(); $this.hide();
                        user.avatar = _ret.code;
                        $("#upuser #avatar>div").gonz('import',user.avatar);
                }}});
            } else if (user.avatar) { $("#upuser #gonz").gonz('import',user.avatar); }

            $("#upuser #header").hide(); $("#upuser #footer").hide(); $("#upuser #gonz").show();
        },
        open : function() {
            if ($("#upuser #avatar>div").children().length==0) {
                $("#upuser #avatar>div").gonz({interactive:false, code:user.settings.avatar, context:{
                        onclick:function($this){ user.edit.avatar(); },
                        onquit:function($this, _ret){}}});
            }
            else if (user.settings.avatar) {
                $("#upuser #avatar>div").gonz('import',user.settings.avatar);
            }

            user.avatar = user.settings.avatar;

            $("#upid").attr("value",user.settings.name);

            if (user.settings.last)  { $("#upln").val(user.settings.last).removeClass(); }
            else                     {  $("#upln").val(user.locale.value.upln).addClass("empty"); }

            if (user.settings.first) { $("#upfn").val(user.settings.first).removeClass(); }
            else                     { $("#upfn").val(user.locale.value.upfn).addClass("empty"); }

            if (user.settings.email) { $("#upem").val(user.settings.email).removeClass(); }
            else                     { $("#upem").val(user.locale.value.upem).addClass("empty"); }

            $("#upop").val(user.locale.value.upop).show();$("#upopr").attr("value","").hide();
            $("#upnp").val(user.locale.value.upnp).show();$("#upnpr").attr("value","").hide();
            $("#upcp").val(user.locale.value.upcp).show();$("#upcpr").attr("value","").hide();
            $("#upuser #error").html("").hide();
            $("#upuser>div").css("top","25em").css("opacity",0).animate({top:"2em",opacity:1}, 1000 );
            $("#upuser").show();
        },
        update: function() {
            var args="";
            var error="";

            if (!$("#upln").hasClass("empty") && $("#upln").val()!=user.settings.last) {
                args+="&last="+$("#upln").val();
            }
            if (!$("#upfn").hasClass("empty") && $("#upfn").val()!=user.settings.first) {
                args+="&first="+$("#upfn").val();
            }
            if (!$("#upem").hasClass("empty") && $("#upem").val()!=user.settings.email) {
                if ( $("#upem").val().indexOf("@")==-1 ) {
                    error = user.locale.email?user.locale.email:"Invalid e-mail";
                }
                else {
                    args+="&email="+$("#upem").val();
                }
            }

            if ($("#upopr").val().length) { args+="&old="+$("#upopr").val(); }
            if ($("#upnpr").val().length) { args+="&new="+$("#upnpr").val(); }
            if ($("#upcpr").val().length) { args+="&con="+$("#upcpr").val(); }

            if (user.avatar.length && user.avatar!=user.settings.avatar) {
                args+="&avatar="+encodeURIComponent(user.avatar);
            }

            $("#upuser #error").html(error).show();

            if (!error.length) {
                if (args.length) {
                    user.getJSON("user/api/userupd.php", args, 0, function (_data) {
                        if (_data.status=="success") { user.edit.close(); user.onlogin(_data); }
                        else {
                            $("#upuser #error").html(user.locale["err"+_data.error]?user.locale["err"+_data.error]:_data.textStatus);
                        }
                    });
                }
                else { user.edit.close(); }
            }
        },
        close: function() {
            $("#upuser>div").animate({opacity:0}, 500, function() {$("#upuser").hide();} );
        }
    }
};




