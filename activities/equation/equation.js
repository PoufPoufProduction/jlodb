(function($) {
    // Activity default parameters
    var defaults = {
        name        : "equation",               // The activity name
        template    : "template.html",          // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // now localization
        url         : "desktop/equation.svg",   // The equation svg
        font        : 1,                        // Font size of the exercice
        scalemax    : 2,                        // The scale max
        source      : [],                       // Source element
        top         : 20,                       // top position of the first equation
        debug       : true                      // Debug mode
    };

    var c = {
        val         : 0,
        op          : 1,
        div         : 2,
        bra         : 5
    };

    var div = {
        root        : 0,
        numerator   : 1,
        denominator : 2
    }

    // private methods
    var helpers = {
        // @generic: Check the context
        checkContext: function(_settings){
            var ret         = "";
            if (!_settings.context)         { ret = "no context is provided in the activity call."; } else
            if (!_settings.context.onQuit)  { ret = "mandatory callback onQuit not available."; }

            if (ret.length) {
                ret+="\n\nUsage: $(\"target\")."+_settings.name+"({'onQuit':function(_ret){}})";
            }
            return ret;
        },
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },
        // Quit the activity by calling the context callback
        end: function($this) {
            var settings = helpers.settings($this);
            settings.context.onQuit({'status':'success', 'score':settings.score});
        },
        loader: {
            css: function($this) {
                var settings = helpers.settings($this), cssAlreadyLoaded = false, debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }

                if (settings.context.onload) { settings.context.onload(true); }

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
                $this.load( templatepath, function(response, status, xhr) {
                    if (status=="error") {
                        settings.context.onquit({'status':'error', 'statusText':templatepath+": "+xhr.status+" "+xhr.statusText});
                    }
                    else { helpers.loader.svg($this); }
                });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div></div>").appendTo($this.find("#svg"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings.class);
                settings.svg.load('res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onLoad) { settings.context.onLoad(false); }
                $this.css("font-size", Math.floor($this.height()/12)+"px");

                // LOCALE HANDLING
                $this.find("h1#label").html(settings.label);
                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }

                // EXERCICE AND FIGURE
                if (settings.figure) { $this.find("#figure").html("<img src='res/img/"+settings.figure+"'/>"); }
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        $this.find("#exercice").html("");
                        for (var i in settings.exercice) { $this.find("#exercice").append("<p>"+settings.exercice[i]+"</p>"); }
                    }
                    else { $this.find("#exercice").html("<p>"+settings.exercice+"</p>"); }
                }
                $this.find("#exercice p").css("font-size",(0.6*settings.font)+"em");

                // SOURCE
                for (var i in settings.source) {
                    var $val = $("#template .val.type"+c.val, settings.svg.root()).clone().appendTo($("#source", settings.svg.root()));
                    $val.attr("transform","translate(40,"+(40+i*50)+")").attr("class","val source").attr("id",i);
                    $("text",$val).text(settings.source[i]);
                    $val.bind("mousedown touchstart", function(e) {
                        var settings = helpers.settings($(this).closest(".equation"));
                        if (settings.interactive) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;
                            var eq = helpers.equations.get($this);
                            var now= new Date();
                            settings.action.pos=[ve.clientX,ve.clientY];
                            settings.action.node={elt:[{$svg:$(this), pos:{now:[-eq.margin.now[0]/40 - 1.1/eq.scale.now,
                                (-eq.margin.now[1]-eq.top/eq.scale.now)/40+(1+1.25*parseInt($(this).attr("id")))/eq.scale.now]}}]};
                            settings.action.time = now.getTime();
                            settings.action.source = true;
                        }
                        e.preventDefault();
                    });
                }

                // EQUATIONS
                settings.ratio = 640/$this.width();
                var ok = true;
                for (var i=0; i<settings.data.length; i++) {
                    settings.data[i] = $.extend(helpers.equation(), settings.data[i]);
                    settings.data[i].$svg = $("#template .equ", settings.svg.root()).clone().appendTo($("#equ", settings.svg.root()));
                    settings.data[i].$svg.attr("id",i).find(".large").hide();
                    settings.data[i].$svg.find("#target").hide();
                    settings.data[i].$svg.find("#maximize").bind('touchstart mousedown', function(event) {
                        var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                event.originalEvent.touches[0]:event;
                        helpers.equations.display($(this).closest(".equation"),  $(this).closest(".equ").attr("id"),300);
                        event.preventDefault();

                    });
                    ok &= settings.data[i].init($this);
                }
                if (!ok) {
                    for (var i in settings.data) for (var j in settings.data[i].value2tree.errors) {
                        $this.find("#error div").append("<p>"+settings.data[i].value2tree.errors[j]);
                    }
                    $this.find("#error").show();
                }
                else {
                    helpers.equations.display($this, 0,0);
                    for (var i in settings.data) {
                        settings.data[i].update($this);
                        settings.data[i].display();
                    }

                    $this.bind("mousemove touchmove",function(e) {
                        var $this = $(this), settings = helpers.settings($this);
                        if (settings.interactive && settings.action.node!=0) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;

                            var eq = helpers.equations.get($this);
                            if (settings.action.helper) {
                                // MOVE THE HELPER

                                settings.action.helper.attr("transform","translate("+
                                    ((eq.margin.now[0]+settings.action.node.elt[0].pos.now[0]*40)+
                                        (ve.clientX-settings.action.pos[0])*settings.ratio/eq.scale.now)+","+
                                    ((eq.margin.now[1]+settings.action.node.elt[0].pos.now[1]*40)+
                                        (ve.clientY-settings.action.pos[1])*settings.ratio/eq.scale.now)+")");

                                // FIND THE CLOSEST TARGET
                                var coord   = eq.html2svg($this, [ve.clientX, ve.clientY]);
                                var target  = 0;

                                if (!target && !settings.action.source) {
                                    target = eq.over(coord, [0,0]);
                                    if (target && target!=settings.action.node) {
                                        target.elt[0].$svg.find("#over").attr("class","s");
                                    }
                                }
                                if (!target && settings.action.source) {
                                    if (coord[0]>0 && coord[1]>0 && coord[1]<40) {
                                        eq.$svg.find("#header").attr("class","banner");
                                    }
                                    else {
                                        eq.$svg.find("#header").attr("class","banner hide");
                                        if (coord[0]>0 && coord[1]>200 && coord[1]<240) {
                                            eq.$svg.find("#footer").attr("class","banner");
                                        }
                                        else {
                                            eq.$svg.find("#footer").attr("class","banner hide");
                                        }
                                    }
                                }

                            }
                            else {
                                // BEGIN TO MOVE: SHOW THE TARGET, CREATE THE HELPER AND ORGANIZE STACK
                                var t = new Date(), delta = t.getTime() - settings.action.time;
                                if (delta>100) {
                                    if (settings.action.source) {
                                        settings.action.helper = settings.action.node.elt[0].$svg.clone().attr("class","val type0")
                                            .attr("transform","translate("+
                                                (eq.margin.now[0]+settings.action.node.elt[0].pos.now[0]*40)+","+
                                                (eq.margin.now[1]+settings.action.node.elt[0].pos.now[1]*40)+")")
                                            .appendTo(eq.$svg.find("#content"));
                                    }
                                    else {
                                        eq.$svg.find("#target")
                                            .attr("transform","translate("+
                                                (eq.margin.now[0]+settings.action.node.elt[0].pos.now[0]*40)+","+
                                                (eq.margin.now[1]+settings.action.node.elt[0].pos.now[1]*40)+")")
                                            .detach().appendTo(eq.$svg.find("#content")).show();

                                        settings.action.node.elt[0].$svg.detach().appendTo(eq.$svg.find("#content"));
                                        settings.action.helper = settings.action.node.elt[0].$svg.clone().appendTo(eq.$svg.find("#content"));
                                        settings.action.node.elt[0].$svg.attr("class","val type0 source");
                                    }
                                }
                            }
                        }
                    });

                    $this.bind("mouseup touchend", function(e) {
                        var $this = $(this), settings = helpers.settings($this);
                        if (settings.interactive) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;
                            if (settings.action.node!=0) {


                                var eq = helpers.equations.get($this);
                                eq.$svg.find("#target").hide();
                                var t = new Date(), delta = t.getTime() - settings.action.time;
                                var distx = Math.pow(ve.clientX-settings.action.pos[0],2);
                                var disty = Math.pow(ve.clientY-settings.action.pos[1],2);
                                var dist = 100* Math.sqrt(distx + disty) / ($this.width()*eq.scale.now);

//----------------------------------------------
if (!settings.action.helper) {
    if (settings.action.node.value=="0") {
        if (settings.action.node.parent.value=="+") { eq.remove(settings.action.node); } else
        if (settings.action.node.parent.value=="*") { eq.replace(settings.action.node.parent, settings.action.node, true); }
    }
    else
    if (settings.action.node.value=="1") {
        if (settings.action.node.parent.value=="*") { eq.remove(settings.action.node); }
    }
    else {
        var val = parseInt(settings.action.node.value);
        if (isNaN(val)) {
            var elt = helpers.element(settings.action.node.parent, settings.action.node.div);
            elt.type = c.op; elt.value = "*";
            if (settings.action.node.value[0]=='-') { settings.action.node.value=settings.action.node.value.substr(1); }
            else                                    { settings.action.node.value="-"+settings.action.node.value; }
            var child = helpers.element(elt, settings.action.node.div);
            child.type = c.val; child.value = "-1";
            elt.children=[child, settings.action.node];
            eq.replace(settings.action.node, elt);
        }
        else {
            if (val<0) {
                var elt = helpers.element(settings.action.node.parent, settings.action.node.div);
                elt.type = c.op; elt.value = "*";
                settings.action.node.value=settings.action.node.value.substr(1);
                var child = helpers.element(elt, settings.action.node.div);
                child.type = c.val; child.value = "-1";
                elt.children=[child, settings.action.node];
                eq.replace(settings.action.node, elt);
            }
            else {
                var d = 0; for (var i=2; i<val && !d; i++) { if (val%i==0) { d=i; } }
                if (d) {
                    var elt = helpers.element(settings.action.node.parent, settings.action.node.div);
                    elt.type = c.op; elt.value = "*";
                    settings.action.node.value=Math.floor(val/d);
                    var child = helpers.element(elt, settings.action.node.div);
                    child.type = c.val; child.value = d;
                    elt.children=[child, settings.action.node];
                    eq.replace(settings.action.node, elt);
                }
                else {
                    var elt = helpers.element(settings.action.node.parent, settings.action.node.div);
                    elt.type = c.op; elt.value = "*";
                    settings.action.node.value="-"+settings.action.node.value;
                    var child = helpers.element(elt, settings.action.node.div);
                    child.type = c.val; child.value = "-1";
                    elt.children=[child, settings.action.node];
                    eq.replace(settings.action.node, elt);
                }
            }
        }
    }

    helpers.equations.get($this).update($this);
    helpers.equations.get($this).display(250);
}
else {
    settings.action.node.elt[0].$svg.attr("class","val type0");
}
//----------------------------------------------
                            }
                        }
                        settings.action.node = 0;
                    });
                }

                if (!$this.find("#splash").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        element: function(_parent, _div) {
            return { type : 0, value : "", children : [], elt: [], div:_div, parent: _parent }
        },

        // THE EQUATION MANAGER
        equations: {
            get         : function($this) { return this.id!=-1?helpers.settings($this).data[this.id]:0; },
            id          : -1,       // THE OPENED EQUATION
            to          : -1,       // THE EQUATION TO OPEN
            // OPEN A NEW EQUATION AND DISPLAY EVERY ONES
            display     : function($this, _id, _anim) {
                var settings= helpers.settings($this);
                var begin   = 0;

                this.to     = _id;
                settings.data[this.to].$svg.find(".small").hide();
                settings.data[this.to].$svg.find(".large").show();
                settings.data[this.to].$svg.detach().appendTo($("#equ", settings.svg.root()));

                if (this.id==-1) {
                    _anim = 0;
                }
                else {
                    if (_anim) {
                        settings.data[this.id].$svg.find(".small").hide();
                        settings.data[this.id].$svg.find(".large").show();
                        settings.data[this.to].$svg.find(".large").attr("transform","scale(1,0.2)");
                        var now = new Date(); begin=now.getTime();
                    }
                }
                this.displayex($this, begin, _anim , _anim?1:0);
            },
            displayex     : function($this, _begin, _anim, _scale) {
                var settings = helpers.settings($this);
                var t=settings.top;

                for (var i=0; i<settings.data.length; i++) {
                    settings.data[i].top = t;
                    settings.data[i].$svg.attr("transform","translate(85,"+settings.data[i].top+")").attr("class","equ");
                    if (i==this.id) {
                        settings.data[i].$svg.find(".large").attr("transform","scale(1,"+(0.2+0.8*_scale)+")");
                        t += 200*_scale+50;
                    } else
                    if (i==this.to) {
                        settings.data[i].$svg.find(".large").attr("transform","scale(1,"+(1-0.8*_scale)+")");
                        t += 200*(1-_scale)+50;
                    } else { t += 50; }
                }

                if (_anim && _scale!=0) {
                    var now = new Date(); _scale=(_begin+_anim-now.getTime())/_anim;
                    if (_scale<0) { _scale=0; }
                    setTimeout( function() { helpers.equations.displayex($this, _begin, _anim, _scale); },1);
                }
                else {
                    if (this.id!=-1) {
                        settings.data[this.id].$svg.find(".large").hide();
                        settings.data[this.id].$svg.find(".small").show();
                    }
                    this.id = this.to;
                }
            }
        },

        // THE EQUATION DATA
        equation: function() {
            return {
            $svg        : 0,                            // SVG DATA
            value       : "",                           // EQUATION WITH TEXT FORMAT
            sep         : 0,                            // SEPARATOR POSITION IF ANY (IN PIXEL FROM MARGIN.NOW[0])
            top         : 0,                            // TOP OFFSET OF THE EQUATION (IN PIXEL)
            tree        : {},                           // EQUATION ELEMENT TREE
            margin      : { now:[0,0], to:[0,0] },      // MARGIN OF THE EQUATION (IN PIXEL)
            scale       : { now:1, to:1 },              // SIZE OF THE EQUATION

            // CONVERT HTML COORD INTO SVG EQUATION COORD - (0,0) is the upper-left corner of this equation .large rect
            html2svg    : function($this, _pos) {
                var settings = helpers.settings($this); return [ _pos[0]*settings.ratio - 85, _pos[1]*settings.ratio - this.top ];
            },
            // FIND A NODE WITH THIS COORD
            over        : function(_pos, _offset, _node) {
                if (!_node) {
                    _node = this.tree;
                    _pos = [ (_pos[0]/this.scale.now-this.margin.now[0])/40, (_pos[1]/this.scale.now - this.margin.now[1])/40];
                }
                var ret = 0;
                if (_node.type==c.val) {
                    ret= ( _node.elt[0].pos.now[0]-0.5+_offset[0] < _pos[0] && _node.elt[0].pos.now[0]+0.5+_offset[0] > _pos[0] &&
                           _node.elt[0].pos.now[1]-0.5+_offset[1] < _pos[1] && _node.elt[0].pos.now[1]+0.5+_offset[1] > _pos[1] )?_node:0;
                }
                else { for (var i in _node.children) { if (!ret) { ret = this.over(_pos, _offset, _node.children[i]); } } }
                return ret;
            },
            // CONVERT A TEXT EQUATION INTO A TREE OF ELEMENTS
            value2tree  : {
                errors  : [],                           // LIST OF ERRORS DURING THE CONSTRUCTION OF THE TREE
                // LOOK FOR A EQUALITY OPERATOR
                eq      : function(_value) {
                    var r = -1;
                    for (var i=0; i<_value.length; i++) {
                        if (_value[i]=='=' || _value[i]=='<' || _value[i]=='>') {
                            if (r==-1) { r = i; } else { this.errors.push("More than one equality operand"); }
                    }}
                    return r;
                },
                // GET THE DIFFERENT POSITION FOR AN OPERATOR
                token   : function(_value, _char) {
                    var r = [], deep = 0;
                    for (var i=0; i<_value.length; i++) {
                        switch(_value[i]) {
                            case _char          : if (deep==0) { r.push(i); } break;
                            case '('            : deep++; break;
                            case ')'            : deep--; if (deep<0) { this.errors.push("Bracket error"); } break;
                        }
                    }
                    return r;
                },
                // GET THE POSITION OF THE DIVISION OPERATOR
                get    : function(_value) {
                    var r = -1, deep = 0;
                    for (var i=0; i<_value.length; i++) {
                        switch(_value[i]) {
                            case '/'            : if (deep==0) { if (r!=-1) { this.errors.push("Division error"); } else { r=i; } } break;
                            case '('            : deep++; break;
                            case ')'            : deep--; if (deep<0) { this.errors.push("Bracket error"); } break;
                        }
                    }
                    return r;
                },

                // BUILD THE TREE
                process : function(_value, _parent, _div) {
                    var elt = helpers.element(_parent, _div);
                    var done = false;

                    // EQUALITY
                    var pos =this.eq(_value);
                    if ((done=(pos!=-1))) {
                        elt.type = c.op; elt.value = _value.substr(pos,1);
                        elt.children=[this.process(_value.substr(0,pos), elt, div.root), this.process(_value.substr(pos+1), elt, div.root)];
                    }

                    // ADDITION THEN MULTIPLICATION
                    if (!done) {
                        var op = ['+','*'];
                        for (var k in op) if (!done) {
                            var elts = this.token(_value,op[k]);
                            if ((done=(elts.length!=0))) {
                                elt.type = c.op; elt.value = op[k];
                                for (var i=0,j=0; i<elts.length; i++ ) {
                                    elt.children.push(this.process(_value.substr(j,elts[i]-j), elt, _div));
                                    j=elts[i]+1;
                                }
                                elt.children.push(this.process(_value.substr(elts[elts.length-1]+1), elt,_div));
                            }
                        }
                    }

                    // DIVISION
                    if (!done) {
                        var pos =this.get(_value);
                        if ((done=(pos!=-1))) {
                            elt.type = c.div; elt.value = '/';
                            elt.children=[this.process(_value.substr(0,pos), elt, div.numerator),
                                          this.process(_value.substr(pos+1), elt, div.denominator)];
                        }
                    }

                    // INVISIBLE BRACKET
                    if (!done) {
                        if ((done=((_value[0]=='(')&&(_value[_value.length-1]==')')))) {
                            var elttmp = this.process(_value.substr(1,_value.length-2), elt, _div);
                            if (_parent.type==c.div) { elt = elttmp; }
                            else {
                                elt.type = c.bra; elt.value = '(';
                                elt.children=[elttmp];
                            }
                        }
                    }

                    // VALUE
                    if (!done) { elt.type = c.val; elt.value = _value; }

                    return elt;
                }
            },

            // CONVERT A TREE OF ELEMENTS INTO A TEXT FORM
            tree2value  : function(_node) {
                if (!_node) { _node = this.tree; }
                var ret = "";
                switch(_node.type) {
                    case c.op: case c.div:
                        for (var i=0; i<_node.children.length; i++) {
                            if (i!=0) ret+=_node.value;
                            var child = this.tree2value(_node.children[i]);
                            if (_node.value=="/" && (child.indexOf("+")!=-1 ||child.indexOf("/")!=-1) ) { child="("+child+")"; }
                            ret += child;
                        }
                        break;
                    case c.bra: ret = "("+this.tree2value(_node.children[0])+")"; break;
                    case c.val: ret = (_node.value[0]=='-')?"("+_node.value+")":_node.value; break;
                }
                return ret;
            },

            // INIT THE TREE
            init        : function($this) {
                this.tree = this.value2tree.process(this.value, 0, 0);
                if (this.value!=this.tree2value()) { this.value2tree.errors.push("Value error: "+this.tree2value()); }
                this.value= this.tree2value();
                this.label($this);
                return (this.value2tree.errors.length==0);
            },

            label       : function($this) { this.$svg.find(".label").text(this.value); },

            display     : function(_anim) {
                var begin = 0;
                if (_anim) { var now = new Date(); begin=now.getTime(); }
                this.displayex(this.tree, begin, _anim , _anim?1:0);
            },
            displayex     : function(_node, _begin, _anim,_scale) {
                var margin = [
                    this.margin.now[0]*_scale+this.margin.to[0]*(1-_scale),
                    this.margin.now[1]*_scale+this.margin.to[1]*(1-_scale)
                ]
                for (var i in _node.elt) {
                    _node.elt[i].$svg.attr("transform","translate("+
                        ((_node.elt[i].pos.now[0]*_scale+_node.elt[i].pos.to[0]*(1-_scale)) *40+margin[0])+","+
                        ((_node.elt[i].pos.now[1]*_scale+_node.elt[i].pos.to[1]*(1-_scale))*40+margin[1])+")");
                    if (_scale==0) {
                        _node.elt[i].pos.now = [ _node.elt[i].pos.to[0], _node.elt[i].pos.to[1] ];
                    }
                }
                for (var i in _node.children) {
                    this.displayex(_node.children[i], _begin, _anim, _scale);
                }
                if (_node==this.tree) {
                    var scale = this.scale.now*_scale+this.scale.to*(1-_scale);
                    this.$svg.find("#content").attr("transform","scale("+scale+")");

                    if (_node.value=="=") {
                        this.sep = (_node.elt[0].pos.now[0]*_scale+_node.elt[0].pos.to[0]*(1-_scale))*40;
                        this.$svg.find("#sep").attr("x1",(this.sep+margin[0])*scale).attr("x2",(this.sep+margin[0])*scale);
                    }
                    else { this.$svg.find("#sep").hide(); }

                    if (_anim && _scale!=0) {
                        var now = new Date(); _scale=(_begin+_anim-now.getTime())/_anim;
                        if (_scale<0) { _scale=0; }
                        var tree = this;
                        setTimeout( function() { tree.displayex(_node, _begin, _anim, _scale); },1);
                    }
                    else {
                        this.scale.now = this.scale.to;
                        this.margin.now = [ this.margin.to[0], this.margin.to[1] ];
                    }
                }
            },

            // COMPUTE THE POSITION OF THE ELEMENTS
            update      : function($this, _node, _pos) {
                var settings    = helpers.settings($this);
                var ret         = [1,1,0.5];
                if (!_node) { _node = this.tree; }
                if (!_pos)  { _pos = [0,0]; }
                var b           = (_node.elt.length==0);

                switch(_node.type) {
                    case c.val :
                        if (_node.elt.length==0) {
                            var elt = { $svg: $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).attr("id",settings.nodes.length)
                                                    .appendTo(this.$svg.find("#content")),
                                        pos : { now:[0,0], to:[0,0] } };
                            elt.$svg.bind("mousedown touchstart", function(e) {
                                var $this=$(this).closest(".equation"), settings = helpers.settings($this);
                                if (settings.interactive) {
                                    var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                                e.originalEvent.touches[0]:e;
                                    settings.action.pos=[ve.clientX,ve.clientY];
                                    settings.action.node=settings.nodes[$(this).attr("id")];
                                    var now = new Date();
                                    settings.action.time = now.getTime();
                                    settings.action.source = false;
                                }
                                e.preventDefault();
                            });
                            _node.elt.push(elt);
                            settings.nodes.push(_node);
                        }
                        _node.elt[0].$svg.find("text").text(_node.value);
                        _node.elt[0].pos.to = [_pos[0],_pos[1]];
                    break;
                    case c.op :
                        var x = 0, y = 1, t = 0;
                        for (var i=0; i<_node.children.length; i++) {
                            if (i!=0) {
                                if (b) {
                                    var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                                pos : { now:[0,0], to:[0,0] } };
                                    elt.$svg.find("text").text(_node.value);
                                    _node.elt.push(elt);
                                }
                                _node.elt[i-1].pos.to = [_pos[0]+x-.25,_pos[1]];
                                x+=.5;
                            }
                            var size=this.update($this, _node.children[i], [_pos[0]+x, _pos[1]]);
                            x+=size[0]; if (size[1]>y) { y = size[1]; } if (size[2]>t) { t = size[2]; }
                        }
                        if (y>1) {
                            var offset = (_node.div==1)?t-y+0.5:t-0.5;
                            if (_node.div!=0 && offset) { this.offset(_node, 0, offset); }
                        }
                        ret = [x,y,t];
                    break;
                    case c.div :
                        var pos1=[_pos[0], _pos[1]-0.6], pos2=[_pos[0], _pos[1]+0.6];
                        var size1 = this.update($this, _node.children[0], [_pos[0],_pos[1]-0.6]);
                        var size2 = this.update($this, _node.children[1], [_pos[0],_pos[1]+0.6]);
                        var x = Math.max(size1[0], size2[0]);
                        if (size1[0]<size2[0])  { this.offset(_node.children[0], (size2[0]-size1[0])/2,0); }
                        else                    { this.offset(_node.children[1], (size1[0]-size2[0])/2,0); }

                        if (b) {
                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[0,0], to:[_pos[0],_pos[1]] } };
                            _node.elt.push(elt);
                        }
                        _node.elt[0].$svg.find("line").attr("x2",40*(x-0.5));
                        ret=[x, size1[1]+size2[1]+0.2, size1[1]+0.1];
                    break;
                    case c.bra :
                        var size = this.update($this, _node.children[0], [_pos[0]+0.5,_pos[1]]);

                        if (b) {
                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[0,0], to:[0,0] },
                                        scale: { now:1, to:1} };
                            elt.$svg.find("text").text("(");
                            elt.$svg.find(".scale").attr("transform","scale(1,"+size[1]+")");
                            _node.elt.push(elt);

                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[0,0], to:[0,0] } };
                            elt.$svg.find("text").text(")");
                            elt.$svg.find(".scale").attr("transform","scale(1,"+size[1]+")");
                            _node.elt.push(elt);
                        }
                        _node.elt[0].pos.to = [_pos[0]-.25,_pos[1]];
                        _node.elt[0].scale.to = size[1];
                        _node.elt[1].pos.to = [_pos[0]+size[0]+.25,_pos[1]];
                        _node.elt[0].scale.to = size[1];

                        if (size[1]>1 && _node.children[0].type == c.op) {
                            var offset = (_node.div==1)?size[2]-size[1]+0.5:size[2]-0.5;
                            if (_node.div!=0 && offset) {
                                for (var i in _node.elt) { _node.elt[i].pos.to=[_node.elt[i].pos.to[0], _node.elt[i].pos.to[1]+offset]; }
                            }
                        }

                        ret = [size[0]+1, size[1], size[2]];
                    break;
                }
                if (_node==this.tree) {
                    this.scale.to = Math.min((240-10)/(y*40),(540-10)/(x*40));
                    if (this.scale.to > settings.scalemax) { this.scale.to = settings.scalemax; }
                    this.margin.to = [ Math.floor((540/this.scale.to + (1-x)*40)/2),
                                       Math.floor(t*40 + ( 240/this.scale.to - y*40)/2)];
                }

                return ret;
            },

            // ADD AN OFFSET TO ALL CHILDREN OF NODE
            offset      : function(_node, _left, _top) {
                for (var i in _node.elt) { _node.elt[i].pos.to=[_node.elt[i].pos.to[0]+_left, _node.elt[i].pos.to[1]+_top]; }
                for (var i in _node.children) { this.offset(_node.children[i], _left, _top); }
            },

            // HIDE (DETACH ACTUALLY) THE SVG ELEMENT OF ALL CHILDREN, EXCEPT THE EXCEPTION
            detach      : function(_node, _exception) {
                if (_exception==0 || _node!=_exception) {
                    for (var i in _node.elt) { _node.elt[i].$svg.detach(); }
                    for (var i in _node.children) { this.detach(_node.children[i], _exception); }
                }
            },

            // REMOVE A NODE
            remove      : function(_node) {
                var pos = -1;
                for (var i in _node.parent.children) { if (_node.parent.children[i]==_node) { pos = parseInt(i); }}
                if (pos!=-1) {
                    _node.parent.elt[pos?pos-1:0].$svg.hide();
                    this.detach(_node, 0);
                    _node.parent.children.splice(pos,1);
                    _node.parent.elt.splice(pos?pos-1:0,1);
                }
            },
            replace     : function(_source, _dest, _detach) {
                var pos = -1;
                for (var i in _source.parent.children) { if (_source.parent.children[i]==_source) { pos = parseInt(i); }}
                if (pos!=-1) {
                    _dest.parent = _source.parent;
                    _source.parent.children[pos]=_dest;
                    if (_detach) { this.detach(_source, _dest); }
                }
            }
        }}
    };

    // The plugin
    $.fn.equation = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    score           : 0,                        // The score
                    interactive     : false,                    // Entry allowed or not
                    action          : {                         // Touch parameter
                        source      : false,                    // true if node is from source
                        time        : 0,                        // Time of the mouse down
                        node        : 0,                        // Source node
                        mask        : [],                       // Authorized source node
                        target      : [],                       // Authorized target node
                        helper      : 0,                        // Clone of the source nod
                        pos         : 0                         // Position of origin
                    },
                    ratio           : 1,                        // SVG pixel size/HTML pixel size
                    nodes           : []                        // List of value nodes
                };

                 // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    $(document).unbind("keypress");
                    this.onselectstart = function() { return false; }

                    var $settings = $.extend({}, defaults, options, settings);
                    var checkContext = helpers.checkContext($settings);
                    if (checkContext.length) {
                        alert("CONTEXT ERROR:\n"+checkContext);
                    }
                    else {
                        $this.removeClass();
                        if ($settings.class) { $this.addClass($settings.class); }
                        helpers.settings($this.addClass(defaults.name), $settings);
                        helpers.loader.css($this);
                    }
                });
            },
            next: function() {
                var settings = $(this).data("settings");
                $(this).find("#splash").hide();
                settings.interactive=true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.timer.id) { clearTimeout(settings.timer.id); settings.timer.id=0; }
                settings.finish = true;
                settings.context.onQuit({'status':'abort'});
            },
            submit: function() { helpers.submit($(this)); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in equation plugin!'); }
    };
})(jQuery);

