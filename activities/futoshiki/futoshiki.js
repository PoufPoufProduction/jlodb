(function($) {
    // Activity default options
    var defaults = {
        name        : "futoshiki",                              // The activity name
        label       : "Futoshiki",                              // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        nohint      : false,                                    // Hide hint button
        debug       : false                                     // Debug mode
    };

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onquit)  { ret = "mandatory callback onquit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onquit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Binding clear
        unbind: function($this) {
            $(document).unbind("keypress keydown");
            $this.unbind("mouseup mousedown mousemove mouseleave touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                $("head").find("link").each(function() {
                    if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                });

                if(cssAlreadyLoaded) { helpers.loader.template($this); }
                else {
                    $("head").append("<link></link>");
                    var css = $("head").children(":last");
                    var csspath = "activities/"+settings.name+"/"+settings.css+debug;

                    css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(
                        function() { helpers.loader.template($this); });
                }
            },
            template: function($this) {
                var settings = helpers.settings($this), debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                // Load the template
                var templatepath = "activities/"+settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.build($this); });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.nohint) { $($this.find("#buttons>div").get(1)).hide(); }

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // BUILD TABLE
                var size = Math.floor(($this.find("#board").height()*0.9)/(settings.data.length*2));
                var size = Math.floor(size/4)*4;

                html="<table id='t' style='font-size:"+size+"px;'>";
                for (var i=0; i<settings.data.length; i++) {
                    html+="<tr"+(i%2?" class='inter'":"")+">";
                    for (var j=0; j<settings.data[i].length; j++) {
                        html+="<td class='t'><div id='"+j+"x"+i+"' class='";
                        if (i%2 && j%2) { html+="f07"; } else
                        switch (settings.data[i][j]) {
                            case " ":html+="f"+((i%2)?"01":"04"); break;
                            case "<":html+="f"+((i%2)?"02":"05"); break;
                            case ">":html+="f"+((i%2)?"03":"06"); break;
                            default :html+="f00 v"+(Math.floor(Math.random()*2)+1); break
                        }
                        html+="'>";
                        if (i%2==0 && j%2==0) {
                            html+="<div onmousedown='$(this).closest(\".futoshiki\").futoshiki(\"click\",event,"+j+","+i+",this);'";
                            html+=" ontouchstart='$(this).closest(\".futoshiki\").futoshiki(\"click\",event,"+j+","+i+",this);";
                            html+="event.preventDefault();'></div>";
                            html+="<table class='hint'>";
                            for (var k=0; k<9; k++) {
                                if (k%3==0) { html+="<tr>"; }
                                html+="<td><div id='c"+i+"'";
                                html+=" onmousedown='$(this).closest(\".futoshiki\").futoshiki(\"click\",event,"+j+","+i+",this,true);'";
                                html+=" ontouchstart='$(this).closest(\".futoshiki\").futoshiki(\"click\",event,"+j+","+i+",this,true);";
                                html+="event.preventDefault();'></div></td>";
                                if (k%3==2) { html+="</tr>"; }
                            }
                            html+="</table>";
                        }
                        html+="</div></td>";
                    }
                    html+="</tr>";
                }
                html+="</table>";
                $this.find("#board").html(html);

                if (settings.fixed) for (var i in settings.fixed) {
                    $this.find("#board #"+(2*settings.fixed[i][0])+"x"+(2*settings.fixed[i][1])+">div").addClass("fixed")
                         .html(settings.data[2*settings.fixed[i][1]][2*settings.fixed[i][0]]);
                }

                // Keypad
                var nb = 1+(settings.data[0].length+1)/2;
                for (var i=0; i<nb; i++) {
                    settings.$keys.push($this.find("#keypad #key"+i)
                        .css("top",(1.5*Math.pow(nb/10,0.3)*Math.cos(2*Math.PI*(i/nb))-0.5)+"em")
                        .css("left",(1.5*Math.pow(nb/10,0.3)*Math.sin(2*Math.PI*(i/nb))-0.5)+"em")
                        .show());
                }

                $this.bind("mousemove touchmove", function(event) {
                    var settings = helpers.settings($this), $keypad = $this.find("#keypad");
                    if (settings.keypad) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                    event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                        var vTop = vEvent.clientY;
                        var vLeft = vEvent.clientX;
                        var vSize = settings.$keys[0].width();
                        var vAlready = false;
                        settings.key = -1;
                        for (var i in settings.$keys) {
                            settings.$keys[i].removeClass("s");
                            if (!vAlready) {
                                var vOffset = settings.$keys[i].offset();
                                vAlready = ( vTop>=vOffset.top && vLeft>=vOffset.left &&
                                            vTop<vOffset.top+vSize && vLeft<vOffset.left+vSize );
                                if (vAlready) { settings.key = i; settings.$keys[i].addClass("s"); }
                            }
                        }
                    }
                    event.preventDefault();
                });

                $this.bind("mouseup touchend", function(event) {
                    var settings = helpers.settings($this), $keypad = $this.find("#keypad");

                    if (settings.key!=-1 && settings.keypad) {
                        var vVal = settings.$keys[settings.key].text();
                        settings.keypad.text(vVal==0?"":vVal);
                        if (vVal!=0) {

                            if (settings.keypad.hasClass("fill")) {
                                if (helpers.check($this)) {
                                    settings.interactive = false;
                                    settings.score = helpers.score(settings.level, settings.timer.value);
                                    setTimeout(function() { helpers.end($this); }, 1000);
                                }
                            }
                            else
                            {
                                settings.keypad.closest('.cell').addClass("h");
                            }

                        }
                    }

                    $this.find(".active").removeClass("s");
                    $keypad.hide();
                    settings.keypad = 0;
                    event.preventDefault();
                });

                // Locale handling

                $this.find("#guide").html(settings.guide);
                $this.find("#guide2").html(settings.guide2);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        highlight: function($this, _posX, _posY, _hint) {
            var settings = helpers.settings($this);
            var nb=settings.data.length;
            $this.find("div#board>table td.t>div").removeClass("l1").removeClass("l2");
            for (var i=0; i<nb; i++) {
                $this.find("div#"+i+"x"+_posY).addClass("l1");
                $this.find("div#"+_posX+"x"+i).addClass("l1");
            }
            $this.find("div#"+_posX+"x"+_posY).removeClass("l1").addClass("l2");

            $this.find(".hint .s").removeClass("s");
            if (_hint) { $(_hint).addClass("s"); }

        }
    };

    // The plugin
    $.fn.futoshiki = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    mode    : true,
                    interactive : false,
                    score   : 5,
                    keypad      : 0,
                    key         : -1,
                    $keys       : []
                };

                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings["class"]) { $this.addClass($settings["class"]); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            // Handle the click event
            click:function(event,_col,_row,_elt, _hint) {
                var $this = $(this) , settings = helpers.settings($this), $keypad = $this.find("#keypad");

                if ($this.find("#"+_col+"x"+_row+">div").attr("class")!="fixed" && settings.interactive) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches &&
                                  event.originalEvent.touches.length)? event.originalEvent.touches[0]:event;
                    helpers.highlight($this, _col, _row, _hint?_elt:0);

                    if (settings.mode && _hint) {
                        $(_elt).closest(".f00").find(">div").text($(_elt).text()).show();
                        $(_elt).closest('.cell').removeClass("h");
                    }
                    else {
                        $this.find("#keypad .k").removeClass("s");
                        settings.keypad = $(_elt);
                        settings.key    = -1;

                        var vTop = vEvent.clientY - $this.offset().top;
                        var vLeft = vEvent.clientX - $this.offset().left;
                        var tmp = $this.find("#bg1").height()/1.5;
                        if (vTop<tmp)   { vTop = tmp; }
                        if (vLeft<tmp)  { vLeft = tmp; }
                        if (vTop+tmp>$this.height())    { vTop=$this.height()-tmp; }
                        if (vLeft+tmp>$this.width())    { vLeft=$this.width()-tmp; }
                        $keypad.css("top", vTop+"px").css("left", vLeft+"px").show();
                    }
                }
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.finish = true;
                settings.context.onquit($this,{'status':'abort'});
            },
            next: function()  { helpers.settings($(this)).interactive = true; },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    $this.find("#keypad").hide();
                    $this.find("#valid").hide();
                    $this.find("div#board>table td>div").removeClass("l1").removeClass("l2");
                    $this.find(".hint .s").removeClass("s");
                    for (var i=0; i<settings.data.length; i++) for (var j=0; j<settings.data.length; j++)
                    if (i%2==0 && j%2==0) {
                        if ($this.find("#"+j+"x"+i+">div").html()!=settings.data[i][j]) {
                            settings.score--;
                            $this.find("#"+j+"x"+i).addClass("wrong");
                        }
                    }
                    if (settings.score<0) settings.score=0;
                    setTimeout(function() { helpers.end($this); }, 2000);
                }
            },
            mode: function(_elt, _val) {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.mode!=_val) {
                    settings.mode = _val;
                    $this.find("#buttons .bg").removeClass("s");
                    $this.find(".hint .s").removeClass("s");
                    $this.find("#keypad").hide();
                    $(_elt).parent().addClass("s");
                    $this.find("div#board .f00").each( function() {
                        $cell = $(this);
                        if (settings.mode) {
                            var hintempty=true;
                            $cell.find(".hint div").each(function() {
                                var v = $(this).html();
                                if (v && v.length!=0 && v[0]!=' ' && v!="&#xA0;") { hintempty=false; }
                            });
                            if (hintempty) { $cell.find(">div").show(); }

                        }
                        else {
                            var $value = $cell.find(">div");
                            if ($value && (!$value.html() || $value.html().length==0 || $value.html()[0]==' ' || $value.html()=="&#xA0;")) {
                                 $value.hide();
                            }
                        }
                    });
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in futoshiki plugin!'); }
    };
})(jQuery);

