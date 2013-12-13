jlodb = {

    // ACTIVITY GENERIC CONTEXT
    context: {
        // CONTEXT CALLBACKS - TODO: remove onQuit and onLoad
        onQuit : function(_ret) { jlodb.context.onquit(_ret); },
        onquit : function(_ret) {
            if (_ret.status=="success") { jlodb.score.show(_ret.score); }
            else                        { jlodb.context.end(true); }
        },
        onLoad : function(_begin) { jlodb.context.onload(_begin); },
        onload: function(_begin) {
            if (!_begin) {
                $("#"+jlodb.launcher.id.waiting+" div").removeClass("running");
                $("#"+jlodb.launcher.id.waiting).hide();
                $("#"+jlodb.launcher.id.launcher).show();
                jlodb.score.hide();
                jlodb.context.onevent(true);
            }
        },
        // OTHER METHODS
        end: function(_hide) {
            if (_hide) {
               jlodb.score.hide();
                $("#"+jlodb.launcher.id.activity).html("");
                $("#"+jlodb.launcher.id.launcher).hide();
            }
            jlodb.context.onevent(false);
        },

        // OVERWRITABLE METHODS
        onevent : function(_begin)                  { if (_begin) { jlodb.context.onstart(); } else { jlodb.context.onfinish(); } },
        onstart : function()                        { /** START THE ACTIVITY */ },
        onfinish : function()                       { /** FINISH THE ACTIVITY */ }
    },

    // JLODB EXERCICES LAUNCHER
    launcher: {
        id              : {
            launcher    : "launcher",
            activity    : "activity",
            waiting     : "waiting"
        },
        debug           : true,
        private         : {
            activity    : "",
            args        : ""
        },

        rerun       : function() {
            jlodb.launcher.run(jlodb.launcher.private.activity, jlodb.launcher.private.args);
        },

        // RUN THE EXERCICE REGARDING THE ACTIVITY NAME AND ITS ARGUMENTS
        run         : function(_name, _args) {
            $("#"+jlodb.launcher.id.waiting+" div").addClass("running");
            $("#"+jlodb.launcher.id.waiting).show();
            jlodb.launcher.private.activity = _name;
            jlodb.launcher.private.args = $.extend(true, {},_args);
            var args = $.extend({ 'context': jlodb.context } , _args);
            args.debug = jlodb.launcher.debug;

            if (typeof($("#"+jlodb.launcher.id.activity)[_name])=='undefined') {
                $.getScript('activities/'+_name+'/'+_name+'.js', function() { $("#"+jlodb.launcher.id.activity)[_name](args); });
            }
            else { $("#"+jlodb.launcher.id.activity)[_name](args); }
        },

        // QUIT THE CURRENT EXERCICE
        quit        : function() { $("#"+jlodb.launcher.id.activity)[jlodb.launcher.private.activity]('quit'); },

        // GET EXERCICE AND LAUNCH
        exercice    : function(_args) {
            // HANDLE ARGS
            var args    = "";
            for (var i in _args) { if (args) { args+="&"; } args+=i+"="+_args[i]; }
            if (args) { args="?"+args; }

            // GET EXERCICE FROM DATABASE AND LAUNCH
            var url     = "api/exercice.php"+args;
            $.getJSON(url, function (data) {
                var d = data.data;
                if (data.locale) { if (d.locale) { d.locale = $.extend(d.locale, data.locale); } else { d.locale = data.locale; } }
                d.label = data.label;
                jlodb.launcher.run(data.activity, d);
            });
        }
    },

    // SCORE
    score: {
        l           : { menu : 0, launcher : 0, next: 0 },
        id          : "jscore",
        value       : 0,
        show        : function(_score) {
            jlodb.score.value = _score;
            $("#"+jlodb.score.id).attr("class","s"+_score).show();
            $("#"+jlodb.score.id+" #next").toggle((_score>1 && jlodb.score.l.menu!=0 && jlodb.score.l.menu.more()) ||
                                                  (jlodb.score.l.next!=0));
            $("#"+jlodb.score.id+" #reload").toggle((jlodb.score.l.launcher!=0));
            $("#"+jlodb.score.id+" #menu").toggle((jlodb.score.l.menu!=0));

            if ((jlodb.score.l.menu) &&(jlodb.score.l.menu.update) && (_score>1)) { jlodb.score.l.menu.update(_score); }
        },
        hide        : function() { $("#"+jlodb.score.id).removeClass().hide(); },
        close       : function() { jlodb.context.end(true); },
        reload      : function() { jlodb.context.end(false); jlodb.score.l.launcher.rerun();},
        next        : function() { if (jlodb.score.l.next!=0) { jlodb.context.end(true); jlodb.score.l.next(); } else
                                                              { jlodb.context.end(false);jlodb.score.l.menu.next(); }}
    },

    // MENU
    menu: {
        l           : { ext: 0, launcher : 0 },     // list of listeners
        id          : "",                           // id of the menu
        list        : [],                           // exercices list
        state       : "",                           // exercices state (locked, score...)
        last        : 0,                            // last exercice played from menu
        more        : function() { return (jlodb.menu.last<jlodb.menu.list.length-1); },
        next        : function() {
            jlodb.menu.last++;
            jlodb.menu.l.launcher.exercice({id:jlodb.menu.list[jlodb.menu.last]});
        },
        star        : function(_id) {
            $(jlodb.menu.id).find(".menu #"+_id+" .state").removeClass()
                            .addClass("state"+(jlodb.menu.state[_id]!='.'?" s"+jlodb.menu.state[_id]:""));
        },
        update      : function(_score) {
            if (jlodb.menu.state[jlodb.menu.last]!='l') {
                if (jlodb.menu.state[jlodb.menu.last]=='.' || parseInt(jlodb.menu.state[jlodb.menu.last])<=_score) {
                    jlodb.menu.state =
                        jlodb.menu.state.substr(0, jlodb.menu.last)+_score.toString()+jlodb.menu.state.substr(jlodb.menu.last+1);
                    jlodb.menu.star(jlodb.menu.last);

                    if (jlodb.menu.more() && jlodb.menu.state[jlodb.menu.last+1]=='l') {
                        jlodb.menu.state =
                            jlodb.menu.state.substr(0, jlodb.menu.last+1)+"."+jlodb.menu.state.substr(jlodb.menu.last+2);
                        jlodb.menu.star(jlodb.menu.last+1);
                    }

                    if (jlodb.menu.l.ext && jlodb.menu.l.ext.update) { jlodb.menu.l.ext.update(jlodb.menu.state); }
                }
            }
            else { alert("menu.update error ("+jlodb.menu.last+"|"+jlodb.menu.state[jlodb.menu.last]+")"); }
        },
        exercice    : function(_this) {
            if (!$(_this).find(".state").hasClass("sl")) {
                jlodb.menu.last = parseInt($(_this).attr("id"));
                jlodb.menu.l.launcher.exercice({id:jlodb.menu.list[jlodb.menu.last]});
            }
        },
        drag        : function() {
            var y= ($(jlodb.menu.id).find(".cursor").offset().top-$(jlodb.menu.id).find(".slider").offset().top)/
                   ($(jlodb.menu.id).find(".slider").height()-$(jlodb.menu.id).find(".cursor").height());
            $(jlodb.menu.id).find(".header").toggle((y!=0));
            $(jlodb.menu.id).find(".footer").toggle((y!=1));
            var val = -Math.floor(y*(20+$(jlodb.menu.id).find(".menu").height()-$(jlodb.menu.id).find(".jmenu").height()));
            $(jlodb.menu.id).find(".menu").css("top",val+"px");
        },
        build       : function(_id, _list, _state) {
            jlodb.menu.list = _list;
            jlodb.menu.id = _id;
            if (_state.length < _list.length) { var nb = _list.length-_state.length; for (var i=0; i<nb; i++) _state+="l"; }
            jlodb.menu.state = _state;

            $(_id).html("<div class='jmenu'><div class='slider'><div class='cursor'></div></div><div class='header'></div>"+
                        "<div class='footer'></div><div class='menu'></div></div>");
            for (var i in _list) {
                $(_id).find(".menu").append("<div class='icon"+(i>=99?" gtc":"")+"' id='"+i+"' onclick='jlodb.menu.exercice(this);' ontouchstart='jlodb.menu.exercice(this);event.preventDefault();'><div class='legend'>"+(parseInt(i)+1)+"</div><div class='state sl'></div></div>");
            }
            for (var i=0; i<_state.length; i++) { jlodb.menu.star(i); }

            if ($(jlodb.menu.id).height()<$(jlodb.menu.id).find(".menu").height()) {
                $(jlodb.menu.id).find(".slider").css("opacity",1);
                $(_id).find(".cursor").draggable({ axis:"y", containment:"parent", drag:function() { jlodb.menu.drag(); }});
                jlodb.menu.drag();
            }
            else { $(jlodb.menu.id).find(".slider").css("opacity",0); }


        }
    }

}

// DEFAULT CROSSED REFERENCES
jlodb.menu.l.launcher   = jlodb.launcher;
jlodb.score.l.menu      = jlodb.menu;
jlodb.score.l.launcher  = jlodb.launcher;

