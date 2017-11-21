(function($) {
    // Activity default options
    var defaults = {
        name        : "gonz",                                   // The activity name
        label       : "build your own avatar",                  // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        interactive : true,
        debug       : true                                      // Debug mode
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
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onquit($this,{status:"success", code:$this.find("#code").val()});
        },
        base64: {
            code: function(_val) {
                var r = 47;
                if (_val<26) { r = 65 +_val; }      else if (_val<52) { r = 97+(_val-26); } else
                if (_val<62) { r = 48 + (_val-52); } else if (_val<63) { r = 43; }
                return String.fromCharCode(r);
            },
            decode: function(_val) {
                var r = 63;
                _val = _val.charCodeAt(0);
                if (_val>=65 && _val<=90)   { r = _val - 65; } else
                if (_val>=97 && _val<=122)  { r = _val - 97 + 26; } else
                if (_val>=48 && _val<=57)   { r = _val - 48 + 52; } else
                if (_val==43) { r = 62; }
                return r;
            }
        },
        export: function($this) {
            var settings = helpers.settings($this);
            var ret = "AAAAAAAAAAAAAAAAAAAA";
            for (var i in settings.values) {
                if (typeof(settings.values[i].codeid)!="undefined") {
                    var offset = settings.values[i].codeid;
                    var val = $($("#"+i+">g>g",settings.svg.root()).get(settings.values[i].id)).attr("id") - 1;
                    ret = ret.substr(0,offset)+helpers.base64.code(val)+ret.substr(offset+1);
                }
                if (typeof(settings.values[i].codecss)!="undefined") {
                    var offset = settings.values[i].codecss[0];
                    var tmp = helpers.base64.decode(ret.charAt(offset));
                    var val = tmp;
                    if (settings.values[i].codecss[1]==0)   { val = settings.values[i].value*8+(tmp%8); }
                    else                                    { val = settings.values[i].value+Math.floor(tmp/8)*8; }
                    ret = ret.substr(0,offset)+helpers.base64.code(val)+ret.substr(offset+1);
                }
            }
            for (var i in settings.sliders) {
                if (typeof(settings.sliders[i].code)!="undefined") {
                    var offset = settings.sliders[i].code;
                    var val = settings.sliders[i].value;
                    ret = ret.substr(0,offset)+helpers.base64.code(val)+ret.substr(offset+1);
                }
            }
            return ret;
        },
        import: function($this, _val) {
            var settings = helpers.settings($this);
            if (_val) {
                while (_val.length<settings.exportlen) { _val+="A"; }

                for (var i in settings.values) {
                    if (typeof(settings.values[i].codeid)!="undefined") {
                        var tmp = helpers.base64.decode(_val.charAt(settings.values[i].codeid))+1, val=0;
                        $("#"+i+">g>g",settings.svg.root()).each( function(_index) { if ($(this).attr("id")==tmp) { val = _index; }});
                        settings.values[i].id = val;
                    }
                    if (typeof(settings.values[i].codecss)!="undefined") {
                        settings.values[i].value = (settings.values[i].codecss[1]==0)?
                            Math.floor(helpers.base64.decode(_val.charAt(settings.values[i].codecss[0]))/8):
                            helpers.base64.decode(_val.charAt(settings.values[i].codecss[0]))%8;
                    }
                }
                for (var i in settings.sliders) {
                    if (typeof(settings.sliders[i].code)!="undefined") {
                        settings.sliders[i].value = helpers.base64.decode(_val.charAt(settings.sliders[i].code));
                    }
                }
            }
        },
        getclass: function($this) {
            var settings = helpers.settings($this);
            return "skin"+(settings.values.head.value+1)+" mouth"+(settings.values.mouth.value+1)+
                   " bg"+(settings.values.bg.value+1)+" eye"+(settings.values.eye.value+1)+
                   " hair"+(settings.values.hair.value+1)+" clothes"+(settings.values.clothes.value+1);
        },
        slider: function($this, _elt) {
            var settings = helpers.settings($this);
            var $cursor = $this.find("#"+_elt+" .cursor");
            $cursor.css("left",Math.floor((settings.sliders[_elt].value/64)*($cursor.parent().width()-$cursor.width()))+"px");
        },
        sliders: function($this) {
            var settings = helpers.settings($this); for (var i in settings.sliders) { helpers.slider($this, i); }
        },
        // UPDATE THE SELECTED ITEMS AND CALL UPDATE METHOD
        refresh: function($this, _elt) {
            var settings = helpers.settings($this);
            $(settings.svg.root()).attr("class",helpers.getclass($this));

            for (var i in settings.values) {
                $this.find("#"+i+"tab .p2").html(1+settings.values[i].id);
                $($("#"+i+">g>g",settings.svg.root()).hide().get(settings.values[i].id)).show();
                if ((_elt==0)||(_elt==i)) { helpers.update[i]($this, settings.svg); }
            }

            $this.find("#code").val(helpers.export($this));
        },
        // UPDATE THE ITEM POSITION
        update: {
            bg: function($this, _svg) {},
            head: function($this, _svg) {},
            mouth : function($this, _svg) {
                var settings = helpers.settings($this);
                $("#mouth", _svg.root()).attr("transform","translate("+
                    (settings.sliders.mouthhoriz.min+(settings.sliders.mouthhoriz.value/64)*settings.sliders.mouthhoriz.range)+","+
                    (settings.sliders.mouthvert.min+(settings.sliders.mouthvert.value/64)*settings.sliders.mouthvert.range)+")");
                $("#mouth g", _svg.root()).attr("transform","rotate("+
                    (-(settings.sliders.mouthrotate.min+(settings.sliders.mouthrotate.value/64)*settings.sliders.mouthrotate.range))+
                    ",24,33)");
            },
            nose: function($this, _svg) {
                var settings = helpers.settings($this);
                $("#nose", _svg.root()).attr("transform","translate(0,"+
                    (settings.sliders.nosevert.min+(settings.sliders.nosevert.value/64)*settings.sliders.nosevert.range)+")");
            },
            ear: function($this, _svg) {},
            eyebrow: function($this, _svg) {
                var settings = helpers.settings($this);
                $("#eyebrow", _svg.root()).attr("transform","translate(0,"+
                    (settings.sliders.eyebrowvert.min+(settings.sliders.eyebrowvert.value/64)*settings.sliders.eyebrowvert.range)+")");
                $("#eyebrow .left", _svg.root()).attr("transform","rotate("+
                    (-(settings.sliders.eyebrowrotate.min+(settings.sliders.eyebrowrotate.value/64)*settings.sliders.eyebrowrotate.range))+",18,21)");
            },
            eye: function($this, _svg) {
                var settings = helpers.settings($this);
                $("#eye", _svg.root()).attr("transform","translate(0,"+
                    (settings.sliders.eyevert.min+(settings.sliders.eyevert.value/64)*settings.sliders.eyevert.range)+")");
                $("#eye .left", _svg.root()).attr("transform","translate("+
                    (-(settings.sliders.eyehoriz.min+(settings.sliders.eyehoriz.value/64)*settings.sliders.eyehoriz.range))+
                    ",0)");
            },
            hair: function($this, _svg) {},
            hairb: function($this, _svg) {},
            clothes: function($this, _svg) {}
        },
        // Handle the elements sizes and show the activity
        build: function($this) {
            var settings = helpers.settings($this);

            // Send the onLoad callback
            if (settings.context.onload) { settings.context.onload($this,false); }

            // Resize the template
            $this.css("font-size", Math.floor($this.height()/12.7)+"px");

            $this.find("#code").keyup(function() {
                helpers.import($this, $(this).val()); helpers.refresh($this,0); helpers.sliders($this); });

            helpers.loadsvg($this);
        },
        loadsvg: function($this) {
            var settings = helpers.settings($this);
            $this.find("#screen").svg();
            settings.svg = $this.find("#screen").svg('get');
            settings.svg.load(
                settings.name+"/template.svg?debug="+Math.floor(Math.random()*9999),
                { addTo: true, changeSize: true, onLoad:function() {

                // handle the sliders
                $this.find(".slider .cursor").draggable({ axis:"x", containment:"parent",
                drag:function(){
                    var value =
                        Math.round(64*($(this).offset().left-$(this).parent().offset().left)/($(this).parent().width()-$(this).width()));
                    if (value<0) { value=0;} else if (value>63) { value=63;}
                    settings.sliders[$(this).parent().parent().attr("id")].value = value;
                    helpers.refresh($this, settings.sliders[$(this).parent().parent().attr("id")].id);
                }});

                helpers.sliders($this);

                if (settings.code) { helpers.import($this, settings.code); }
                helpers.refresh($this,0);

            }});
        },
        // Load the different elements of the activity
        load: function($this) {
            var settings = helpers.settings($this);
            var debug = "";
            if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

            // Send the onLoad callback
            if (settings.context.onLoad) { settings.context.onLoad(true); }

            if (!settings.interactive) {
                 settings.svg = $("<div></div>").svg().svg('get');
                 settings.svg.load(
                    settings.name+"/template.svg?debug="+Math.floor(Math.random()*9999),
                    { addTo: true, changeSize: true, onLoad:function() {
                        if (settings.code) { helpers.import($this, settings.code); }
                        helpers.image($this, $this);
                    }
                });
            }
            else {
                // Load the template
                var templatepath = settings.name+"/"+settings.template+debug;
                $this.load( templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onquit($this,{status:'error', statusText:templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else {
                        var cssAlreadyLoaded = false;
                        $("head").find("link").each(function() {
                            if ($(this).attr("href").indexOf(settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                        });
                        if(cssAlreadyLoaded) {
                            helpers.build($this);
                        }
                        else {
                            // Load the css
                            $("head").append("<link>");
                            var css = $("head").children(":last");
                            var csspath = settings.name+"/"+settings.css+debug;
                            css.attr({ rel:  "stylesheet", type: "text/css", href: csspath }).ready(function() {
                                helpers.build($this);
                            });
                        }
                    }
                });
            }
        },
        image: function($this, $elt) {
            var settings = helpers.settings($this);
                $elt.html("").svg();
                settings.exportsvg = $elt.svg('get');
                settings.exportsvg.load(
                    settings.name+"/template.svg?debug="+Math.floor(Math.random()*10000),
                    { addTo: true, changeSize: true, onLoad:function() {
                        for (var i in settings.values) {
                            helpers.update[i]($this, settings.exportsvg);
                            $("#"+i+">g>g",settings.exportsvg.root()).each(function(_index) {
                                if (_index!=settings.values[i].id) { settings.exportsvg.remove($(this)); }
                                else { $(this).css("display","inline"); }
                            });
                        }

                        var text = '<?xml version="1.0" ?>'+settings.exportsvg.toSVG(settings.exportsvg.root()).
                            replace(/<svg/,'<svg class="'+helpers.getclass($this)+'"');


                        // MISC FIXES
                        var defpos = text.search("/defs");
                        if (text.search(" xmlns")==-1 || text.search(" xmlns")>defpos) {
                            text = text.replace(/<svg/,'<svg xmlns="http://www.w3.org/2000/svg"');
                        }
                        if (text.search("xmlns:svg")==-1 || text.search("xmlns:svg")>defpos) {
                            text = text.replace(/<svg/,'<svg xmlns:svg="http://www.w3.org/2000/svg"');
                        }
                        if (text.search("xmlns:xlink")==-1 || text.search("xmlns:xlink")>defpos) {
                            text = text.replace(/<svg/,'<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
                        }
                        if (text.search("xlink:href")==-1)  { text = text.replace(/href/,'xlink:href'); }

                        $elt.svg("destroy");
                        $elt.html("<div onclick='$(this).closest(\".gonz\").gonz(\"callback\");' "+
                                  "ontouchstart='$(this).closest(\".gonz\").gonz(\"callback\");event.preventDefault();' >"+
                                  "<img title='avatar' src='data:image/svg+xml;charset=utf-8,"+encodeURIComponent(text)+"'/>"+
                                  "</div>");
                        $this.find("#export").show();
                }});
        }
    };

    // The plugin
    $.fn.gonz = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    svg             : 0,
                    exportsvg       : 0,
                    values          : {
                        bg          : { id:0, value: 0, codeid:0,   codecss:[1,0]   },
                        head        : { id:0, value: 1, codeid:2,   codecss:[1,1]   },
                        mouth       : { id:0, value: 0, codeid:3,   codecss:[4,0]   },
                        nose        : { id:0,           codeid:8                    },
                        ear         : { id:0,           codeid:10                   },
                        eye         : { id:0, value: 0, codeid:11,  codecss:[4,1]   },
                        eyebrow     : { id:0,           codeid:14,                  },
                        hair        : { id:0, value: 0, codeid:18,  codecss:[17,0]  },
                        hairb       : { id:0,           codeid:19                   },
                        clothes     : { id:0, value: 0, codeid:20,  codecss:[17,1]  }
                    },
                    sliders: {
                        mouthvert       : { id:"mouth",     min: -2,    range: 4,   value: 32,  init: 32,   code:5  },
                        mouthhoriz      : { id:"mouth",     min: -3,    range: 6,   value: 32,  init: 32,   code:6  },
                        mouthrotate     : { id:"mouth",     min: -10,   range: 20,  value: 32,  init: 32,   code:7  },
                        nosevert        : { id:"nose",      min: -1,    range: 3,   value: 25,  init: 25,   code:9  },
                        eyevert         : { id:"eye",       min: -2,    range: 4,   value: 32,  init: 32,   code:12 },
                        eyehoriz        : { id:"eye",       min: -2,    range: 3,   value: 42,  init: 42,   code:13 },
                        eyebrowvert     : { id:"eyebrow",   min: -2,    range: 4,   value: 32,  init: 32,   code:15 },
                        eyebrowrotate   : { id:"eyebrow",   min: -20,   range: 40,  value: 32,  init: 32,   code:16 }
                    },
                    exportlen : 21
                };

                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");


                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.load($this);
                    }
                });
            },
            values: function(_elt, _value) {
                var $this = $(this) , settings = helpers.settings($this);
                settings.values[_elt].value=_value;
                helpers.refresh($this);
            },
            updateid: function(_elt, _up) {
                var $this = $(this) , settings = helpers.settings($this);
                if (_up) {
                    settings.values[_elt].id=(settings.values[_elt].id+1)%$("#"+_elt+">g>g",settings.svg.root()).length;
                }
                else {
                    if (--settings.values[_elt].id<0) { settings.values[_elt].id = $("#"+_elt+">g>g",settings.svg.root()).length-1; }
                }
                helpers.refresh($this);
            },
            slider: function(_elt) {
                var $this = $(this) , settings = helpers.settings($this);
                settings.sliders[_elt].value=settings.sliders[_elt].init;
                helpers.slider($this, _elt);
                helpers.update[settings.sliders[_elt].id]($this, settings.svg);
            },
            export: function() {  helpers.image($(this), $(this).find("#exportsvg")); },
            import: function(_code) {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.import($this, _code);
                if (!settings.interactive) { helpers.image($this, $this); }
                else                       { helpers.refresh($this,0); helpers.sliders($this); }
            },
            valid: function() { helpers.end($(this)); },
            callback: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.context.onclick) { settings.context.onclick($this); }
            },
            tab: function(_elt, _value) {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find(".tab").hide();
                $this.find(_value).show();
                $this.find(".tabs .icon").removeClass("s");
                $(_elt).find(".icon").addClass('s');
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in memory-number plugin!'); }
    };
})(jQuery);

