var user = {
    timer       : 0,        // timer for logout
    locale      : {},       // localization
    settings    : {},       // user parameter
    avatar      : "",       // avatar save

    // ---- TO OVERRIDE ---
    inputpanel  : 0,
    onrequest   : 0,
    onreply     : 0,
    onuser      : 0,
    // --------------------

    onEvent : function() { },  // To override 
            
    getJSON : function(_url, _args, _post, _cbk, _alert) {
        var url = _url;
        if (user.islogged()) { url+="?username="+user.settings.name+"&code="+user.settings.code; }
        else                 { url+="?anonymous=1"; }
        if (typeof(_args)=="object") {  for (var i in _args) { url+="&"+i+"="+_args[i]; } }
        else if (_args.length) { url+=(_args[0]=='&'?"":"&")+_args; }
        if (_alert){ console.log("+ user.getJSON( "+url+" )"); }
        if (user.onrequest) { user.onrequest(); }
        if (_post) {
			$.post(url, _post, function(_data) {
				if (user.onreply) { user.onreply(); } if(_data.error==102){location.reload();} else { _cbk(_data); } }, "json");
		}
        else       { $.getJSON(url, function(_data)     { if (user.onreply) { user.onreply(); } if(_data.error==102){ alert("user error (url: "+url+") :"+_data.error); } else { _cbk(_data); } }); }
    },
    load: {
        logpanel: function($elt, _args, _cbk) {
            var $logpanel = $("<div id='logpanel'>").load("user/logpanel.html?id="+Math.floor(Math.random()*1000), _cbk);
            $elt.append($logpanel);
            if (_args && _args.close) {
                $logpanel.bind("touchstart mousedown", function(_event) { $(this).hide();_event.preventDefault(); });
            }
        },
        edit    : function($elt, _cbk) { $elt.append($("<div id='upuser'>").load("user/edit.html", _cbk)); },
        devmode : function($elt, _cbk) { $elt.append($("<div id='udevmode' onmousedown='$(this).hide();' ontouchstart='$(this).hide();event.preventDefault();'>").load("user/devmode.html", _cbk)); },
        friend  : function($elt, _cbk) { $("<div></div").load("user/friends.html", function() { $elt.append($(this).children()); if (_cbk) { _cbk(); } }); },
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
    devmode: function(_login) {
        if (_login) {
            $.getJSON("user/api/devmode.php?password="+$("#udevmode input").val(), function(_data) {
                user.settings.devmode = _data.devmode; user.onEvent(); $("#udevmode input").val("");
            });
            $("#udevmode").hide();
        }
        else { $.getJSON("user/api/devmode.php", function(_data) { user.settings.devmode = _data.devmode; user.onEvent(); }); }
    },
    islogged: function() { return (user.settings && user.settings.name); },
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

            $("input[name=username]").val(""); $("input[name=password]").val(""); $("input[name=password2]").val("");

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

            $("#upop").val(user.locale.value.upop).show();$("#upopr").val("").hide();
            $("#upnp").val(user.locale.value.upnp).show();$("#upnpr").val("").hide();
            $("#upcp").val(user.locale.value.upcp).show();$("#upcpr").val("").hide();
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
    },
    circle : {
        timer: 0,
        remove: function() {
            if ($("#uflcircles").val().length) {
                if (user.circle.timer) {
                    clearTimeout(user.circle.timer); user.circle.timer = 0; $("#uflremove").removeClass("s");
                    user.getJSON("user/api/circle.php",{action:"del",value:$("#uflcircles").val()}, "", function(_data){
                        user.circle.list(function() { 
                            user.friend.get($("#uflcircles").val(), function() {  $("#uflpanel").show();}); });
                        user.circle.list(0, { elt:"#ufltarget", noempty:true}); $("#uflheader .label").removeClass("s");
                    });

                }
                else {
                    $("#uflremove").addClass("s");
                    user.circle.timer = setTimeout(function() { $("#uflremove").removeClass("s"); user.circle.timer = 0; }, 500);
                }
            }
        },
        selectall: function(_elt) {
            if ($(_elt).hasClass("s"))  { $(_elt).removeClass("s"); $("#uflcontent .user").removeClass("s"); }
            else                        { $(_elt).addClass("s");    $("#uflcontent .user").addClass("s");    }
            user.friend.footer();
        },
        list: function(_cbk, _args) {
            user.getJSON("user/api/circle.php",{orderby:"Circle_Name"},0,function(_data) {
                var $elt = (_args && _args.elt)?$(_args.elt):$("#uflcircles");
                $elt.empty();
                if (!_args || !_args.noempty) { $elt.append("<option></option>"); }
                for (var i in _data.circles) {
                    var html="<option value='"+_data.circles[i].key+"'";
                    if (_args && _args.selected && _data.circles[i].name==_args.selected) { html+=" selected='selected'"; }
                    html+=">"+_data.circles[i].name+"</option>";
                    $elt.append(html);
                }
                if (_cbk) { _cbk(); }
            });
        },
        edit: function() {
            if ($("#uflcircles").val()) {
                user.inputpanel($("#uflcircles option:selected").text(), function(_value) {
                    if (_value && _value.length) {
                        user.getJSON("user/api/circle.php",{action:"upd",circle:$("#uflcircles").val(), value:encodeURIComponent(_value)},0,
                            function(_data) {
                                user.circle.list(
                                    function() { user.friend.get($("#uflcircles").val(), function() {  $("#uflpanel").show();}); },
                                    { selected: _value });
                                user.circle.list(0, { elt:"#ufltarget", noempty:true});
                            });
                    }
                });
            }
        },
        open: function() { user.inputpanel("", function(_value) {
            if (_value && _value.length) {
                user.getJSON("user/api/circle.php",{action:"new",value:encodeURIComponent(_value)},0,function(_data) {
                    $("#uflcontent").empty(); user.circle.list(0, {selected: _value}); user.circle.list(0, { elt:"#ufltarget", noempty:true});
                    $("#uflheader .label").html(0); 
                });
            }
        }); },
        onselect: function(_key) { }
    },
    friend : {
        data : {
            uflpanel : false
        },
        update: function() {
            if ($("#uflfooter").hasClass("s")) {
                switch($("#uflaction").val()) {
                    case "1":
                        $("#uflcontent .user.s").each(function(_index) {
                            user.getJSON("user/api/circle.php",{action:"link",circle:$("#ufltarget").val(),value:$(this).attr("id").substr(1)},0,function(_data) {});
                            $(this).removeClass("s");
                        });
                        break;
                    case "2":
                        $("#uflcontent .user.s").each(function(_index) {
                            user.getJSON("user/api/circle.php",{action:"unlink",circle:$("#ufltarget").val(),value:$(this).attr("id").substr(1)},0,function(_data) {});
                            $(this).detach();
                        });
                        break;
                    case "3":
                        $("#uflcontent .user.s").each(function(_index) {
                            user.getJSON("user/api/friend.php",{action:"del",value:$(this).attr("id").substr(1)},0,function(_data) {});
                            $(this).detach();
                        });
                        break;
                }
                $("#uflheader .label").html($("#uflcontent .user").length).removeClass("s");
            }
        },
        footer: function() {
            if ($("#uflcontent .user.s").length) {
                $("#uflfooter").addClass("s");
                $("#uflfooter #uflaction").removeAttr("disabled");
                if ($("#uflaction").val()==1)     { $("#ufltarget").removeAttr("disabled"); }  else { $("#ufltarget").attr("disabled","disabled"); }
                if ($("#uflcircles").val().length){ $("#uflout").removeAttr("disabled"); }     else { $("#uflout").attr("disabled","disabled"); }
                if ($("#ufltarget option").length){ $("#uflin").removeAttr("disabled"); }      else { $("#uflin").attr("disabled","disabled"); }
            }
            else {
                $("#uflfooter").removeClass("s");
                $("#uflfooter select").attr("disabled","disabled");
                $("#uflfooter #uflaction").val(0);
            }
        },
        process: function(_elt,_key, _action, _cbk) {
            user.getJSON("user/api/friend.php",{action:_action,value:_key},0,function(_data) {
            var $content = $(_elt).closest('.bucontent');
            $(_elt).parent().parent().detach();
            if ($content.find(".data").is(":empty")) { $content.find(".alert").show(); }
            });
        },
        elt: function(_user, _args) {
            if (!_args) { _args = {}; }
            var ret=$("<div class='user"+(_args.large?"":" small")+"' id='u"+_user.key+"'></div>");
            if (_args.select) {
            ret.addClass("c").bind("mousedown touchstart", function(_event) {
                $(this).toggleClass("s");
                _args.select(ret);
                _event.preventDefault();
            });
            }
            if (_args.large) {
            var avatar = $("<div class='avatar nd'><div></div></div>");
            avatar.find("div").gonz({interactive:false, code:_user.avatar, context:{onclick:function($this){},onquit:function($this, _ret){}}});
            ret.append(avatar);
            }
            var legend=$("<div class='legend'></div>");
            legend.append("<div class='id'>"+_user.id+"</div>");
            legend.append("<div class='key nd'>"+_user.key+"</div>");
            legend.append("<div class='name nd'>"+_user.first+" "+_user.last+"</div>");
            legend.append("<div class='tag nd'>"+_user.tag+"</div>");
        
            if (_args.type=="add") {
            legend.append("<div class='icon nd cb' onclick='user.friend.process(this,\""+_user.key+"\",\"new\");'>"+
                      "<img src='user/res/img/add.svg'/></div>");
            }
            else if (_args.type=="wait") {
            legend.append("<div class='icon nd cb' onclick='user.friend.process(this,\""+_user.key+"\",\"del\");'>"+
                      "<img src='user/res/img/cancel.svg'/></div>");
            }
            else if (_args.type=="accept") {
            legend.append("<div class='icon nd cb' onclick='user.friend.process(this,\""+_user.key+"\",\"valid\");'>"+
                      "<img src='user/res/img/valid.svg'/></div>");
            legend.append("<div class='space nd'>&nbsp;</div>");
            legend.append("<div class='icon nd' onclick='user.friend.process(this,\""+_user.key+"\",\"del\");'>"+
                      "<img src='user/res/img/cancel.svg'/></div>");
            }
            ret.append(legend);

            if (user.onuser) { user.onuser(_user, _args, ret); }

            return ret;
        },
        open : function(_elt) {
            switch(_elt) {
            case "ufspanel" : $("#ufspanel").show(); break;
            case "ufapanel" :
                $("#ufacontent").html("");
                user.getJSON("user/api/friend.php", {action:"waiting"}, 0, function(_data) {
                for (var i in _data.users) {
                    $("#ufacontent").append(user.friend.elt(_data.users[i],{large:_data.users.length<19, type:"wait"}));
                }
                if (_data.users && _data.users.length) { $("#ufaalert").hide(); } else { $("#ufaalert").show(); }
                $("#ufapanel").show();
                });
                break;
            case "ufppanel" :
                $("#ufpcontent").html("");
                user.getJSON("user/api/friend.php", {action:"ask"}, 0, function(_data) {
                for (var i in _data.users) {
                    $("#ufpcontent").append(user.friend.elt(_data.users[i],{large:_data.users.length<19, type:"accept"}));
                }
                if (_data.users && _data.users.length) { $("#ufpalert").hide(); } else { $("#ufpalert").show(); }
                $("#ufppanel").show();
                });
                break;
            case "uflpanel" :
                if (user.friend.data.uflpanel) { $("#uflpanel").show(); }
                else {
                    user.friend.data.uflpanel = true;
                    user.circle.list(function() { 
                        user.friend.get($("#uflcircles").val(), function() {  $("#uflpanel").show();}); });
                    user.circle.list(0, { elt:"#ufltarget", noempty:true});
                }
                break;
            }

        },
        get: function(_group, _cbk) {
            $("#uflcontent").html("");
            user.getJSON("user/api/friend.php", {circle:_group}, 0, function(_data) {
            if (_data.users) for (var i in _data.users) {
                $("#uflcontent").append(user.friend.elt(_data.users[i],{large:_data.users.length<19, type:"list",
                select:user.friend.footer }));
            }
            user.friend.footer();
            $("#uflheader .label").html(_data.users?_data.users.length:0); $("#uflheader .label").removeClass("s");
            if (_cbk) { _cbk(); }
            user.circle.onselect(_group);
            });
        },
        search : function() {
            user.getJSON("user/api/user.php",{value:$("#ufsheader input").val()},0,function(_data) {
            for (var i in _data.users) {
                $("#ufscontent").append(user.friend.elt(_data.users[i],{large:_data.users.length<19, type:"add"}));
            }
            });
        }
    }
};




