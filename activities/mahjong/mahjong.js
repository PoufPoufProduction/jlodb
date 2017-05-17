(function($) {
    // Activity default options
    var defaults = {
        name        : "mahjong",                            // The activity name
        label       : "Mahjong",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        font        : 1,
        offset      : [0,0],
        debug       : true                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

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
        // End all timers
        quit: function($this) {
            var settings = helpers.settings($this);
            // if (settings.timerid) { clearTimeout(settings.timerid); }
        },
        format: function(_text) {
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
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

                // Send the onLoad callback
                if (settings.context.onload) { settings.context.onload($this); }

                $this.css("font-size", ($this.height()/12)+"px");
                $this.find("#board>div").css("font-size", settings.font+"em");
                settings.twidth = Math.floor($this.find(".target").width()*1.4*settings.font);
                $this.find(".target").css("font-size", settings.twidth+"px");

                // Locale handling

                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }
                
                // Optional devmode
                if (settings.dev) { $this.find("#devmode").show(); }
                
                switch (settings.tiles) {
                    case "all" :
                        for (var i=1; i<10; i++) for (var j=0; j<4; j++) {
                            settings.elts.push(helpers.tile($this, { value:"bam0"+i }));
                            settings.elts.push(helpers.tile($this, { value:"dot0"+i }));
                            settings.elts.push(helpers.tile($this, { value:"num0"+i }));
                        }
                        for (var j=0; j<4; j++) {
                            settings.elts.push(helpers.tile($this, { value:"east" }));
                            settings.elts.push(helpers.tile($this, { value:"west" }));
                            settings.elts.push(helpers.tile($this, { value:"south" }));
                            settings.elts.push(helpers.tile($this, { value:"north" }));
                            settings.elts.push(helpers.tile($this, { value:"summer", src:"summer0"+(j+1) }));
                            settings.elts.push(helpers.tile($this, { value:"winter", src:"winter0"+(j+1) }));
                            settings.elts.push(helpers.tile($this, { value:"red" }));
                            settings.elts.push(helpers.tile($this, { value:"green" }));
                            settings.elts.push(helpers.tile($this, { value:"gears" }));
                        }
                        
                    break;    
                }
                
                // Sort
                for (var i=0; i<50; i++) { settings.elts.sort(function() { return Math.random()>0.5; }); }
                
                // Fill
                var count=0;
                var missing=0;
                m=function(_x,_y,_z) { if (count<settings.elts.length) { settings.elts[count++].pos=[_x,_y,_z]; } else { missing++;} };
                if (settings.fill.cols) for (var i in settings.fill.cols) {
                    var c = settings.fill.cols[i];
                    if (typeof c.x == "number") { for (var y=c.top; y<=c.bottom; y++) { m(c.x, y, c.z); } } else
                    if (typeof c.y == "number") { for (var x=c.left; x<=c.right; x++) { m(x, c.y, c.z); } }
                }
                if (settings.fill.blocks) for (var i in settings.fill.blocks) {
                    var c = settings.fill.blocks[i];
                    for (var x=c.left; x<=c.right; x++) for (var y=c.top; y<=c.bottom; y++) { m(x, y, c.z); }
                }
                if (settings.fill.tiles) for (var i in settings.fill.tiles) {
                    var c = settings.fill.tiles[i];
                    m(c.x, c.y, c.z);
                }
                
                if (missing) { alert(missing+" tile(s) are missing"); }
                if (count<settings.elts.length) { alert((settings.elts.length-count)+" are not used"); }
               
                // Display tiles
                for (var i in settings.elts)
                {
                    var elt=settings.elts[i];
                    elt.zindex = Math.floor((20-elt.pos[0])+elt.pos[1]*2+100*elt.pos[2]);
                    elt.$html.css("top",(elt.pos[1]*2.5-elt.pos[2]*0.25+settings.offset[1])+"em")
                             .css("left",(elt.pos[0]*1.75+elt.pos[2]*0.25+settings.offset[0])+"em")
                             .css("z-index",elt.zindex);
                    $this.find("#board>div").append(elt.$html);
                }
                
                helpers.check($this);

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        isfree: function($this, elt) {
            var settings = helpers.settings($this);
            var up=true, right=true, left=true;
            for (var i in settings.elts) {
                var c = settings.elts[i];
                if (c.id!=elt.id && c.active) {
                    if (c.pos[2]==elt.pos[2] && Math.abs(c.pos[1]-elt.pos[1])<0.9 && Math.abs(c.pos[0]-elt.pos[0])<1.5) {
                        if (c.pos[0]<elt.pos[0]) { left=false; } else { right=false; }
                    }
                    else if (c.pos[2]==elt.pos[2]+1 && Math.abs(c.pos[1]-elt.pos[1])<0.9 && Math.abs(c.pos[0]-elt.pos[0])<0.9) {
                        up = false;
                    }
                }
            }
            return (up && (left||right));
        },
        check: function($this, elt) {
            var settings = helpers.settings($this);
            settings.hints={};
            for (var i in settings.elts) {
                var c = settings.elts[i];
                c.free = helpers.isfree($this,c);
                if (c.active && c.free) {
                    if (settings.hints[c.value]) { settings.hints[c.value].push(c); } else { settings.hints[c.value]=[c]; } }
            }
            var still=false;
            for (var i in settings.hints) { if (settings.hints[i].length>1) { still=true; } }
            
            if (!still) {
                settings.interactive=false;
                settings.score=0;
                $this.find("#wrong").show().parent().show();
                setTimeout(function() {helpers.end($this);}, 1000);
            }
        },
        tile: function($this,_data) {
            var settings = helpers.settings($this);
            var ret = {
                id          : "t"+(settings.count++),
                value       : _data.value,
                src         : _data.src?_data.src:_data.value,
                $html       : 0,
                free        : false,
                pos         : [0,0,0],
                zindex      : 0,
                active      : true
            };
            
            ret.$html=$("<div class='mjtile' id='"+ret.id+"'>"+
                            "<img src='res/img/asset/mahjong/"+ret.src+".svg' alt='' />"+
                            "<div class='hg'></div>"+
                        "</div>");
            ret.$html.bind("mousedown touchstart", function(_event) {
                if (settings.interactive) {
                    var elt=0;
                    for (var i in settings.elts) { if (settings.elts[i].id == $(this).attr("id")) { elt=settings.elts[i]; }}
                    
                    if (elt && elt.free) {
                        if (settings.selected==0) {
                            settings.selected=elt;
                            elt.$html.addClass("s");
                            $this.find("#tg1>div").addClass("running").parent()
                                .css("top",elt.$html.offset().top-settings.twidth/20)
                                .css("left",elt.$html.offset().left-settings.twidth/8)
                                .css("z-index", elt.zindex+1)
                                .show();
                        }
                        else {
                            if (settings.selected.id!=elt.id) {
                                
                                elt.$html.addClass("s");
                                $this.find("#tg2>div").addClass("running").parent()
                                    .css("top",elt.$html.offset().top-settings.twidth/20)
                                    .css("left",elt.$html.offset().left-settings.twidth/8)
                                    .css("z-index", elt.zindex+1)
                                    .show();
                                        
                                if (settings.selected.value==elt.value) {
                                    
                                    setTimeout(function() {
                                        settings.selected.active = false;
                                        elt.active = false;
                                        
                                        settings.selected.$html.animate({opacity:0}, 200, function() { $(this).detach(); });
                                        elt.$html.animate({opacity:0}, 200, function() { $(this).detach(); });
                                        helpers.clean($this);
                                        
                                        helpers.check($this);
                                        
                                    }, 1000);
                                    
                                    var finish=true;
                                    for (var i in settings.elts) { if (settings.elts[i].active) { finish=false; } }
                                    if (finish) {
                                        settings.interactive = false;
                                        setTimeout(function() { helpers.end($this); }, 1000); }
                                }
                                else {
                                    $this.find("#wrong").show().parent().show();
                                    settings.selected.active = false;
                                    setTimeout(function() {
                                        helpers.clean($this);
                                        $this.find("#wrong").hide().parent().hide();
                                        settings.selected.active = true; }, 1000); 
                                }
                            }
                            else { helpers.clean($this); }
                        }                        
                    }
                
                }
                _event.preventDefault();
            });
            
            return ret;
        },
        clean : function($this) {
            var settings = helpers.settings($this);
            $this.find(".mjtile.s").removeClass("s");
            settings.selected=0;
            $this.find(".target>div").removeClass("running").parent().hide();
        }
    };

    // The plugin
    $.fn.mahjong = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    score           : 5,
                    count           : 0,
                    elts            : [],
                    selected        : 0,
                    twidth          : 0,
                    hints           : {}
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
            devmode: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#devoutput textarea").val("Debug output").parent().show();
            },
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.quit($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            clean: function() { helpers.clean($(this)); },
            hint: function() {
                var $this = $(this) , settings = helpers.settings($this);
                for (var i in settings.hints) {
                    if (settings.hints[i].length>1) {
                        settings.hints[i][0].$html.addClass("h");
                        settings.hints[i][1].$html.addClass("h");
                        if (--settings.score<0) { settings.score=0; }
                        break;
                    }
                }
                $this.find("#mask").hide();
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mahjong plugin!'); }
    };
})(jQuery);

