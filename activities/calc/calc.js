(function($) {
    // Activity default options
    var defaults = {
        name        : "calc",                           // The activity name
        label       : "Calc",                           // The activity label
        template    : "template.html",                  // Activity's html template
        css         : "style.css",                      // Activity's css style sheet
        lang        : "en-US",                          // Current localization
        exercice    : [],                               // Exercice
        withbars    : true,                             // Add the bars A,B,C,D,... 1,2,3,4,...
        sp          : 0.1,                              // space between cells
        font        : 1,                                // font size of cell
        tabs        : ["calc","img"],                   // authorized tabs
        imgsize     : 2,                                // img tab font-size in em
        imgprefix   : "res/img/clipart/animal/",         // img prefix
        img         : ["zebra01","giraffe01","dog04","owl01","rhinoceros01","monkey01","rooster02","cow02","chicken02"],                               // img filename
        debug       : true                              // Debug mode
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
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                $("head").find("link").each(function() {
                    if ($(this).attr("href").indexOf("activities/"+settings.name+"/"+settings.css) != -1) { cssAlreadyLoaded = true; }
                });

                if(cssAlreadyLoaded) { helpers.loader.template($this); }
                else {
                    $("head").append("<link>");
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

                $this.css("font-size", Math.floor($this.height()/12)+"px");
                $this.find("#board>div").css("font-size", settings.font+"em");

                // handle tabs and panel
                if (settings.tabs.length>1) { for (var i in settings.tabs) { $this.find("#tab"+settings.tabs[i]).show(); } }
                $this.find("#pimg").css("font-size",settings.imgsize+"em");
                for (var i in settings.img) {
                    var html="<div id='img"+i+"' class='icon'";
                    html+='onmousedown=\'$(this).closest(".calc").calc("img",this);\' ';
                    html+='ontouchstart=\'$(this).closest(".calc").calc("img",this);event.preventDefault();\' ';
                    html+="><img src='"+settings.imgprefix+settings.img[i]+".svg'/></div>";
                    $this.find("#pimg").append(html);
                }
                $this.find("#panel").draggable({handle:"#phandle"}).css("position","absolute");

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                // Build the grid
                var $board = $this.find("#board>div");
                for (var i in settings.cells) {
                    var m = i.match(/c([0-9]*)x([0-9]*)/);
                    if (parseInt(m[1])>settings.size[0]) { settings.size[0] = parseInt(m[1]); }
                    if (parseInt(m[2])>settings.size[1]) { settings.size[1] = parseInt(m[2]); }
                }
                // the bars
                if (settings.withbars) {
                    var w       = helpers.value($this,0,0,"width",1.2);
                    var h       = helpers.value($this,0,0,"height",1.2);
                    var width   = w;
                    var height  = h;
                    $board.append('<div class="cell g" style="width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;"></div>');
                    for (var i=0; i<settings.size[0]; i++) {
                        w = helpers.value($this,(i+1),0,"width",2);
                        h = helpers.value($this,(i+1),0,"height",1.2);
                        $board.append('<div class="cell g" style="left:'+width+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;">'+
                            String.fromCharCode(65 + i)+'</div>');
                        width+=w;
                    }
                    
                    for (var j=0; j<settings.size[1]; j++) {
                        w = helpers.value($this,0,(j+1),"width",1.2);
                        h = helpers.value($this,0,(j+1),"height",1.2);
                        $board.append('<div class="cell g" style="top:'+height+'em;width:'+(w-settings.sp)+'em;height:'+(h-settings.sp)+'em;">'+
                            (j+1)+'</div>');
                        height+=h;
                    }
                }
                // Copy the grid initialization into settings.sheet[];
                settings.sheet=[];
                for (var j=0;j<settings.size[1];j++) {
                    var row = [];
                    for (var i=0;i<settings.size[0];i++) { row.push({}); }
                    settings.sheet.push(row);
                }

                // HIDE CELL
                if (settings.hide) for (var s in settings.hide) {
                    var w=1,h=1;
                    if (settings.hide[s].length>2) { w = settings.hide[s][2]; }
                    if (settings.hide[s].length>3) { h = settings.hide[s][3]; }
                    for (var i=0; i<w; i++) for (var j=0; j<h; j++) {
                        settings.sheet[j][i].type="hide";
                    }
                }

                var height= settings.withbars?helpers.value($this,0,0,"height",1.2):0;
                for (var j=0; j<settings.size[1]; j++) {
                    var width = settings.withbars?helpers.value($this,0,0,"width",1.2):0;
                    for (var i=0; i<settings.size[0]; i++) {
                        w = helpers.value($this,(i+1),(j+1),"width",2);
                        h = helpers.value($this,(i+1),(j+1),"height",1.2);

                        var type = helpers.value($this,(i+1),(j+1),"type","");

                        if (type.length) { settings.sheet[j][i].type = type; }
                        settings.sheet[j][i].value = helpers.value($this,(i+1),(j+1),"value","");

                        if (settings.sheet[j][i].type!="hide") {
                            var html = '<div class="cell '+settings.sheet[j][i].type+'" style="top:'+height+'em;left:'+width+'em;width:'+(w-settings.sp)+'em;'+
                                'height:'+(h-settings.sp)+'em;background-color:'+helpers.value($this,(i+1),(j+1),"background","white")+';'+
                                'color:'+helpers.value($this,(i+1),(j+1),"color","black")+';" ';
                            html+='id="c'+(i+1)+'x'+(j+1)+'" ';
                            if (settings.sheet[j][i].type!="fixed") {
                                html+='onmousedown=\'$(this).closest(".calc").calc("cell",this);\' ';
                                html+='ontouchstart=\'$(this).closest(".calc").calc("cell",this);event.preventDefault();\' ';
                            }
                            html+='>'+helpers.content($this,i,j)+'</div>';
                            $board.append(html);
                        }
                        width+=helpers.value($this,(i+1),0,"width",2);;
                    }
                    height+=helpers.value($this,0,(j+1),"height",1.2);
                }



                // Exercice
                if ($.isArray(settings.exercice)) {
                    $this.find("#exercice>div").html("");
                    for (var i in settings.exercice) { $this.find("#exercice>div").append(
                        "<p>"+(settings.exercice[i].length?helpers.format(settings.exercice[i]):"&nbsp;")+"</p>"); }
                } else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        content: function($this, _i, _j) {
            var settings = helpers.settings($this);
            var type = helpers.value($this,(_i+1),(_j+1),"type","");
            var ret = helpers.value($this,(_i+1),(_j+1),"value","");
            switch(type) {
                case "img" : ret = "<img src='"+settings.imgprefix+settings.img[ret]+".svg'/>";
                break;
            }
            return ret;
        },
        value: function($this, _i, _j, _attr, _default) {
            var settings = helpers.settings($this);
            var ret = _default;
            if (settings.all&&settings.all[_attr]) {
                ret = settings.all[_attr];
            }
            if (settings.cols&&settings.cols["col"+_i]&&settings.cols["col"+_i][_attr]) {
                ret = settings.cols["col"+_i][_attr];
            }
            if (settings.rows&&settings.rows["row"+_j]&&settings.rows["row"+_j][_attr]) {
                ret = settings.rows["row"+_j][_attr];
            }
            if (settings.cells&&settings.cells["c"+_i+"x"+_j]&&settings.cells["c"+_i+"x"+_j][_attr]) {
                ret = settings.cells["c"+_i+"x"+_j][_attr];
            }
            return ret;
        },
        // Handle the key input
        key: function($this, value, fromkeyboard) {
            var settings = helpers.settings($this);
            if (value==".") {
                if (settings.calculator.indexOf(".")==-1 && settings.calculator.length<5) {
                    settings.calculator+=(settings.calculator.length?"":"0")+"."; } }
            else if (value=="c") { settings.calculator=""; }
            else if (value=="-") {
                if (settings.calculator.length &&settings.calculator[0]=='-')
                     { settings.calculator = settings.calculator.substr(1); }
                else { settings.calculator = '-' + settings.calculator; }
            }
            else if (settings.calculator.length<6) {
                if (value=="0" && settings.calculator.length<2 && settings.calculator[0]=='0') {}
                else {
                    if (settings.calculator.length==1 && settings.calculator[0]=='0') { settings.calculator=""; }
                    settings.calculator+=value.toString();
                }
            }
            var value = settings.calculator;
            if (value.length==0 || (value.length==1&&value[0]=='-')) { value="0"; }
            $this.find("#screen").html(value);
        }
    };

    // The plugin
    $.fn.calc = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    size            : [0,0],
                    sheet           : [],
                    calculator      : "",
                    target          : 0
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
            next: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            cell: function(_cell) {
                var $this = $(this) , settings = helpers.settings($this);
                var $target = $this.find("#target");
                if (_cell) {
                    var target=$(_cell).attr("id").match(/c([0-9]*)x([0-9]*)/);
                    if (settings.target[0]!=target[0]) {
                        settings.target=target;
                        var c=settings.sheet[parseInt(settings.target[2]-1)][parseInt(settings.target[1]-1)];

                        if (settings.tabs.length) {
                            var tab=settings.tabs[0];
                            switch(c.type) {
                                case "img":
                                    tab ="img";
                                    $this.find("#pimg .icon").removeClass("s");
                                    $this.find("#pimg #img"+c.value).addClass("s");
                                    break;
                                default:
                                    helpers.key($this, 'c', false);
                                    break;
                            }
                            $this.find("#ppanel>div").hide();
                            $this.find("#ppanel #p"+tab).show();
                            $this.find("#pmenu>div").removeClass("s");
                            $this.find("#pmenu #tab"+tab).addClass("s");
                        }
                    }
                    $target.show();
                    $target.width($(_cell).width()).height($(_cell).height())
                           .offset({top:$(_cell).offset().top-4, left:$(_cell).offset().left-4});
                    $this.find("#panel").show();

                }
                else {
                    $target.hide();
                    $this.find("#panel").hide();
                }
            },
            tab: function(_tab, _elt) {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#pmenu>div").removeClass("s");
                $(_elt).addClass("s");
                $this.find("#ppanel>div").hide();
                $this.find("#"+_tab).show();
            },
            img: function(_elt) {
                $(this).find("#pimg .icon").removeClass("s");
                $(_elt).addClass("s");
            },
            key: function(value, _elt) {
                var $this = $(this);
                if (_elt) { $(_elt).addClass("touch");
                    setTimeout(function() { $(_elt).removeClass("touch"); }, 50);
                }
                helpers.key($(this), value, false);
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in calc plugin!'); }
    };
})(jQuery);

