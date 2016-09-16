tibibu.circle = {
    timer: 0,
    remove: function() {
        if ($("#flcircles").val().length) {
            if (tibibu.circle.timer) {
                clearTimeout(tibibu.circle.timer); tibibu.circle.timer = 0; $("#flremove").removeClass("s");
                user.getJSON("user/api/circle.php",{action:"del",value:$("#flcircles").val()}, "", function(_data){
                    tibibu.circle.list(function() { 
                        tibibu.friend.get($("#flcircles").val(), function() {  $("#flpanel").show();}); });
                    tibibu.circle.list(0, { elt:"#fltarget", noempty:true}); $("#flheader .label").removeClass("s");
                });

            }
            else {
                $("#flremove").addClass("s");
                tibibu.circle.timer = setTimeout(function() { $("#flremove").removeClass("s"); tibibu.circle.timer = 0; }, 500);
            }
        }
    },
    selectall: function(_elt) {
        if ($(_elt).hasClass("s"))  { $(_elt).removeClass("s"); $("#flcontent .user").removeClass("s"); }
        else                        { $(_elt).addClass("s");    $("#flcontent .user").addClass("s");    }
        tibibu.friend.footer();
    },
    list: function(_cbk, _args) {
        user.getJSON("user/api/circle.php",{orderby:"Circle_Name"},0,function(_data) {
            var $elt = (_args && _args.elt)?$(_args.elt):$("#flcircles");
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
        if ($("#flcircles").val()) {
            tibibu.inputpanel.open($("#flcircles option:selected").text(), function(_value) {
                if (_value && _value.length) {
                    user.getJSON("user/api/circle.php",{action:"upd",circle:$("#flcircles").val(), value:encodeURIComponent(_value)},0,
                        function(_data) {
                            tibibu.circle.list(
                                function() { tibibu.friend.get($("#flcircles").val(), function() {  $("#flpanel").show();}); },
                                { selected: _value });
                        });
                }
            });
        }
    },
    open: function() { tibibu.inputpanel.open("", function(_value) {
        if (_value && _value.length) {
            user.getJSON("user/api/circle.php",{action:"new",value:encodeURIComponent(_value)},0,function(_data) {
                $("#flcontent").empty(); tibibu.circle.list(0, {selected: _value}); tibibu.circle.list(0, { elt:"#fltarget", noempty:true});
                $("#flheader .label").html(0); 
            });
        }
    }); }
};


tibibu.friend = {
    update: function() {
        if ($("#flfooter").hasClass("s")) {
            switch($("#flaction").val()) {
                case "1":
                    $("#flcontent .user.s").each(function(_index) {
                        user.getJSON("user/api/circle.php",{action:"link",circle:$("#fltarget").val(),value:$(this).attr("id").substr(1)},0,function(_data) {});
                        $(this).removeClass("s");
                    });
                    break;
                case "2":
                    $("#flcontent .user.s").each(function(_index) {
                        user.getJSON("user/api/circle.php",{action:"unlink",circle:$("#fltarget").val(),value:$(this).attr("id").substr(1)},0,function(_data) {});
                        $(this).detach();
                    });
                    break;
                case "3":
                    $("#flcontent .user.s").each(function(_index) {
                        user.getJSON("user/api/friend.php",{action:"del",value:$(this).attr("id").substr(1)},0,function(_data) {});
                        $(this).detach();
                    });
                    break;
            }
            $("#flheader .label").html($("#flcontent .user").length).removeClass("s");
        }
    },
    footer: function() {
        if ($("#flcontent .user.s").length) {
            $("#flfooter").addClass("s");
            $("#flfooter #flaction").removeAttr("disabled");
            if ($("#flaction").val()==1)     { $("#fltarget").removeAttr("disabled"); }  else { $("#fltarget").attr("disabled","disabled"); }
            if ($("#flcircles").val().length){ $("#flout").removeAttr("disabled"); }     else { $("#flout").attr("disabled","disabled"); }
            if ($("#fltarget option").length){ $("#flin").removeAttr("disabled"); }      else { $("#flin").attr("disabled","disabled"); }
        }
        else {
            $("#flfooter").removeClass("s");
            $("#flfooter select").attr("disabled","disabled");
            $("#flfooter #flaction").val(0);
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
        legend.append("<div class='icon nd cb' onclick='tibibu.friend.process(this,\""+_user.key+"\",\"new\");'>"+
                  "<img src='mods/tibibu/res/img/add.svg'/></div>");
        }
        else if (_args.type=="wait") {
        legend.append("<div class='icon nd cb' onclick='tibibu.friend.process(this,\""+_user.key+"\",\"del\");'>"+
                  "<img src='mods/socialis/res/img/cancel.svg'/></div>");
        }
        else if (_args.type=="accept") {
        legend.append("<div class='icon nd cb' onclick='tibibu.friend.process(this,\""+_user.key+"\",\"valid\");'>"+
                  "<img src='mods/socialis/res/img/valid.svg'/></div>");
        legend.append("<div class='space nd'>&nbsp;</div>");
        legend.append("<div class='icon nd' onclick='tibibu.friend.process(this,\""+_user.key+"\",\"del\");'>"+
                  "<img src='mods/socialis/res/img/cancel.svg'/></div>");
        }
        ret.append(legend);
        return ret;
    },
    menu : function(_elt) {
        $(".bunav2>div").removeClass("s"); $(_elt).addClass("s");
        $(".bucontent").hide(); 
        switch($(_elt).attr("id")) {
        case "fsmenu" : $("#fspanel").show(); break;
        case "famenu" :
            $("#facontent").html("");
            user.getJSON("user/api/friend.php", {action:"waiting"}, 0, function(_data) {
            for (var i in _data.users) {
                $("#facontent").append(tibibu.friend.elt(_data.users[i],{large:_data.users.length<19, type:"wait"}));
            }
            if (_data.users && _data.users.length) { $("#faalert").hide(); } else { $("#faalert").show(); }
            $("#fapanel").show();
            });
            break;
        case "fpmenu" :
            $("#fpcontent").html("");
            user.getJSON("user/api/friend.php", {action:"ask"}, 0, function(_data) {
            for (var i in _data.users) {
                $("#fpcontent").append(tibibu.friend.elt(_data.users[i],{large:_data.users.length<19, type:"accept"}));
            }
            if (_data.users && _data.users.length) { $("#fpalert").hide(); } else { $("#fpalert").show(); }
            $("#fppanel").show();
            });
            break;
        case "flmenu" :
            tibibu.circle.list(function() { 
                tibibu.friend.get($("#flcircles").val(), function() {  $("#flpanel").show();}); });
            tibibu.circle.list(0, { elt:"#fltarget", noempty:true});
            break;
        }

    },
    get: function(_group, _cbk) {
        $("#flcontent").html(""); $("#waiting div").addClass("running"); $("#waiting").show();
        user.getJSON("user/api/friend.php", {circle:_group}, 0, function(_data) {
        if (_data.users) for (var i in _data.users) {
            $("#flcontent").append(tibibu.friend.elt(_data.users[i],{large:_data.users.length<19,
            select:tibibu.friend.footer }));
        }
        tibibu.friend.footer();
        $("#flheader .label").html(_data.users?_data.users.length:0); $("#flheader .label").removeClass("s");
        $("#waiting div").removeClass("running"); $("#waiting").hide();
        if (_cbk) { _cbk(); }
        });
    },
    search : function() {
        $("#fscontent").html(""); $("#waiting div").addClass("running"); $("#waiting").show();
        user.getJSON("user/api/user.php",{value:$("#fsheader input").val()},0,function(_data) {
        for (var i in _data.users) {
            $("#fscontent").append(tibibu.friend.elt(_data.users[i],{large:_data.users.length<19, type:"add"}));
        }
        $("#waiting div").removeClass("running"); $("#waiting").hide();
        });
    }

};
