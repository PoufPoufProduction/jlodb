(function($) {
    // Activity default parameters
    var defaults = {
        name        : "equation",               // The activity name
        template    : "template.html",          // Activity html template
        css         : "style.css",              // Activity css style sheet
        lang        : "fr-FR",                  // now localization
        url         : "desktop/equation.svg",   // The equation svg
        figure      : "",                       // Help figure
        exercice    : "",
        fontex      : 1,                        // Font size of the exercice
        scalemax    : 2,                        // The scale max
        source      : [],                       // Source element
        a           : { all         : true,     // Authorization : everything
                        equation    : false,    // Authorization : equation
                        move        : 0,        // Authorization : move a value (bitset: 0 none, 1 equation, 2 source, 4 bracket)
                        target      : 0,        // Authorization : local target on value (bitset: 0 none, 1 left righ, 2 top down)
                        source      : 0,        // Authorization : source to equation (bitset: 1 add, 2 multiply, 4 divide)
                        jump        : false,    // Authorization : jump over the equal sign
                        fraction    : false,    // Authorization : fractions addition and multiplication
                        addition    : false,    // Authorization : direct factorization for 2*x+3*x = 5*x
                        bracket     : false,    // Authorization : distribution
                        delbracket  : false,    // Authorization : delete brackets
                        minus1      : false,    // Authorization : transform x into -1*-x
                        decompose   : false,    // Authorization : transform 6 into 2*3

                        addeq       : false     // Authorization : add equations (blue arrow). Not conceirned by a.all
                      },
        top         : 168,                      // top position of the first equation
        background  : "",
		errratio	: 1,
        debug       : true                      // Debug mode
    };

    var c = {
        val         : 0,
        op          : 1,
        div         : 2,
        user        : 3,
        bra         : 5
    };

    var div = {
        root        : 0,
        numerator   : 1,
        denominator : 2
    }
    
    
    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[math\\\](.+)\\\[/math\\\]",            "<div class='math'><math>$1</math></div>"
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
            settings.context.onquit($this,{'status':'success', 'score':settings.score});
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
                $this.load( templatepath, function(response, status, xhr) { helpers.loader.svg($this); });
            },
            // Load the svg if require
            svg:function($this) {
                var settings = helpers.settings($this),debug = "";
                if (settings.debug) { var tmp = new Date(); debug="?time="+tmp.getTime(); }
                var elt= $("<div></div>").appendTo($this.find("#svg"));
                elt.svg();
                settings.svg = elt.svg('get');
                $(settings.svg).attr("class",settings["class"]);
                settings.svg.load('res/img/'+settings.url + debug,
                    { addTo: true, changeSize: true, onLoad:function() { helpers.loader.build($this); }
                });
            },
            build: function($this) {
                var settings = helpers.settings($this);
                if (settings.context.onload) { settings.context.onload($this); }

                // LOCALE HANDLING

                if (settings.locale) { $.each(settings.locale, function(id,value) { $this.find("#"+id).html(value); }); }
                
                // HANDLE BACKGROUND
                if (settings.background) { $this.children().first().css("background-image","url("+settings.background+")"); }

                // EXERCICE AND FIGURE
                if (settings.figure && settings.figure.length) { $this.find("#figure").html("<img src='res/img/"+settings.figure+"'/>").show(); }
                if (settings.exercice) {
                    if ($.isArray(settings.exercice)) {
                        // TODO: remove this part - do not use exercice as array anymore - use [br] instead.
                        settings.fontex*=0.8;
                        $this.find("#exercice>div").html("");
                        for (var i in settings.exercice) { $this.find("#exercice>div").append("<p>"+settings.exercice[i]+"</p>"); }
                    }
                    else { $this.find("#exercice>div").html(helpers.format(settings.exercice)); }
                }
                $this.find("#exercice>div").css("font-size",settings.fontex+"em");

                // HELPS
                if (!settings.a.all) {
                    $this.find(".help").addClass("inactive");
                    $this.find(".help.all").removeClass("inactive");
                    for (var i in settings.a) {
                        var v=settings.a[i];
                        switch(i) {
                            case "move":    if (v&1) { $this.find(".help.move1").removeClass("inactive"); }
                                            if (v&2) { $this.find(".help.move2").removeClass("inactive"); }
                                            if (v&4) { $this.find(".help.move4").removeClass("inactive"); } break;
                            case "source":  if ((v&1) && settings.source ) { $this.find(".help#heqa").removeClass("inactive"); }
                                            if ((v&2) && settings.source ) { $this.find(".help#heqm").removeClass("inactive"); }
                                            if ((v&4) && settings.source ) { $this.find(".help#heqd").removeClass("inactive"); } break;
                            case "target":  if (v&1) { $this.find(".help.target1").removeClass("inactive"); }
                                            if (v&2) { $this.find(".help.target2").removeClass("inactive"); } break;
                            case "equation" : if (v)    { $this.find(".help.equ").removeClass("inactive"); } break;
                            default : if (v)    { $this.find(".help."+i).removeClass("inactive"); } break;
                        }
                    }
                }
                
                
                $this.find(".help").bind("mousedown touchstart", function(_event) {
                    if (!$(this).hasClass("inactive")) {
                        var id=$(this).attr("id").substr(1);
                        $this.find(".help").removeClass("s");
                        $(this).addClass("s");
                        $this.find("#hcontent").html("").html(helpers.format(settings.locale.hlabel[id]));
                    }
                    _event.preventDefault();
                });
                
                // SOURCE
                for (var i in settings.source) { helpers.addSource($this, settings.source[i], 0); }

                // EQUATIONS
                var ok = true;
                for (var i=0; i<settings.data.length; i++) {
                    settings.data[i] = $.extend(helpers.equation(), settings.data[i]);
                    settings.data[i].$svg = $("#template .equ", settings.svg.root()).clone().appendTo($("#equ", settings.svg.root()));
                    settings.data[i].$svg.attr("id",i).find(".large").hide();
                    settings.data[i].$svg.find("#target").hide();
                    settings.data[i].$svg.find("#maximize").bind('touchstart mousedown', function(event) {
                        var settings = helpers.settings($(this).closest(".equation"));
                        if (settings.interactive && !settings.emptymode) {
                            var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                            helpers.equations.display($(this).closest(".equation"),  $(this).closest(".equ").attr("id"),300);
                        }
                        event.preventDefault();
                    });

                    settings.data[i].$svg.find("#smallbg").bind("mousedown touchstart", function(e) {
                        var $this=$(this).closest(".equation"), settings = helpers.settings($this);
                        settings.ratio = 640/$this.width();
                        if (settings.interactive && (settings.a.equation || settings.a.all) ) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;

                            settings.action.client      = [ve.clientX,ve.clientY];
                            settings.action.node        = 0;
                            settings.action.target      = 0;
                            settings.action.pos         = [ve.clientX,ve.clientY];
                            settings.action.time        = 0;
                            settings.action.equation    = 1;
                            var id = parseInt($(this).closest(".equ").attr("id"));

                            if (settings.data[id].tree.value=="=") {

                                // SUBSTITUTION OR ADDITION
                                settings.action.helper = 2;
                                for (var i=0; i<2; i++) {
                                    if (settings.data[id].tree.children[i].type==c.val &&
                                        /^[a-zA-Z()]+$/.test(settings.data[id].tree.children[i].value) ) { settings.action.helper=i; break;}
                                }

                                if (settings.action.helper!=2 || settings.a.addeq) {
                                    $("#arrow path", settings.svg.root()).css("fill",(settings.action.helper==2)?"blue":"red");
                                    settings.action.node = id+1;
                                    $("#arrow", settings.svg.root()).attr("transform",
                                                    "translate(0,"+settings.data[id].top+")");
                                } else { settings.action.equation = -1; }
                            }
                        }
                        e.preventDefault();
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
                    helpers.equations.id=-1;
                    helpers.equations.display($this, 0,0);
                    for (var i in settings.data) {
                        settings.data[i].update($this);
                        settings.data[i].display();
                    }

                    $this.bind("mousemove touchmove",function(e) {
                        var $this = $(this), settings = helpers.settings($this);
                        if (settings.interactive && settings.action.node!=0 && !settings.emptymode) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;
                            // EVENT.CLIENTX NOT AVAILABLE IN TOUCHEND (JUST STORE IT)
                            settings.action.client = [ ve.clientX, ve.clientY ];

                            var eq = helpers.equations.get($this);
                            if (settings.action.equation) {
                                // MOVE A MINIMIZED EQUATION TO ANOTHER ONE
                                settings.action.coord = [ settings.action.client[0]*settings.ratio-85,
                                                          settings.action.client[1]*settings.ratio-eq.top ];

                                if (settings.action.equation==1 &&
                                    settings.action.coord[0]>0 && settings.action.coord[0]<540 &&
                                    settings.action.coord[1]>0 && settings.action.coord[1]<240) {
                                    var id = settings.action.node-1;
                                    var up = (helpers.equations.id<id);
                                    $this.find(up?"#up":"#down").show();
                                    settings.action.target = true;
                                }
                                else { $this.find("#arrow path").hide(); settings.action.target = false; }
                            }
                            else
                            if (settings.action.helper) {
                                // MOVE THE HELPER
                                settings.action.coord = [
                                    ((eq.margin.now[0]+settings.action.node.elt[0].pos.now[0]*40)+
                                    (settings.action.client[0]-settings.action.pos[0])*settings.ratio/eq.scale.now),
                                    ((eq.margin.now[1]+settings.action.node.elt[0].pos.now[1]*40)+
                                    (settings.action.client[1]-settings.action.pos[1])*settings.ratio/eq.scale.now) ];
                                settings.action.helper.attr("transform","translate("+
                                    settings.action.coord[0]+","+settings.action.coord[1]+")");

                                // FIND THE CLOSEST TARGET
                                var coord   = eq.html2svg($this, [ settings.action.client[0]-$this.offset().left,
                                                                   settings.action.client[1]-$this.offset().top ]);
                                settings.action.target = 0;

                                if (settings.action.source!=1) {
                                    settings.action.target = eq.over(coord, [0,0]);
                                    if (settings.action.target==settings.action.node) { settings.action.target = 0; }

                                    if (!settings.action.target) {
                                        eq.$svg.find("#over").attr("class","");

                                        var dx = Math.pow((settings.action.client[0]-settings.action.pos[0])*settings.ratio/(40*eq.scale.now),2);
                                        var dy = Math.pow((settings.action.client[1]-settings.action.pos[1])*settings.ratio/(40*eq.scale.now),2);
                                        var d2 = dx + dy;
                                        if (d2>0.05 && d2<0.5) {
                                            if (dy==0 || dx/dy>1.5) {
                                                if (settings.a.all || settings.a.target&0x01) {
                                                    eq.$svg.find("#target").
                                                        attr("class",(settings.action.client[0]>settings.action.pos[0])?"left":"right"); } } else
                                            if (dx==0 || dy/dx>1.5) {
                                                if (settings.a.all || settings.a.target&0x02) {
                                                    eq.$svg.find("#target").
                                                        attr("class",(settings.action.client[1]>settings.action.pos[1])?"top":"bottom"); } }
                                        }
                                        else { eq.$svg.find("#target").attr("class",""); }
                                    }
                                    else {
                                        settings.action.target.elt[0].$svg.find("#over").attr("class","s");
                                        eq.$svg.find("#target").attr("class","");
                                    }
                                }

                                if (!settings.action.target && settings.action.source==1) {
                                    if (coord[0]>0 && coord[1]>0 && coord[1]<40) {
                                        if (settings.a.all || settings.a.source&0x02) {
                                            eq.$svg.find("#header").attr("class","banner");
                                        }
                                    }
                                    else {
                                        eq.$svg.find("#header").attr("class","banner hide");
                                        if (coord[0]>0 && coord[1]>200 && coord[1]<240) {
                                            if (settings.a.all || settings.a.source&0x04) {
                                                eq.$svg.find("#footer").attr("class","banner");
                                            }
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
                                    settings.action.coord = [
                                        eq.margin.now[0]+settings.action.node.elt[0].pos.now[0]*40,
                                        eq.margin.now[1]+settings.action.node.elt[0].pos.now[1]*40 ];
                                    if (settings.action.source!=0) {
                                        if (( settings.a.move&0x02 && settings.action.source==1 ) ||
                                            ( settings.a.move&0x04 && settings.action.source==2 ) || settings.a.all ) {
                                            var vClass = settings.action.node.elt[0].$svg.attr("class").replace("source","type0");
                                            settings.action.helper = settings.action.node.elt[0].$svg.clone().attr("class",vClass)
                                                .attr("transform","translate("+settings.action.coord[0]+","+settings.action.coord[1]+")")
                                                .appendTo(eq.$svg.find("#content"));
                                        }
                                    }
                                    else {
                                        if ( (settings.a.move&0x01 && settings.action.source==0) ||
                                              settings.a.all) {
                                            if (settings.a.target || settings.a.all) {
                                                eq.$svg.find("#target")
                                                    .attr("transform","translate("+settings.action.coord[0]+","+settings.action.coord[1]+")")
                                                    .detach().appendTo(eq.$svg.find("#content")).show();
                                            }
                                            settings.action.fromleft = (settings.action.coord[0]<eq.sep+eq.margin.now[0]);
                                            settings.action.node.elt[0].$svg.detach().appendTo(eq.$svg.find("#content"));
                                            settings.action.helper =
                                                settings.action.node.elt[0].$svg.clone().appendTo(eq.$svg.find("#content"));
                                            var vClass = settings.action.node.elt[0].$svg.attr("class");
                                            settings.action.node.elt[0].$svg.attr("class",vClass+" source");
                                        }
                                    }
                                }
                            }
                        }
                    });

                    $this.bind("mouseup mouseleave touchend touchleave", function(e) {
                        var $this = $(this), settings = helpers.settings($this);
                        if (settings.interactive) {
                            var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                      e.originalEvent.touches[0]:e;
                            if (settings.action.node!=0) {
                                var anim = true;
                                var eq   = helpers.equations.get($this);

//-------------- PERFORM ACTION (CHANGE IDENTATION : RESET AND TAB=2) -------------------------------------------------------------

// SOME NODES ARE EMPTY (CREATING A FRACTION FROM 1)... FILL THEM THANKS TO THE CURRENT NODE
if (settings.emptymode) {
  if (settings.action.node.value!="0" && (settings.action.node.type==c.user || !isNaN(parseInt(settings.action.node.value)))) {
    eq.$svg.find(".empty").each( function() {
        settings.nodes[$(this).attr("id")].type  = settings.action.node.type;
        settings.nodes[$(this).attr("id")].value = settings.action.node.value;
    });
    settings.emptymode = false;
  }
}
// MOVE AND EQUATION TO ANOTHER ONE
else if (settings.action.equation) {
  if (settings.action.target) {
    var id = settings.action.node-1;

    if (settings.action.helper==2) {
      // ADDITION MODE
      for (var i=0; i<2; i++) {
        var elt = helpers.element();
        elt.type = c.op; elt.value = "+";
        var child = settings.data[id].tree.children[i].clone();
        elt.children=[eq.tree.children[i],child];
        eq.replace(eq.tree.children[i], elt);
        elt.parent = eq.tree;
        elt.children[0].parent = elt;
        elt.children[1].parent = elt;
      }
    }
    else {
      // REMPLACEMENT MODE (MOVED EQUATION IS LIKE 'X=VALUE')
      eq.searchandreplace(settings.data[id].tree.children[settings.action.helper],
                          settings.data[id].tree.children[1-settings.action.helper]);
    }
  }
  anim = false;
  settings.action.equation = 0;
  settings.action.target = 0;
  $this.find("#arrow path").hide();
}
else
{
  eq.$svg.find("#target").hide();
  var t     = new Date(), delta = t.getTime() - settings.action.time;           // TIME DELTA
  var distx = Math.pow(settings.action.client[0]-settings.action.pos[0],2);     // DISTANCE FROM DOWN IN X-AXIS
  var disty = Math.pow(settings.action.client[1]-settings.action.pos[1],2);     // DISTANCE FROM DOWN IN Y-AXIS
  var dist  = 100* Math.sqrt(distx + disty) / ($this.width()*eq.scale.now);     // DISTANCE FROM DOWN

  // NO HELPER MEANS THERE HASN'T BEEN ANY MOVEMENT, JUST A MERE CLICK
  if (!settings.action.helper) {
    if (settings.action.source!=0) {
      if (settings.action.node.value.length!=0) {
        if (settings.action.node.elt[0].$svg.attr("class").indexOf("type"+c.user)!=-1) {
          // CLICK ON A SOURCE USER VALUE TO REPLACE SAME VALUE IN THE EQUATION
          eq.changeForUser(settings.action.node.value);
        }
        else {
          if (settings.a.minus1||settings.a.all) {
            // CHANGE SIGN OF THE SOURCE VALUE
            var value = settings.action.node.value;
            if (value[0]=='-') { value = value.substr(1); } else { value = "-"+value; }
            $("text", settings.action.node.elt[0].$svg).text(value);
          }
        }
      }
    }
    else {
      var done = false;

      // LOOKING FOR A PARENT BRACKET
      var bra = settings.action.node;
      while (bra!=eq.tree && bra.type!=c.bra) { bra = bra.parent; }
      if (bra.type==c.bra && (settings.a.delbracket || settings.a.all )) {
        var cbra = bra.children[0];
        // CURRENT NODE IS INSIDE A BRACKET : CAN WE REMOVE IT
        if (cbra.value=="*" || cbra.type==c.val || cbra.type==c.bra || cbra.value=="/" ||
            bra.parent==0 || bra.parent.value=="+" || bra.parent.value=="=" || bra.parent.value=="/" || bra.parent.value=="(" ) {
          eq.remove(cbra);
          eq.replace(eq.hide(bra), cbra);
          done = true;
        }
      }

      if (!done) {
        // CLIKED ELEMENT IS AN USER VARIABLE : JUST EXPEND IT
        if (settings.action.node.elt[0].$svg.attr("class").indexOf("type"+c.user)!=-1) {
          var sid = -1; for (var i in settings.sourcedef) { if (settings.sourcedef[i].value==settings.action.node.value) { sid = i; } }
          if (sid!=-1) {
            var elt = settings.sourcedef[sid].elt.clone();
            elt.origin=[settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
            eq.replace(eq.hide(settings.action.node), elt);
          }
          done = true;
        }
      }

      if (!done) {
        // CLICKED ELEMENT IS A 0: ABSORB IN * AND /, REMOVE IN +
        if (settings.action.node.value=="0") {
          if (settings.action.node.parent.value=="+") { eq.hide(eq.remove(settings.action.node)); } else
          if (settings.action.node.parent.value=="*") {
            eq.remove(settings.action.node);
            eq.replace(eq.hide(settings.action.node.parent), settings.action.node);
          } else
          if (settings.action.node.parent.value=="/" && settings.action.node.parent.children[0]==settings.action.node) {
            eq.remove(settings.action.node);
            eq.replace(eq.hide(settings.action.node.parent), settings.action.node);
          }
        }
        else
        // CLICKED ELEMENT IS A 1
        if (settings.action.node.value=="1") {
          if (settings.action.node.parent.value=="*") { eq.hide(eq.remove(settings.action.node)); } else
          if (settings.action.node.parent.value=="/" && settings.action.node.parent.children[1]==settings.action.node) {
            eq.hide(eq.remove(settings.action.node));
          }
        }
        else {
          var val = parseInt(settings.action.node.value);
          var d = 0; if (!isNaN(val) && (settings.a.decompose||settings.a.all)) { for (var i=2; i<val && !d; i++) { if (val%i==0) { d=i; } } }
          var authorized = settings.a.all || ((isNaN(val) || val<0 || (d==0))?settings.a.minus1:settings.a.decompose);

          if (authorized) {
            // DECOMPOSE THE VALUE INTO A MULTIPLICATION (X BECOMES -1*-X OR A*B IF IT IS POSSIBLE)
            var elt = helpers.element();
            elt.type = c.op; elt.value = "*";
            elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
            var child = helpers.element();
            child.type = c.val; child.value = "-1";
            child.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
            elt.children=[child,settings.action.node];

            if (isNaN(val)) {
              if (settings.action.node.value[0]=='-') { settings.action.node.value=settings.action.node.value.substr(1); }
              else                                    { settings.action.node.value="-"+settings.action.node.value; }
            }
            else {
              if (val<0)  { settings.action.node.value=settings.action.node.value.substr(1); }
              else {
                if (d)  { settings.action.node.value=Math.floor(val/d); child.value = d; }
                else    { settings.action.node.value="-"+settings.action.node.value; }
              }
            }

            eq.replace(settings.action.node, elt);
            settings.action.node.parent = elt;
          }
        }
      }
    }
  }
  else {
    // THERE IS AN HELPER, THAT MEANS A VALUE HAS BEEN MOVED
    var coord   = eq.html2svg($this, settings.action.client);
    if (settings.action.source==1) {
      // VALUE COMES FROM SOURCE ZONE (BUT ITS NOT A BRACKET NOR A SAVE)
      // 3 OPERATIONS ARE POSSIBLE: + (DROP IN MAIN ZONE), * (DROP IN HEADER), / (DROP IN FOOTER)
      var op = "";
      if (eq.$svg.find("#header").attr("class").indexOf("hide")==-1) { eq.$svg.find("#header").attr("class","banner hide"); op="*";
      } else
      if (eq.$svg.find("#footer").attr("class").indexOf("hide")==-1) { eq.$svg.find("#footer").attr("class","banner hide"); op="/";
      } else if (coord[0]>0&&coord[0]<540&&coord[1]>0&&coord[1]<240
                 && (settings.a.all || settings.a.source&0x01))      { op = "+"; }

      if (op!="") {
        for (var i=0; i<eq.tree.children.length; i++) {
          var node = eq.tree.children[i];
          operator = op;
          // DIVIDE A FRACTION IS MULTIPLE THE DENOMINATOR
          if (operator=="/" && node.value==operator) { operator="*"; node = eq.tree.children[i].children[1]; }

          var elt = helpers.element();
          elt.type = (operator=="/")?c.div:c.op; elt.value = operator;
          elt.origin = [(coord[0]/eq.scale.now-eq.margin.now[0])/40,(coord[1]/eq.scale.now-eq.margin.now[1])/40];
          var child = helpers.element();
          child.type = settings.action.node.elt[0].$svg.attr("class").indexOf("type"+c.user)!=-1?c.user:c.val;
          child.value = settings.action.helper.find("text").text();
          child.origin = [(coord[0]/eq.scale.now-eq.margin.now[0])/40,(coord[1]/eq.scale.now-eq.margin.now[1])/40];
          elt.children=[node,child];
          eq.replace(node, elt);
        }
      }
      settings.action.helper.detach();
      settings.action.helper = 0;
    }
    else {
      // A NODE FROM THE EQUATION HAS BEEN MOVED INSIDE THE EQUATION
      if (settings.action.source==0) settings.action.node.elt[0].$svg.attr("class","val type0");
      eq.$svg.find("#over").attr("class","");
      var a         = false;    // AT THE END, REMOVE settings.action.node IF TRUE
      var helper    = true;     // AT THE END REMOVEE helper IF TRUE

      // THE VALUE HAS BEEN MOVED OVER ANOTHER VALUE
      if (settings.action.target) {
        // THE VALUE IS NOT A BRACKET FROM SOURCE
        if (settings.action.source==0) {
          var vnode     = parseInt(settings.action.node.value);
          var vtarget   = parseInt(settings.action.target.value);

          if (settings.action.target.parent==settings.action.node.parent && settings.action.target.parent.value!="/" &&
              settings.action.target.type!=c.user && settings.action.node.type!=c.user ) {
            // NODE AND SOURCE HAVE THE SAME PARENT (BUT NOT A DIVISION, WE DEAL WITH IT IN A MORE GENERIC WAY LATER)

            // MULTIPLICATION
            if (settings.action.target.parent.value=="*") {
              if (isNaN(vnode) && vtarget == -1) {
                if (settings.action.node.value[0]=='-')   { settings.action.target.value=settings.action.node.value.substr(1); }
                else                                      { settings.action.target.value="-"+settings.action.node.value; }
                a = true;
              } else
              if (vnode == -1 && isNaN(vtarget)) {
                if (settings.action.target.value[0]=='-') { settings.action.target.value=settings.action.target.value.substr(1); }
                else                                      { settings.action.target.value="-"+settings.action.target.value; }
                a = true;
              } else
              if (!isNaN(vnode) && !isNaN(vtarget))         { settings.action.target.value = (vnode*vtarget).toString(); a = true; }
            }
            else
            // ADDITION
            if (settings.action.target.parent.value=="+") {
              if (!isNaN(vnode) && !isNaN(vtarget))         { settings.action.target.value = (vnode+vtarget).toString(); a = true; }
              else if (isNaN(vnode) && isNaN(vtarget)) {
                var val1 = settings.action.node.value;      if (val1[0]=='-') { val1 = val1.substr(1); }
                var val2 = settings.action.target.value;    if (val2[0]=='-') { val2 = val2.substr(1); }
                if (settings.action.node.value!=settings.action.target.value && val1==val2) {
                  settings.action.target.value = 0; a=true;
                }
                else if (settings.action.node.value==settings.action.target.value) {
                  var mul = helpers.element();  mul.type  = c.val;  mul.value  = "2";
                  var elt = helpers.element();  elt.type  = c.op;   elt.value  = "*";
                  elt.children = [mul, settings.action.target];
                  elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                  mul.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                  eq.replace(settings.action.target, elt);
                  a=true;
                }
              }
            }
          }
          else {
            var operator = 0;

            // 1. REMOVE TWO SAME VALUES ON THE SAME DIVISION
            if (settings.action.node.value==settings.action.target.value) {
              var divnode   = eq.isindiv(settings.action.node);
              var divtarget = eq.isindiv(settings.action.target);

              for (var i in divnode) for (var j in divtarget) {
                if (divnode[i].node==divtarget[j].node && divnode[i].div!=divtarget[j].div) { operator = divnode[i].node; }
              }

              if (operator!=0) {
                settings.action.target.value = "1";
                settings.action.target.type  = c.val;
                settings.action.node.value   = "1";
                settings.action.node.type    = c.val;
                a = true;
                if (settings.action.node.div==div.numerator) { settings.action.node = settings.action.target; }
              }
            }

            // 2. INSERT INTO A BRACKET
            if (!operator && (settings.a.bracket || settings.a.all)) {
              // HANDLE INSERTION INTO A BRACKET
              var bratarget = settings.action.target;
              while (bratarget!=eq.tree && bratarget.type!=c.bra) { bratarget = bratarget.parent; }

              if (bratarget.type==c.bra) {
                // TRY TO INSERT THE VALUE NODE (OR ITS OWN BRACKET) INTO THE TARGET BRACKET
                var n = [ settings.action.node ];
                var branode = settings.action.node;
                while (branode!=eq.tree && branode.parent!=bratarget.parent) { branode = branode.parent; }
                if (branode.parent == bratarget.parent) { n.push(branode); }

                for (var i in n) {
                  if (!operator && n[i].parent==bratarget.parent) {
                    // FIND AN INSERT OF n[i] INTO BRATARGET
                    // COMPUTE POSITION
                    var pos = [-1,-1];
                    for (var j in bratarget.parent.children) {
                      if (bratarget.parent.children[j]==n[i])      { pos[0] = parseInt(j); } else
                      if (bratarget.parent.children[j]==bratarget) { pos[1] = parseInt(j); }
                    }

                    if (pos[0]!=-1 && pos[1]!=-1) {
                      var side = pos[0]>pos[1], isdiv = (n[i].parent.value=="/");

                      // IT IS JUST A MOVE
                      if ( n[i].parent.value == "+" || bratarget.children[0].value!="+" ) {
                        var elt = helpers.element();
                        elt.type = n[i].parent.type; elt.value = n[i].parent.value;
                        elt.origin = [bratarget.parent.elt[side?pos[0]-1:pos[0]].pos.now[0],
                                      bratarget.parent.elt[side?pos[0]-1:pos[0]].pos.now[1]];
                        eq.remove(n[i]);
                        eq.insert(elt, bratarget.children[0]);
                        if (side)  { elt.children= [elt.children[0], n[i]]; }
                        else       { elt.children= [n[i], elt.children[0]]; }
                        operator = true;
                      }
                      // IT IS A DISTRIBUTION FROM n[i]*(a+b+c), (a+b+c)*n[i] or (a+b+c)/n[i]
                      else if (!isdiv || side) {
                        // BROWSE EVERY CHILDREN OF THE BRATARGET
                        for (var j in bratarget.children[0].children) {
                          var elt = helpers.element();
                          elt.type = n[i].parent.type; elt.value = n[i].parent.value;
                          elt.origin = [bratarget.parent.elt[side?pos[0]-1:pos[0]].pos.now[0],
                                        bratarget.parent.elt[side?pos[0]-1:pos[0]].pos.now[1]];
                          var child = n[i].clone();
                          child.origin = [ n[i].elt[0].pos.now[0], n[i].elt[0].pos.now[1] ];
                          if (side)  { elt.children= [bratarget.children[0].children[j], child]; }
                          else       { elt.children= [child, bratarget.children[0].children[j]]; }
                          eq.replace(bratarget.children[0].children[j], elt);
                          elt.parent = bratarget.children[0];
                        }
                        eq.remove(eq.hide(n[i]));
                        operator = true;
                      }
                    }
                  }
                }
              }
            }

            // 3. ADD OR MULTIPLY A FRACTION (THE ACTION NODE MAY BE NOT BE FRACTION)
            if (!operator && (settings.a.fraction || settings.a.all)) {
              var n         = [ ];                      // ALL PARENTS OF THE ACTION NODE UNTIL THE TREE ROOT
              var t         = [ ];                      // ALL PARENTS OF THE TARGET NODE UNTIL A COMMON ANCESTOR WITH ACTION
              var common    = -1;                       // ID OF THE COMMON ANCESTOR IN THE N ARRAY
              var dnode     = settings.action.node;
              var dtarget   = settings.action.target;
              while (dnode!=0) { n.push(dnode); dnode = dnode.parent; }
              while (dtarget!=0 && common==-1)  {
                t.push(dtarget); for (var i in n) { if (dtarget==n[i]) { common=i; } } dtarget = dtarget.parent;
              }


              // TWO DIVISIONS ARE SEPARATED BY AN OPERATION (+ OR *)
              if (common>0 && t.length>2 && n.length>1 && t[t.length-2].value=='/') {
                // COMPUTE SIDE
                var pos    = [0,0];
                for (var i in n[common].children) {
                    if (n[common].children[i]==n[common-1])   pos[0] = i;
                    if (n[common].children[i]==t[t.length-2]) pos[1] = i;
                }
                var side   = (pos[0]<pos[1]);

                // MULTIPLICATION
                if (n[common].value=="*") {
                  var actionIsDiv = (n[common-1].value=='/');

                  // MULTIPLY NUMERATORS AND DENOMINATOR (IF ANY)
                  for (var i=0; i<(actionIsDiv?2:1); i++) {
                    var elt    = helpers.element();
                    elt.type   = c.op; elt.value = "*";
                    elt.origin = [n[common].elt[side?pos[0]:pos[0]-1].pos.now[0],
                                  n[common].elt[side?pos[0]:pos[0]-1].pos.now[1]];
                    var actelt = (actionIsDiv)?n[common-1].children[i]:n[common-1];
                    var tarelt = t[t.length-2].children[i];
                    if (side)  { elt.children= [actelt, tarelt]; }
                    else       { elt.children= [tarelt, actelt]; }
                    eq.remove(actelt);
                    eq.replace(tarelt, elt);
                  }
                  if (actionIsDiv) { n[common-1].children=[]; eq.remove(eq.hide(n[common-1])); }
                  operator = true;
                }
                // ADDITION (ACTION HAS TO BE A DIVISION)
                else if (n[common].value=="+" && n[common-1].value=='/' &&
                         eq.tree2value(n[common-1].children[1]) == eq.tree2value(t[t.length-2].children[1])) {
                    var elt    = helpers.element();
                    elt.type   = c.op; elt.value = "+";
                    if (side)  { elt.children= [n[common-1].children[0], t[t.length-2].children[0]]; }
                    else       { elt.children= [t[t.length-2].children[0], n[common-1].children[0]]; }
                    eq.remove(n[common-1].children[0]);
                    eq.replace(t[t.length-2].children[0], elt);
                    eq.remove(eq.hide(n[common-1].children[1]));
                    eq.remove(eq.hide(n[common-1]));
                    operator = true;
                }
              }
            }

            // 4. AUTOMATIC FACTORIZATION: MOVE AN UNKNOWN VALUE ON THE SAME UNKNOWN VALUE(Ex: 5*X+4*X)
            if (!operator && (settings.a.addition || settings.a.all)) {
              if (settings.action.node.value == settings.action.target.value &&
                  (isNaN(parseInt(settings.action.target.value))||settings.action.target.type==c.user) ) {
                var isOK    = true;
                var otarget = 0;
                var ptarget = settings.action.target.parent;
                if (ptarget.value=="*") {
                  ptarget = settings.action.target.parent.parent;
                  isOK = (settings.action.target.parent.children.length==2);
                  if (isOK) {
                    for (var i in settings.action.target.parent.children) {
                      if (settings.action.target.parent.children[i]!=settings.action.target) {
                        otarget = settings.action.target.parent.children[i];
                      }
                    }
                    isOK=(otarget && otarget.type==c.val && !isNaN(parseInt(otarget.value)));
                  }
                }

                var onode = 0;
                var pnode = settings.action.node.parent;
                if (isOK) {
                  if (pnode.value=="*") {
                    pnode = settings.action.node.parent.parent;
                    isOK = (settings.action.node.parent.children.length==2);
                    if (isOK) {
                      for (var i in settings.action.node.parent.children) {
                        if (settings.action.node.parent.children[i]!=settings.action.node) {
                          onode = settings.action.node.parent.children[i];
                        }
                      }
                      isOK=(onode && onode.type==c.val && !isNaN(parseInt(onode.value)));
                    }
                  }
                }

                isOK &= (pnode.value=='+' && pnode==ptarget);
                if (isOK) {
                  var value =  (otarget?parseInt(otarget.value):1)+(onode?parseInt(onode.value):1);
                  eq.remove(eq.hide(onode?settings.action.node.parent:settings.action.node));
                  var parent = settings.action.target.parent;
                  var mul = helpers.element();  mul.type  = c.val;  mul.value  = value;
                  var elt = helpers.element();  elt.type  = c.op;   elt.value  = "*";
                  elt.children = [mul, settings.action.target];
                  elt.origin = [settings.action.target.elt[0].pos.now[0], settings.action.target.elt[0].pos.now[1]];
                  mul.origin = [settings.action.target.elt[0].pos.now[0], settings.action.target.elt[0].pos.now[1]];
                  if (otarget) { eq.remove(settings.action.target); }
                  eq.replace(otarget?parent:settings.action.target, elt);
                  if (otarget) { eq.hide(parent); }

                  a = false;
                  operator = true;
                }
              }
            }

            // END OF THE PART 'THE VALUE HAS BEEN MOVED OVER ANOTHER VALUE'
          }
        }
        else {
          // ADD A BRACKET FROM THE SOURCE
          var vtarget = settings.action.target;
          if (settings.action.node.elt[0].$svg.attr("class").indexOf("bracket")!=-1) {
            if (vtarget.parent && vtarget.parent.type!=c.bra) {
              var elt = helpers.element();
              elt.type = c.bra; elt.value = '(';
              elt.origin=[settings.action.target.elt[0].pos.now[0],settings.action.target.elt[0].pos.now[1]];
              eq.insert(elt, vtarget);
            }
          }
          // SAVE AND REPLACE A NEW VARIABLE
          else if (settings.action.node.elt[0].$svg.attr("class").indexOf("newvar")!=-1) {
            // FIND THE PARENT BRACKET
            var elt=0;
            while (vtarget!=eq.tree && elt==0) { if (vtarget.type==c.bra) { elt = vtarget; } vtarget = vtarget.parent; }

            if (elt && elt.children[0].children.length) {
              var value     = eq.tree2value(elt.children[0]);
              var already   = false;
              for (var i in settings.sourcedef) { if (settings.sourcedef[i].value==value) { already = true;} }
              if (!already) { helpers.addSource($this,value, elt.children[0]); }
              eq.changeForUser(value);
            }
          }
        }
      }
      else {

        // NO TARGET SO WE ONLY LOOK AT THE MOVEMENT

        var $class = eq.$svg.find("#target").attr("class");
        if ($class) {
            if ($class.indexOf("left")!=-1 || $class.indexOf("right")!=-1) {
                // ADD *1 TO THE ELEMENT
                var elt = helpers.element();
                elt.type = c.op; elt.value = "*";
                elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                var child = helpers.element();
                child.type = c.val; child.value = "1";
                child.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                elt.children=($class.indexOf("right")!=-1)?[child,settings.action.node]:[settings.action.node,child];
                eq.replace(settings.action.node, elt);
                settings.action.node.parent = elt;
            }
            else if ($class.indexOf("top")!=-1 || $class.indexOf("bottom")!=-1) {
                if (settings.action.node.value=="1") {
                    // TRANSFORM 1 INTO A FRACTION (ENTER IN EMPTY MODE TO CHOOSE THE FRACTION VALUE)
                    var elt = helpers.element();
                    elt.type = c.div; elt.value = "/";
                    elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                    var child = helpers.element();
                    child.type = c.val; child.value = "";
                    child.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                    elt.children=[settings.action.node,child];
                    eq.replace(settings.action.node, elt);
                    settings.action.node.value = "";
                    settings.action.node.parent = elt; child.parent = elt; // IN THIS CASE, UPDATING THE PARENT IS MANDATORY
                    settings.emptymode = true;
                }
                else {
                    var branode = settings.action.node;
                    while (branode!=eq.tree && branode.type!=c.bra) { branode = branode.parent; }
                    if (branode.type==c.bra) {
                        var mult = ($class.indexOf("bottom")!=-1);
                        var divi = ($class.indexOf("top")!=-1);
                        if ( (branode.children[0].value =="+") &&
                             ( (mult && (settings.action.node.div==div.numerator||settings.action.node.div==div.root)) ||
                               (divi && settings.action.node.div==div.denominator)) ) {
                            var tofactorize = [];
                            for (var i in branode.children[0].children) {
                                var vals = eq.getvals(branode.children[0].children[i], mult);
                                for (var j in vals) {
                                    if (vals[j].value==settings.action.node.value && vals[j]!=branode.children[0].children[i] ) {
                                        tofactorize.push(vals[j]); break; }
                                }
                            }
                            if (tofactorize.length==branode.children[0].children.length) {
                                for (var i=0; i<tofactorize.length; i++) {
                                    if (i==0) {
                                        var elt = helpers.element();
                                        elt.type = mult?c.op:c.div; elt.value = mult?"*":"/";
                                        eq.remove(tofactorize[i]);
                                        elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                                        elt.children=mult?[tofactorize[i],branode]:[branode,tofactorize[i]];
                                        eq.replace(branode, elt);
                                    }
                                    else {
                                        eq.remove(eq.hide(tofactorize[i]));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        else {
          // NO TARGET NODE NOR TARGET ELEMENT... MAYBE A JUMP
          if (!settings.action.source && eq.tree.value=="=" && settings.action.fromleft !=(settings.action.coord[0]<eq.sep+eq.margin.now[0]) ) {
            if (settings.a.all || settings.a.jump) {
                var node = settings.action.node;
                var son  = 0;
                while (node.parent!=eq.tree) { son=node; node=node.parent; }
                  // JUMP OF UNIQUE VALUE IS NOT ALLOWED
                if (son && node.value=="+") {
                    eq.remove(son);
                    var elt = helpers.element(); elt.type = c.op; elt.value = "+";
                    elt.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];

                    if (son.type==c.val) {
                      if (son.value[0]=='-') {  son.value=son.value.substr(1); } else { son.value="-"+son.value; }
                      elt.children=[eq.tree.children[settings.action.fromleft?1:0],son];
                      eq.replace(eq.tree.children[settings.action.fromleft?1:0], elt);
                    }
                    else {
                      var min = helpers.element(); min.type = c.val; min.value = "-1";
                      min.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                      var mul = helpers.element(); mul.type = c.op; mul.value = "*";
                      mul.origin = [settings.action.node.elt[0].pos.now[0], settings.action.node.elt[0].pos.now[1]];
                      mul.children = [ min, son ];
                      elt.children=[eq.tree.children[settings.action.fromleft?1:0],mul];
                      eq.replace(eq.tree.children[settings.action.fromleft?1:0], elt);
                    }
                }
            }
          }
        }
      }

        if (a) { eq.remove(eq.hide(settings.action.node)); }

        if (helper) {
            settings.action.helper.detach();
            settings.action.helper = 0;
        }
    }
}


eq.$svg.find("#target").attr("class","");

}

helpers.equations.get($this).update($this);
helpers.equations.get($this).display(anim?500:0);
helpers.equations.get($this).label();


//----------------------------------------------
                            }
                        }
                        settings.action.node = 0;
                    });
                }

                if (!$this.find("#splashex").is(":visible")) { setTimeout(function() { $this[settings.name]('next'); }, 500); }
            }
        },
        element: function() {
            return { type : 0, value : "", children : [], elt: [], div:div.root, parent: 0, origin:[0,0],

            clone: function(_node) {
                if (!_node) { _node = this; }
                var ret     = helpers.element();
                ret.type    = _node.type;
                ret.value   = _node.value;
                ret.origin  = [ _node.origin[0], _node.origin[1]]
                for (var i in _node.children) { ret.children.push(this.clone(_node.children[i])); }
                for (var i in ret.children) { ret.children[i].parent = ret; }
                return ret;
            } }
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
            $svg        : 0,                            // SVG DATA (IF ANY)
            value       : "",                           // EQUATION WITH TEXT FORMAT
            sep         : 0,                            // SEPARATOR POSITION IF ANY (IN PIXEL FROM MARGIN.NOW[0])
            top         : 0,                            // TOP OFFSET OF THE EQUATION (IN PIXEL)
            tree        : {},                           // EQUATION ELEMENT TREE
            margin      : { now:[0,0], to:[0,0] },      // MARGIN OF THE EQUATION (IN PIXEL)
            scale       : { now:1, to:1 },              // SIZE OF THE EQUATION
            dist       : 5,                             // DISTANCE FROM THE RESULT

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
                if (_node.type==c.val || _node.type==c.user) {
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
                    var elt = helpers.element();
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
                            var child1 = this.process(_value.substr(0,pos), elt, div.numerator);
                            var child2 = this.process(_value.substr(pos+1), elt, div.denominator);
                            elt.children=[child1, child2];
                        }
                    }

                    // BRACKET
                    if (!done) {
                        if ((done=((_value[0]=='(')&&(_value[_value.length-1]==')')))) {
                            var elttmp = this.process(_value.substr(1,_value.length-2), elt, (_parent.type==c.div)?_div:div.root);
                            if (_parent.type==c.div || _value[1]=='-') { elt = elttmp; elt.parent = _parent; }
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
                            if (_node.value=="/" && (child.indexOf("+")!=-1 ||child.indexOf("/")!=-1 ||child.indexOf("*")!=-1 ) ) {
                                child="("+child+")"; }
                            ret += child;
                        }
                        break;
                    case c.bra: ret = "("+this.tree2value(_node.children[0])+")"; break;
                    case c.val: ret = (_node.value[0]=='-')?"("+_node.value+")":_node.value; break;
                    case c.user: ret = "("+_node.value+")"; break;
                }
                return ret.toString();
            },

            // INIT THE TREE
            init        : function($this) {
                this.tree = this.value2tree.process(this.value, 0, 0);
                if (this.value!=this.tree2value()) { this.value2tree.errors.push("Value error: "+this.tree2value()); }
                this.label();
                return (this.value2tree.errors.length==0);
            },

            label       : function() { this.value= this.tree2value(); if (this.$svg) { this.$svg.find(".label").text(this.value);} },

            display     : function(_anim) {
                var begin = 0;
                if (_anim) { var now = new Date(); begin=now.getTime(); }
                this.displayex(this.tree, begin, _anim , _anim?1:0);
            },
            displayex     : function(_node, _begin, _anim,_ratio) {
                var margin = [
                    this.margin.now[0]*_ratio+this.margin.to[0]*(1-_ratio),
                    this.margin.now[1]*_ratio+this.margin.to[1]*(1-_ratio)
                ]
                for (var i in _node.elt) {
                    _node.elt[i].$svg.attr("transform","translate("+
                        ((_node.elt[i].pos.now[0]*_ratio+_node.elt[i].pos.to[0]*(1-_ratio)) *40+margin[0])+","+
                        ((_node.elt[i].pos.now[1]*_ratio+_node.elt[i].pos.to[1]*(1-_ratio))*40+margin[1])+")");
                    if (_ratio==0) { _node.elt[i].pos.now = [ _node.elt[i].pos.to[0], _node.elt[i].pos.to[1] ]; }

                    if (_node.elt[i].scale) {
                        _node.elt[i].$svg.find(".scale").attr("transform","scale(1,"+
                            (_node.elt[i].scale.now*_ratio+_node.elt[i].scale.to*(1-_ratio)) +")");
                        if (_ratio==0) { _node.elt[i].scale.now =  _node.elt[i].scale.to; }
                    }
                }
                for (var i in _node.children) {
                    this.displayex(_node.children[i], _begin, _anim, _ratio);
                }
                if (_node==this.tree) {
                    var scale = this.scale.now*_ratio+this.scale.to*(1-_ratio);
                    this.$svg.find("#content").attr("transform","scale("+scale+")");

                    if (_node.value=="=") {
                        this.sep = (_node.elt[0].pos.now[0]*_ratio+_node.elt[0].pos.to[0]*(1-_ratio))*40;
                        this.$svg.find("#sep").attr("x1",(this.sep+margin[0])*scale).attr("x2",(this.sep+margin[0])*scale);
                    }
                    else { this.$svg.find("#sep").hide(); }

                    if (_anim && _ratio!=0) {
                        var now = new Date(); _ratio=(_begin+_anim-now.getTime())/_anim;
                        if (_ratio<0) { _ratio=0; }
                        var tree = this;
                        setTimeout( function() { tree.displayex(_node, _begin, _anim, _ratio); },1);
                    }
                    else {
                        this.scale.now = this.scale.to;
                        this.margin.now = [ this.margin.to[0], this.margin.to[1] ];
                    }
                }
            },

            // CHECK THE TREE VALIDITY AND UPDATE IF NECESSARY
            check       : function(_node) {
                if (!_node) { _node = this.tree; }

                // UPDATE THE DIV ATTRIBUTE (COULD BE IN UPDATE METHOD)
                if (!_node.parent || _node.parent.type==c.bra) { _node.div = div.root; } else
                if (_node.parent.type==c.div) { _node.div = (_node==_node.parent.children[0])?div.numerator:div.denominator; }
                else { _node.div = _node.parent.div; }

                // UPDATE PARENT VALUE
                for (var i in _node.children) { _node.children[i].parent=_node; }

                // OPERATION WITH SINGLE OPERAND
                if (_node.type==c.op  && _node.children.length==1) {
                    this.replace(_node, _node.children[0]); return this.check(_node.parent);
                }
                else if (_node.value=="*") {
                    var minus1 = [];
                    for (var i=0; i<_node.children.length; i++) {
                        if (_node.children[i].value=="+") {
                            // ADD BRACKET IF NEED
                            var elt = helpers.element();
                            elt.type = c.bra; elt.value = '(';
                            this.insert(elt, _node.children[i]);
                        }
                        else if (_node.children[i].value=="*") {
                            // MERGE TWO MULTIPLICATIONS
                            _node.origin = [_node.children[i].origin[0], _node.children[i].origin[1]];
                            var children = _node.children[i].children;
                            var elt      = _node.children[i].elt;
                            _node.children.splice(i, 1);
                            for (var j=children.length-1; j>=0; j--) {
                                _node.children.splice(i,0, children[j]);
                                // children[j].parent = _node;
                                if (j!=0) { if (elt.length) { _node.elt.splice(i,0, elt[j-1]); }
                                            else            { _node.elt.splice(i,0, 0);} }
                            }
                            return this.check(_node);
                        }
                        else if (_node.children[i].value=="-1") { minus1.push(_node.children[i]); }
                    }

                    // REMOVE TWO -1 INSIDE THE SAME MULTIPLICATION
                    if (minus1.length>=2 && _node.children.length>2) {
                        this.remove(this.hide(minus1[0]));
                        this.remove(this.hide(minus1[1]));
                    }
                }
                else if (_node.value=="+") {
                    for (var i=0; i<_node.children.length; i++) {
                        if (_node.children[i].value=="+") {
                            // MERGE TWO MULTIPLICATIONS
                            _node.origin = [_node.children[i].origin[0], _node.children[i].origin[1]];
                            var children = _node.children[i].children;
                            var elt      = _node.children[i].elt;
                            _node.children.splice(i, 1);
                            for (var j=children.length-1; j>=0; j--) {
                                _node.children.splice(i,0, children[j]);
                                // children[j].parent = _node;
                                if (j!=0) { if (elt.length) { _node.elt.splice(i,0, elt[j-1]); }
                                            else            { _node.elt.splice(i,0, 0);} }
                            }
                            return this.check(_node);
                        }
                    }
                }
                else if (_node.type==c.div) {
                    if (_node.children.length==1) {
                        this.replace(_node, _node.children[0]);
                        return this.check(_node.parent);
                    }

                    for (var i=0; i<2; i++) {
                        // ONE OF THE DIVISION CHILDREN IS ALSO A DIVISION
                        if (_node.children[i].value=="/") {
                            var other = _node.children[1-i];    // THE OTHER PART OF THE PARENT DIVISION

                            // GET THE TWO CHILDREN
                            var elt1 = _node.children[i].children[0], elt2 = _node.children[i].children[1];
                            this.remove(elt1); this.remove(elt2);

                            var elt = helpers.element();
                            elt.type = c.op; elt.value = "*";
                            elt.children = [ elt2, other ];

                            this.replace(other, elt);
                            // other.parent = elt; elt2.parent = elt;
                            this.replace(this.hide(_node.children[i]), elt1);

                            return this.check(_node);
                        }
                    }

                }

                // CHECK CHILDREN
                for (var i in _node.children) { this.check(_node.children[i]); }
            },

            // COMPUTE THE POSITION OF THE ELEMENTS
            update      : function($this, _node, _pos) {
                var settings    = helpers.settings($this);
                var ret         = [1,1,0.5];
                if (!_node) { this.check(); _node = this.tree; }
                if (!_pos)  { _pos = [0,0]; }

                switch(_node.type) {
                    case c.val : case c.user :
                        if (_node.elt.length==0) {
                            var elt = { $svg: $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("id", settings.nodes.length).appendTo(this.$svg.find("#content")),
                                        pos : { now:[_node.origin[0],_node.origin[1]], to:[_node.origin[0],_node.origin[1]] } };
                            elt.$svg.bind("mousedown touchstart", function(e) {
                                var $this=$(this).closest(".equation"), settings = helpers.settings($this);
                                settings.ratio = 640/$this.width();
                                if (settings.interactive) {
                                    var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                                                e.originalEvent.touches[0]:e;
                                    settings.action.client=[ve.clientX,ve.clientY];
                                    settings.action.pos=[ve.clientX,ve.clientY];
                                    settings.action.node=settings.nodes[$(this).attr("id")];
                                    var now = new Date();
                                    settings.action.time = now.getTime();
                                    settings.action.source = 0;
                                    settings.action.equation = 0;
                                    settings.action.helper = 0;
                                }
                                e.preventDefault();
                            });
                            _node.elt.push(elt);
                            settings.nodes.push(_node);
                        }
                        if (_node.value.length==0) { _node.elt[0].$svg.attr("class","val empty type"+_node.type); }
                        else                       { _node.elt[0].$svg.attr("class","val type"+_node.type); }
                        _node.elt[0].$svg.find("text").text(_node.value);
                        if (_node.value.length>2)  { _node.elt[0].$svg.find("text").attr("transform",
                                                        "scale("+(2/_node.value.length)+","+(2/_node.value.length)+")"); }
                        else                       { _node.elt[0].$svg.find("text").attr("transform","scale(1,1)"); }
                        _node.elt[0].pos.to = [_pos[0],_pos[1]];
                    break;
                    case c.op :
                        ret = [0,1,0];
                        var w = (_node.value=='*')?0.2:0.5;
                        var o = [(_node.value=='*')?0.39:0.25,(_node.value=='*')?0.28:0];
                        for (var i=0; i<_node.children.length; i++) {
                            if (i!=0) {
                                if (_node.elt.length<i || !_node.elt[i-1]) {
                                    var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                                pos : { now:[_node.origin[0],_node.origin[1]], to:[_node.origin[0],_node.origin[1]] } };
                                    elt.$svg.find("text").text(_node.value=='*'?'.':_node.value);
                                    if (_node.elt.length<i) { _node.elt.push(elt); } else { _node.elt.splice(i-1, 1, elt); }
                                }
                                _node.elt[i-1].pos.to = [_pos[0]+ret[0]-o[0],_pos[1]-o[1]];
                                ret[0]+=w;
                            }
                            var size=this.update($this, _node.children[i], [_pos[0]+ret[0], _pos[1]]);
                            ret[0]+=size[0]; if (size[1]>ret[1]) { ret[1] = size[1]; } if (size[2]>ret[2]) { ret[2] = size[2]; }
                        }
                        if (ret[1]>1 && _node.parent && _node.parent.value=="/") {
                            var offset = (_node.div==div.numerator)?ret[2]-ret[1]+0.5:ret[2]-0.5;
                            if (offset) { this.offset(_node, 0, offset); }
                        }
                    break;
                    case c.div :
                        var pos1=[_pos[0], _pos[1]-0.6], pos2=[_pos[0], _pos[1]+0.6];
                        var size1 = this.update($this, _node.children[0], [_pos[0],_pos[1]-0.6]);
                        var size2 = this.update($this, _node.children[1], [_pos[0],_pos[1]+0.6]);
                        var x = Math.max(size1[0], size2[0]);
                        if (size1[0]<size2[0])  {this.offset(_node.children[0], (size2[0]-size1[0])/2,0); }
                        else                    {this.offset(_node.children[1], (size1[0]-size2[0])/2,0); }

                        if (_node.elt.length==0) {
                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[_node.origin[0],_node.origin[1]], to:[_node.origin[0],_node.origin[1]] } };
                            _node.elt.push(elt);
                        }
                        _node.elt[0].$svg.find("line").attr("x2",40*(x-0.5));
                        _node.elt[0].pos.to = [_pos[0],_pos[1]];
                        ret=[x, size1[1]+size2[1]+0.2, size1[1]+0.1];
                    break;
                    case c.bra :
                        var size = this.update($this, _node.children[0], [_pos[0]+0.5,_pos[1]]);

                        if ( _node.elt.length==0) {
                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[_node.origin[0],_node.origin[1]], to:[_node.origin[0],_node.origin[1]] },
                                        scale: { now:1, to:1} };
                            elt.$svg.find("text").text("(");
                            elt.$svg.find(".scale").attr("transform","scale(1,"+size[1]+")");
                            _node.elt.push(elt);

                            var elt = { $svg : $("#template .val.type"+_node.type, settings.svg.root()).clone()
                                                    .attr("class","val type"+_node.type).appendTo(this.$svg.find("#content")),
                                        pos : { now:[_node.origin[0],_node.origin[1]], to:[_node.origin[0],_node.origin[1]] },
                                        scale: { now:1, to:1} };
                            elt.$svg.find("text").text(")");
                            elt.$svg.find(".scale").attr("transform","scale(1,"+size[1]+")");
                            _node.elt.push(elt);
                        }

                        _node.elt[0].pos.to = [_pos[0]-.25,_pos[1]+(size[1]/2-size[2])];
                        _node.elt[0].scale.to = size[1];
                        _node.elt[1].pos.to = [_pos[0]+size[0]+.25,_pos[1]+(size[1]/2-size[2])];
                        _node.elt[1].scale.to = size[1];

                        if (size[1]>1 && _node.parent && _node.parent.value=="/") {
                            var offset = (_node.div==div.numerator)?size[2]-size[1]+0.5:size[2]-0.5;
                            if (offset) { this.offset(_node, 0, offset); }
                        }

                        ret = [size[0]+1, size[1], size[2]];
                    break;
                }
                if (_node==this.tree) {
                    this.scale.to = Math.min((240-10)/(ret[1]*40),(540-10)/(ret[0]*40));
                    if (this.scale.to > settings.scalemax) { this.scale.to = settings.scalemax; }
                    this.margin.to = [ Math.floor((540/this.scale.to + (1-ret[0])*40)/2),
                                       Math.floor(ret[2]*40 + ( 240/this.scale.to - ret[1]*40)/2)];
                }

                return ret;
            },

            // IS A VALUE IN DIVISION : TRICKY BECAUSE IN a*(b/c), a IS INSIDE THE DIV (EVEN IF IT IS NOT REALLY THE CASE)
            isindiv: function(_node) {
                var ret = [];

                if (_node.parent.value=="/") { ret.push({node:_node.parent, div :_node.div }); }

                if (_node.parent.value=="*") {
                    if (_node.parent.parent && _node.parent.parent.value=="/") {
                        ret.push({node:_node.parent.parent, div : _node.parent.div });
                    }

                    for (var i in _node.parent.children) {
                        if (_node.parent.children[i].value=="/") { ret.push({node:_node.parent.children[i],div:div.numerator}); }
                    }
                }

                return ret;
            },

            dump : function(_node, _level) {
                var ret = "";
                if (!_node) { _node = this.tree; _level=0; ret = this.tree2value()+"\n";}
                for (var i=0; i<_level; i++) { ret+="  "; }
                ret += "["+_node.value+"] ("+_node.elt.length+"/"+_node.children.length+") ("+_node.div+")\n";
                for (var i in _node.children) { ret+=this.dump(_node.children[i], _level+1); }
                return ret;
            },

            // ADD AN OFFSET TO ALL CHILDREN OF NODE
            offset      : function(_node, _left, _top) {
                for (var i in _node.elt) { _node.elt[i].pos.to=[_node.elt[i].pos.to[0]+_left, _node.elt[i].pos.to[1]+_top]; }
                for (var i in _node.children) { this.offset(_node.children[i], _left, _top); }
            },

            // HIDE THE SVG ELEMENT
            hide       : function(_node) {
                for (var i in _node.elt) if (_node.elt[i].$svg) { _node.elt[i].$svg.detach(); }
                for (var i in _node.children) { this.hide(_node.children[i]); }
                return _node;
            },

            // REMOVE A NODE FROM ITS PARENT
            remove      : function(_node) {
                var pos = -1;
                for (var i in _node.parent.children) { if (_node.parent.children[i]==_node) { pos = parseInt(i); }}
                if (pos!=-1) {
                    if (pos==0 && _node.parent.type==c.div) {
                        var elt = helpers.element();
                        elt.type=c.val; elt.value="1";
                        if (_node.elt && _node.elt[0]) { elt.origin = [_node.elt[0].pos.now[0], _node.elt[0].pos.now[1]]; }
                        _node.parent.children[0] = elt;
                    }
                    else {
                        var last = _node.parent.elt.length-1;
                        if (last!=-1) {
                            if (_node.parent.elt[pos>last?last:pos].$svg) _node.parent.elt[pos>last?last:pos].$svg.hide();
                            _node.parent.elt.splice(pos>last?last:pos,1);
                        }

                        _node.parent.children.splice(pos,1);
                    }

                }
                else { alert("DEBUG : remove error ("+_node.parent.children.length+")"); }
                return _node;
            },

            // INSERT A NEW NODE
            insert      : function(_node, _source) {
                var pos = -1;
                for (var i in _source.parent.children) { if (_source.parent.children[i]==_source) { pos = parseInt(i); }}
                if (pos!=-1) {
                    _source.parent.children[pos] = _node;
                    _node.parent = _source.parent;
                    _node.children.push(_source);
                    _source.parent = _node;
                }
            },

            // REPLACE A NODE BY A NEW NODE
            replace     : function(_source, _dest) {
                if (_source==this.tree) {
                    _dest.parent = 0;
                    this.tree = _dest;
                }
                else {
                    var pos = -1;
                    for (var i=0; i<_source.parent.children.length; i++) {
                        if (_source.parent.children[i]==_source) { pos = parseInt(i); }}
                    if (pos!=-1) {
                        _dest.parent = _source.parent;
                        _source.parent.children[pos]=_dest;
                    }
                }
            },

            searchandreplace : function(_elt, _dest, _node) {
                if (!_node) { _node = this.tree; }
                if (_node.children.length) {
                    for (var i in _node.children) { this.searchandreplace(_elt, _dest, _node.children[i]); }
                }
                else {
                    if (_elt.type == _node.type && _elt.value == _node.value) {
                        this.replace(_node, _dest.clone());
                        this.hide(_node);
                    }
                }
            },

            changeForUser: function(_value, _node) {
                if (!_node) { _node = this.tree; }
                var current = this.tree2value(_node);
                if ( current==_value) {
                    var elt = helpers.element(); elt.type = c.user; elt.value = _value;
                    elt.origin = [_node.elt[0].pos.now[0], _node.elt[0].pos.now[1]];
                    var node = _node;
                    if (node.parent && node.parent.type == c.bra) { node = node.parent; }
                    this.replace(node, elt);
                    this.hide(node);
                }
                else if (_node.children.length && current.indexOf(_value)!=-1) {
                    for (var i in _node.children) { this.changeForUser(_value, _node.children[i]); }
                }
            },

            getvals: function(_node, _side) {
                var ret = [];
                if (_node.type==c.val || _node.type==c.user) {
                    if (_side && (_node.div==div.numerator || _node.div==div.root)) { ret.push(_node); } else
                    if (!_side && _node.div==div.denominator) { ret.push(_node); }
                }
                else {
                    for (var i=0; i<_node.children.length; i++) {
                        var check = (_node.children[i].type == c.val || _node.children[i].type == c.user ||
                                     _node.children[i].value=="*" || _node.children[i].value=="/");
                        if (check) {
                            var child = this.getvals(_node.children[i], _side);
                            for (var j in child) { ret.push(child[j]); }
                        }

                    }
                }
                return ret;
            }

        }},

        levenshtein: function distance(a,b) {
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
        },
        submit: function($this) {
            var settings    = helpers.settings($this);
            settings.interactive = false;

            // TO ENHANCE
            for (var i in settings.result) {
                var reg = (settings.result[i][0]=='|')?new RegExp(settings.result[i].substr(1,settings.result[i].length-2)):0;
                for (var j in settings.data) {
                    var d=5;
                    if (reg) { if (settings.data[j].value.match(reg,"g")) { d=0; } }
                    else     { d = helpers.levenshtein(settings.data[j].value, settings.result[i]); }

					d = Math.min(5,Math.floor(d*settings.errratio));
					
                    if (settings.data[j].dist == -1 || d<settings.data[j].dist) { settings.data[j].dist = d; }
                }
            }
            var total = 0;
            for (var j in settings.data) { total+=settings.data[j].dist;
                                           settings.data[j].$svg.attr("class", "equ s"+settings.data[j].dist); }
	
            settings.score=total>5?0:5-total;
            $this.find("#submit").addClass(total?"wrong":"good");

            setTimeout(function() { helpers.end($this)}, 1000);
        },
        addSource: function($this, _source, _elt) {
            var settings    = helpers.settings($this);
            var $val    = $("#template .val.type"+c.val, settings.svg.root()).clone().appendTo($("#source", settings.svg.root()));
            var vClass  ="";
            var id      = settings.sourcedef.length;
            if (!_source.length)    { vClass=" bracket"; }
            else if (_source=="!")  { vClass=" newvar"; _source="";}
            if (_elt!=0)            { vClass=" type3"; }
            $val.attr("transform","translate(40,"+(50+id*50)+")").attr("id",id).attr("class","val source"+vClass);
            $("text",$val).text(_source);
            if (_source.length>2) { $("text",$val).attr("transform","scale("+(2/_source.length)+","+(2/_source.length)+")"); }
            settings.sourcedef.push({elt: _elt, value: _source });

            $val.bind("mousedown touchstart", function(e) {
                var $this = $(this).closest(".equation"), settings = helpers.settings($this);
                settings.ratio = 640/$this.width();
                if (settings.interactive) {
                    var ve = (e && e.originalEvent && e.originalEvent.touches && e.originalEvent.touches.length)?
                            e.originalEvent.touches[0]:e;
                    var eq = helpers.equations.get($this);
                    var now= new Date();
                    settings.action.client      = [ve.clientX,ve.clientY];
                    settings.action.pos         = [ve.clientX,ve.clientY];
                    settings.action.node        = {elt:[{$svg:$(this), pos:{now:[-eq.margin.now[0]/40 - 1.1/eq.scale.now,
                                    (-eq.margin.now[1]-eq.top/eq.scale.now)/40+(1+1.25*parseInt($(this).attr("id")))/eq.scale.now]}}]};
                    settings.action.node.value  = $(this).find("text").text();
                    settings.action.node.type   = $(this).attr("class").indexOf("type"+c.user)!=-1?c.user:c.val;
                    settings.action.time        = now.getTime();
                    settings.action.source      = ($(this).find("text").text().length?1:2);
                    settings.action.helper      = 0;
                    settings.action.equation    = 0;
                }
                e.preventDefault();
            });
        }
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
                    emptymode       : false,                    // Need to fill an empty cell
                    action          : {                         // Touch parameter
                        equation    : 0,                        // Move an equation to another one (1: replace 2: addition)
                        source      : 0,                        // 0: from equation, 1: value from source, 2: operation from source
                        time        : 0,                        // Time of the mouse down
                        node        : 0,                        // Source node
                        target      : 0,                        // Authorized target node
                        helper      : 0,                        // Clone of the source nod
                        pos         : 0,                        // Position of origin
                        coord       : 0                         // Coordinate of the helper
                    },
                    sourcedef       : [],                       // Definition of the source (static or not)
                    ratio           : 1,                        // SVG pixel size/HTML pixel size
                    nodes           : []                        // List of value nodes
                };
                 // Check the context and send the load
                return this.each(function() {
                    var $this = $(this);
                    helpers.unbind($this);
                    this.onselectstart = function() { return false; }

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
                var settings = $(this).data("settings");
                settings.interactive=true;
            },
            quit: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.interactive = false;
                settings.context.onquit($this,{'status':'abort'});
            },
            submit: function() { helpers.submit($(this)); },
            dump: function() {
                var $this = $(this) , settings = helpers.settings($this);
                //alert(helpers.equations.get($this).dump());
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in equation plugin!'); }
    };
})(jQuery);

