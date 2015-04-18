(function($) {
    // Activity default options
    var defaults = {
        name        : "mathematics",                            // The activity name
        label       : "Mathematics",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        clean       : true,                                     // Clean board between exercices
        font        : 1,                                        // Exerice font
        err         : 1,                                        // Error weight
        onlyone     : false,                                    // Only one response possible : no commutativity
        number      : 1,                                        // number of exercices
        debug       : false                                     // Debug mode
    };

    var op = {
        abs:    { label:"abs",      c:1, m:"<mo>|</mo>c0<mo>|</mo>",                                t:"abs(c0)" },
        cos:    { label:"cos",      c:1, m:"<mi>cos</mi><mo>&#x2061;</mo><mo>(</mo>c0<mo>)</mo>",   t:"cos(c0)" },
        div:    { label:"/",        c:2, m:"<mfrac><mrow>c0</mrow><mrow>c1</mrow></mfrac>",
            needbracket:function(_node) {
                ret = [false, false];
                for (var i=0; i<2; i++)
                if (_node.children&&_node.children[i]&&_node.children[i].type=="op")
                    if (_node.children[i].value=="plus"||_node.children[i].value=="minus" ||
                        _node.children[i].value=="mult"||_node.children[i].value=="div")
                        ret[i]=true;
                return ret;
            },
            t:function(_node) {
                var bra = op.div.needbracket(_node);
                return (bra[0]?"(c0)":"c0")+"/"+(bra[1]?"(c1)":"c1");
            }
        },
        eq :    { label:"=",        c:2, m:"c0<mo>=</mo>c1",                                        t:["c0=c1","c1=c0"] },
        integ:  { label:"&int;x",   c:3, m:"<msubsup><mo>&int;</mo>c0c1</msubsup><mrow>c2<mo>&InvisibleTimes;</mo>" +
                                           "<mrow><mi>d</mi><mi>x</mi></mrow>", t:"int(c0,c1,c2)" },
        minus:  { label:"-",        c:2, m:"c0<mo>-</mo>c1",
            needbracket:function(_node) {
                ret = [false, false];
                for (var i=0; i<2; i++)
                if (_node.children&&_node.children[i]&&_node.children[i].type=="op")
                    if (_node.children[i].value=="plus"||_node.children[i].value=="minus")
                        ret[i]=true;
                return ret;
            },
            m:function(_node) {
                var ret=["c0","c1","<mo>-</mo>"];
                var bra=op.mult.needbracket(_node);
                for (var i=0; i<2; i++) if (bra[i]) { ret[i] = "<mo>(</mo>c"+i+"<mo>)</mo>"; }
                return ret[0]+ret[2]+ret[1];
            },
            t:function(_node) {
                var bra=op.mult.needbracket(_node);
                var val=[bra[0]?"(c0)":"c0", bra[1]?"(c1)":"c1"];
                return [ val[0]+"-"+val[1] ];
            }
        },
        mult:   { label:"*",        c:2,
            needbracket:function(_node) {
                ret = [false, false];
                for (var i=0; i<2; i++)
                if (_node.children&&_node.children[i]&&_node.children[i].type=="op")
                    if (_node.children[i].value=="plus"||_node.children[i].value=="minus")
                        ret[i]=true;
                return ret;
            },
            m:function(_node) {
                var ret=["c0","c1","<mo>*</mo>"];
                var bra=op.mult.needbracket(_node);
                for (var i=0; i<2; i++) if (bra[i]) { ret[i] = "<mo>(</mo>c"+i+"<mo>)</mo>"; }
                return ret[0]+ret[2]+ret[1];
            },
            t:function(_node) {
                var bra=op.mult.needbracket(_node);
                var val=[bra[0]?"(c0)":"c0", bra[1]?"(c1)":"c1"];
                return [ val[0]+"*"+val[1], val[1]+"*"+val[0] ];
            }
        },
        plus:   { label:"+",        c:2, m:"c0<mo>+</mo>c1", t:["c0+c1","c1+c0"] },
        pow:    { label:"^",        c:2,
            needbracket:function(_node) {
                ret = false;
                if (_node.children&&_node.children[0]&&_node.children[0].type=="op")
                    if (_node.children[0].value=="plus"||_node.children[0].value=="mult"||
                        _node.children[0].value=="div"||_node.children[0].value=="minus")
                        ret = true;
                return ret;
            },
            m:function(_node) {
                return (op.pow.needbracket(_node)) ? "<msup><mrow><mo>(</mo>c0<mo>)</mo></mrow><mrow>c1</mrow></msup>" :
                                                     "<msup><mrow>c0</mrow><mrow>c1</mrow></msup>";
            },
            t:function(_node) {
                var ret = ["pow(c0,c1)"];
                if (_node.children&&_node.children[1]&&_node.children[1].value=="2"){
                    ret.push(op.pow.needbracket(_node)?"(c0)*(c0)":"c0*c0");
                }
                return ret;
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

                // Build panel droppable
                $this.find("#f001").droppable({accept:".a.op",
                    drop:function(event, ui) {
                        $this.find("#f001").html("");
                        var $elt = $(ui.draggable).clone().removeClass("move");
                        settings.root=helpers.node.f001.create($this,true,$elt);
                        helpers.node.f001.display($this);
                        helpers.node.mathml($this);
                    }
                });

                if (settings.data) { settings.number = settings.data.length; }
                if (settings.gen) {
                    settings.data = [];
                    for (var i=0; i<settings.number; i++) { settings.data.push(eval('('+settings.gen+')')()); }
                }

                // Locale handling
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) {
                    if ($.isArray(value)) {  for (var i in value) { $this.find("#"+id).append("<p>"+value[i]+"</p>"); } }
                    else { $this.find("#"+id).html(value); }
                }); }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
                helpers.build($this);
            }
        },
        node : {
            create: function(_id) {
                return {    id:         _id,
                            type:       "",
                            value:      "",
                            children:   0,
                            width:      0,
                            left:       0,
                            find:       function(_idt) {
                                if (this.id==_idt)      { return this; }
                                else if (this.children) {
                                    var ret = 0;
                                    for (var i in this.children) { ret = ret || this.children[i].find(_idt); }
                                    return ret;
                                }
                                else                    { return 0; }
                            },
                            update:     function() {
                                for (var i in this.children) { this.children[i].update(); }
                                this.width = 0;
                                this.left  = 0;
                                if (this.children) {
                                    for (var i in this.children) {
                                        this.left += this.children[i].left + this.width;
                                        this.width += this.children[i].width;
                                    }
                                    this.left = this.left/this.children.length;
                                }
                                else { this.width = 1; }
                            },
                            label:      function() {
                                var ret = this.value;
                                if (this.type=="op" && op[this.value]) { ret = op[this.value].label; }
                                return ret;
                            }
                };
            },
            remove: function(_node) {
                if (_node.$html) { _node.$html.detach(); }
                for (var i in _node.children) { helpers.node.remove(_node.children[i]); }
            },
            f001: {
                create: function($this,_root,$elt) {
                    var settings = helpers.settings($this);
                    var data = (settings.data?settings.data[settings.dataid]:settings);
                    var values = (settings.data&&settings.data[settings.dataid].values?
                                    settings.data[settings.dataid].values:settings.values);
                    var ret = helpers.node.create("n"+(settings.nodecounter++));

                    ret.$html = $("<div class='d' id='"+ret.id+"'></div>");
                    ret.attach = false;
                    ret.$html.droppable({accept:_root?".a.op":".a", greedy:true,
                        over: function(event, ui) { $(this).addClass("over"); },
                        out: function(event, ui) { $(this).removeClass("over"); },
                        drop:function(event, ui) {
                            $this.find(".over").removeClass("over");
                            var $elt = $(ui.draggable).clone().removeClass("move");
                            var v = values[parseInt($elt.attr("id"))];
                            var node = settings.root.find($(this).attr("id"));
                            if (v.value!="eq" || node==settings.root) {
                                node.$html.html($elt);
                                for (var i in node.children) { helpers.node.remove(node.children[i]); }
                                node.value = v.value;
                                node.type = v.type;

                                if (v.type=="op" && op[v.value]) {
                                    node.children=[];
                                    for (var i=0; i<op[v.value].c; i++) { 
                                        node.children.push(helpers.node.f001.create($this,false,0));
                                    }
                                }
                                else { node.children=0; }
                                helpers.node.f001.display($this);
                                helpers.node.mathml($this);
                            }
                        }
                    });
                    if ($elt) {
                        ret.$html.html($elt);
                        var v = values[parseInt($elt.attr("id"))];
                        ret.value = v.value;
                        ret.type = v.type;
                        ret.children=[];
                        if (op[ret.value]) {
                            for (var i=0; i<op[ret.value].c; i++) {
                                ret.children.push(helpers.node.f001.create($this,false,0));
                            }
                        }
                    }
                    return ret;
                },
                display: function($this,_node,_level,_left) {
                    var settings = helpers.settings($this);
                    if (!_node)         { $this.find("#f001").find(".l").detach();_node=settings.root; _level=0; _left=0; _node.update(); }
                    var level = _level;
                    var width = 0;
                    for (var i in _node.children) {
                        level=Math.max(level, helpers.node.f001.display($this,_node.children[i],_level+1,_left+width));
                        width+=_node.children[i].width;
                    }
                    if (!_node.attach) {
                        $this.find("#f001").append(_node.$html); _node.attach=true;
                    }
                    var links="";
                    var offset = 0;
                    if (_node.children) {
                        links+="<div class='l l0' style='top:"+(_level*1.75+1.3)+"em;"+
                               "left:"+((_left+_node.left)*1.5+0.7)+"em;width:0em;'></div>";
                    }
                    for (var i in _node.children) {
                        var x = (_node.children[i].left+offset)<_node.left?_node.children[i].left+offset:_node.left;
                        var w = Math.abs(_node.children[i].left+offset-_node.left);
                        var c = "";
                        if (_node.children.length==1 || w==0) { c = " l1"; } else
                        if ((_node.children[i].left+offset)>_node.left) { c = " l2"; }
                        links+="<div class='l"+c+"' style='top:"+(_level*1.75+1.5)+"em;"+
                               "left:"+((_left+x)*1.5+0.7)+"em;width:"+(w*1.5)+"em;'></div>";
                        offset+=_node.children[i].width;
                    }
                    if (links) { $this.find("#f001").append(links); }
                    _node.$html.css("top",(_level*1.75)+"em").css("left",((_left+_node.left)*1.5)+"em");

                    if (_level==0) {
                        var ratio = Math.min(1,3.5/level,5.5/_node.width);
                        $this.find("#f001").css("font-size",ratio+"em");
                        var mx = ($this.find("#f001").width()-_node.$html.width()*_node.width*1.25)/2;
                        var my = ($this.find("#f001").height()-_node.$html.height()*(level+1)*1.45)/2;
                        $this.find("#f001").css("left",mx+"px").css("top",my+"px");
                    }
                    return level;
                }
            },
            mathml: function($this, _node) {
                var settings = helpers.settings($this), ret;
                if (!_node) { _node=settings.root; }
                if (_node.type=="op") {
                    ret = op[_node.value].m;
                    if (typeof(ret)=="function") { ret = ret(_node); }
                    for (var i in _node.children) {
                        var regexp = new RegExp("c"+i, "g");
                        ret = ret.replace(regexp, helpers.node.mathml($this,_node.children[i]));
                    }
                }
                else { ret = "<mn>"+_node.value+"</mn>"; }

                if (_node==settings.root) {
                    $this.find("#screen").html("<div><math><mrow>"+ret+"</mrow></math></div>");
                    if (settings.mathmlup.timerid) { clearTimeout(settings.mathmlup.timerid); }
                    settings.mathmlup.timerid = setTimeout(function(){ helpers.node.mathmlup($this); }, 10 );
                }

                return ret;
            },
            text: function($this, _node) {
                var settings = helpers.settings($this), ret=[];
                if (!_node) { _node=settings.root; }
                if (_node.type=="op") {

                    var val = op[_node.value].t, children = [], nb = 1;
                    if (typeof(val)=="function") { val = val(_node); }
                    if (typeof(val)=="string")   { val = [val]; }

                    for (var i in _node.children) {
                        var c = helpers.node.text($this,_node.children[i]);
                        nb = nb*c.length;
                        children.push(c);
                    }

                    for (var j in val) for (var i=0; i<nb; i++) {
                        var v = val[j];
                        var nbc = i;
                        for (var k in _node.children) {
                            var regexp = new RegExp("c"+k, "g");
                            v = v.replace(regexp, children[k][nbc%children[k].length]);
                            nbc = Math.floor(nbc/children[k].length);
                        }
                        ret.push(v);
                    }
                }
                else { ret = [_node.value?_node.value:""]; }
                return ret;
            },
            mathmlup: function($this) {
                var settings = helpers.settings($this);
                settings.mathmlup.timerid = 0;
                var ratio = $this.find("#screen>div").height()/$this.find("#screen").height();
                if (ratio<0.8 || ratio>1) {
                    settings.mathmlup.ratio = settings.mathmlup.ratio*(ratio<0.8?1.1:0.9);
                    $this.find("#screen>div").css("font-size",settings.mathmlup.ratio+"em");
                    settings.mathmlup.timerid = setTimeout(function(){ helpers.node.mathmlup($this); }, 10 );
                }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
            var data = (settings.data?settings.data[settings.dataid]:settings);
            var values = (settings.data&&settings.data[settings.dataid].values?settings.data[settings.dataid].values:settings.values);
            var exercice = (settings.data?settings.exercice[settings.dataid%settings.exercice.length]:settings.exercice);

            if (settings.clean) { $this.find("#f001").html(""); $this.find("#screen").html(""); }

            if (data.figure) {
                if (data.figure.url)        { $this.find("#figure").html("<img src='"+data.figure.url+"'/>"); } else
                if (data.figure.content)    { $this.find("#figure").html(data.figure.content); }
            }

            if ($.isArray(exercice)) {
                var html=""; for (var i in exercice) {
                    html+="<div style='font-size:"+settings.font+"em;'>"+(exercice[i].length?exercice[i]:"&nbsp;")+"</div>"; }
                $this.find("#exercice>div").html(html);
            }
            else { $this.find("#exercice>div").html(exercice); }

            $this.find("#inventory .z").each(function(_index) {
                var html="";
                if (values && _index<values.length) {
                    values[_index]= $.extend({}, helpers.node.create(_index), values[_index]);
                    html="<div class='a "+values[_index].type+"' id='"+values[_index].id+"'>"+
                            "<div class='label'>"+values[_index].label()+"</div></div>";
                }
                $(this).html(html);
            });
            $this.find("#inventory .a").draggable({containment:$this, helper:"clone", appendTo:$this, /* revert:true, */
                start:function( event, ui) { $(this).addClass("move");},
                stop: function( event, ui) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                    var x           = event.clientX-$this.offset().left;
                    var y           = event.clientY-$this.offset().top;
                    var $old        = $this.find("#touch01>div").detach();
                    var $new        = $old.clone();
                    $this.find("#touch01").css("left",Math.floor(x - $this.find("#touch01").width()/2)+"px")
                                          .css("top",Math.floor(y - $this.find("#touch01").height()/2)+"px")
                                          .append($new.addClass("running")).show();
                    setTimeout(function(){$this.find("#touch01>div").removeClass("running").parent().hide(); },800);

                    $(this).removeClass("move"); } });
        },
        levenshtein: function (a,b) {
                var n = a.length, m = b.length, matrice = [];
                for(var i=-1; i < n; i++) { matrice[i]=[]; matrice[i][-1]=i+1; }
                for(var j=-1; j < m; j++) { matrice[-1][j]=j+1; }
                for(var i=0; i < n; i++) {
                        for(var j=0; j < m; j++) {
                                var cout = (a.charAt(i) == b.charAt(j))? 0 : 1;
                                matrice[i][j] = Math.min(1+matrice[i][j-1], 1+matrice[i-1][j], cout+matrice[i-1][j-1]);
                        }
                }
                return matrice[n-1][m-1];
        }
    };

    // The plugin
    $.fn.mathematics = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    dataid          : 0,                        // data index
                    nodecounter     : 0,                        // node counter
                    root            : {},                       // build tree
                    wrongs          : 0,                        // wrongs value
                    mathmlup        : { ratio: 1, timerid: 0 }  // ratio of the mathml output
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
                $this.find("#splash").hide();
                settings.interactive = true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.context.onquit($this,{'status':'abort'});
            },
            valid: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive) {
                    settings.interactive = false;
                    var result = (settings.data?settings.data[settings.dataid].result:settings.result);
                    if (!$.isArray(result)) { result = [ result ]; }
                    settings.dataid++;

                    var min = 5;
                    var values = helpers.node.text($this);
                    if (settings.onlyone) { values = [ values[0] ]; }
                    for (var i in values) for (var j in result ) { min = Math.min (min,helpers.levenshtein(values[i], result[j])); }
                    min = Math.min(5,min*settings.err);
                    $this.find("#screen").addClass("s"+min);

                    if (settings.debug) { alert($this.find("#screen>div").html()+"\n"+values[0]); }

                    settings.wrongs+=min;

                    if (settings.dataid<settings.number) {
                        setTimeout(function(){
                            $this.find("#screen").removeClass();
                            settings.interactive = true;
                            helpers.build($this);
                        }, 1000);
                    }
                    else {
                        settings.score = 5 - settings.wrongs;
                        if (settings.score<0) { settings.score = 0; }
                        setTimeout(function(){helpers.end($this);}, 1000);
                    }
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mathematics plugin!'); }
    };
})(jQuery);

