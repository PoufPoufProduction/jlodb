(function($) {
    // Activity default options
    var defaults = {
        name        : "slide",                                  // The activity name
        label       : "Slide",                                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        exercice    : [],                                       // Exercice
        draw        : false,                                    // Draw mode
        debug       : false                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[small\\\]([^\\\[]+)\\\[/small\\\]",    "<span style='font-size:0.8em;'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>"
    ];

    var pages = {
        title   : {
            content:"<div id='title' class='title'>title</div><div id='subtitle' class='subtitle'></div>"
        },
        list    : {
            content:"<div class='text' id='header'></div><ul><li><div id='elt1'></div></li><li><div id='elt2'></div></li><li><div id='elt3'></div></li><li><div id='elt4'></div></li></ul>",
            process: function($page, _values, _state) {
                var n = 0;
                $page.find("li").each(function() {
                    if ($(this).text().length==0) { $(this).hide(); } else { $(this).addClass((n>=_state?"hide ":"")+"s"+(n++)); } });
                return {nb:n};
            }
        },
        text    : {
            content:"<div class='text' id='text1'></div><div class='text' id='text2'></div><div class='text' id='text3'></div>",
            process: function($page, _values, _state) {
                var n = 0;
                $page.find("div.text").each(function(_index) {
                    if (_index) {
                        if ($(this).text().length==0) { $(this).hide(); } else { $(this).addClass((n>=_state?"hide ":"")+"s"+(n++)); }
                    }
                });
                return {nb:n};
            }
        },
        img     : {
            content:"<div id='img'></div><div id='legend' class='legend'></div>",
            process: function($page, _values, _state) {
                if (_values.url) {
                    $page.find("#img").html("<img src='"+_values.url+"'/>");
                }
            }
        },
        exercice : {
            content:"<div id='activity'></div>",
            process: function($page, _values, _state) {
                $page.parent().addClass("nosplash");
                $page.jlodb({ isvisible:true,
                    onfinish:   function($this)       { $page.show().parent().slide("next"); },
                    onscore:    function($this, _ret) { }
                }, {id:_values.id } );
                return { blocked: true };
            }
        }
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
            $this.unbind("mouseup mousedown mousemove mouseout touchstart touchmove touchend touchleave");
        },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            helpers.unbind($this);
            settings.context.onquit($this,{'status':'success','score':settings.score});
        },
        format: function(_text) {
            for (var j=0; j<2; j++) for (var i=0; i<regExp.length/2; i++) {
                var vReg = new RegExp(regExp[i*2],"g");
                _text = _text.replace(vReg,regExp[i*2+1]);
            }
            return _text;
        },
        build: function($this) {
            var settings = helpers.settings($this);

            $this.html("<div id='slpage'></div><div id='slcontrol'><img src='mods/tibibu/res/img/about.svg'/></div>"+
                       "<div id='slmenu'><div><div class='icon' id='slback'><img src='res/img/generic/left.svg'/></div>"+
                       "<div id='sllist'></div><div class='icon' id='slforward'><img src='res/img/generic/right.svg'/></div>"+
                       "<div class='icon' id='slcomment'><img src='mods/tibibu/res/img/edit.svg'/></div>"+
                       "</div></div>"+
                       "<div id='sldraw'></div>");

            if (settings.draw) {
                $this.find("#slcomment").bind("mousedown touchstart", function(_event) {
                    if ($(this).hasClass("s"))  { $(this).removeClass("s"); $this.find("#sldraw").hide(); }
                    else                        { $(this).addClass("s"); $this.find("#sldraw").show(); }
                    _event.preventDefault();
                    _event.stopPropagation();
                });
                $this.addClass("nosplash");
                $this.find("#sldraw").draw({ background:0, stroke:"red", context:{ onquit:function(){} }});
            }
            else { $this.find("#slcomment").hide(); }

            $this.find("#slback").bind("mousedown touchstart", function(_event) {
                if (settings.page>0) { settings.page--; settings.event = [0,0]; helpers.run($this); }
                _event.preventDefault();
                _event.stopPropagation();
            });
            $this.find("#slforward").bind("mousedown touchstart", function(_event) {
                if (settings.page<settings.content.length-1) { settings.page++; settings.event = [0,0]; helpers.run($this); }
                _event.preventDefault();
                _event.stopPropagation();
            });

            $this.find("#slcontrol").bind("mousedown touchstart", function(_event) {
                $this.find("#slmenu").show();
                _event.preventDefault();
                _event.stopPropagation();
            });

            $this.find("#slmenu").bind("mousedown touchstart", function(_event) {
                $this.find("#slmenu").hide();
                _event.preventDefault();
                _event.stopPropagation();
            });

            $this.find("#slpage").bind("mousedown touchstart", function(_event) {
                if (!settings.blocked) {
                    if (settings.event[0]<settings.event[1]) {
                        $(this).find(".s"+(settings.event[0]++)).css("visibility","visible");
                    }
                    else helpers.next($this);
                }
                _event.preventDefault();
                _event.stopPropagation();
            });

            // Send the onLoad callback
            if (settings.context.onload) { settings.context.onload($this); }
        },
        next: function($this) {
            var settings = helpers.settings($this);
            if (!settings.nonext) { settings.page++; settings.event = [0,0]; helpers.run($this); }
        },
        run: function($this) {
            var settings = helpers.settings($this);

            $this.find("#sllist").html("");
            if (settings.draw) { $this.find("#sldraw").draw("clean"); }
            for (var i=0; i<settings.content.length; i++) {
                var $elt = $("<div class='icon"+(i==settings.page?" s":"")+"'><div>"+(i+1)+"</div></div>");
                $elt.bind("mousedown touchstart", function(_event) {
                    _event.preventDefault();
                    _event.stopPropagation();
                    settings.page=parseInt($(this).text())-1; settings.event = [0,0]; helpers.run($this);
                });
                $this.find("#sllist").append($elt);
            }

            var page = settings.content[settings.page];

            if (page) {
                $this.find("#slpage").html(pages[page.type].content);
                for (var i in page) { $this.find("#slpage #"+i).html(helpers.format(page[i])); }
                settings.blocked = false;

                if (pages[page.type].process) {
                    var ret = pages[page.type].process($this.find("#slpage"), page, settings.event[0]);
                    if (ret && ret.nb)      { settings.event[1] = ret.nb; }
                    if (ret && ret.blocked) { settings.blocked  = true; }
                    
                }
            }
            else { $this.find("#slpage").html(""); helpers.end($this); }


        }
    };

    // The plugin
    $.fn.slide = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    page : 0,
                    event: [0,0],
                    blocked: false,
                    content: []
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
                        helpers.build($this);
                    }
                });
            },
            update: function(_value, _args) {
                var $this = $(this) , settings = helpers.settings($this);

                // $this.css("font-size", Math.floor($this.height()/12)+"px");

                if (!_args || !_args.keep) {
                    settings.page    = 0;
                    settings.event   = [0,0];
                }
                settings.nonext = _args && _args.nonext;
                settings.content = [];
                $this.find("#slmenu").hide();

                var regExp = new RegExp("{{([^}^}]+)}}","g");
                var match = regExp.exec(_value);
                while(match) {
                    var elt = 0;
                    var a = match[1].split('|');
                    if (a.length) {
                        elt= { type:a[0] };
                        for (var i=1; i<a.length; i++) {
                            var b = a[i].split('=');
                            if (b.length==2) { elt[b[0]]=b[1]; }
                        }
                    }
                    settings.content.push(elt);
                    match = regExp.exec(_value);
                }
                helpers.run($this);
            },
            next: function() { helpers.next($(this)); },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in slide plugin!'); }
    };
})(jQuery);

