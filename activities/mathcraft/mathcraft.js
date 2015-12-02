(function($) {
    // Activity default options
    var defaults = {
        name        : "mathcraft",                            // The activity name
        label       : "Mathcraft",                            // The activity label
        template    : "template.html",                          // Activity's html template
        css         : "style.css",                              // Activity's css style sheet
        lang        : "en-US",                                  // Current localization
        clean       : true,                                     // Clean board between exercices
        font        : 1,                                        // Exerice font
        errratio    : 1,                                        // Error weight
        onlyone     : false,                                    // Only one response possible : no commutativity
        number      : 1,                                        // number of exercices
        nbdec       : 2,                                        // number of dec for float numbers
        ntype       : 0,                                        // number display type
        glossary    : false,                                    // Glossary usage
        a           : false,                                    // Glossary authorization
        modif       : true,                                     // Editor modification
        debug       : false                                     // Debug mode
    };

    var regExp = [
        "\\\[b\\\]([^\\\[]+)\\\[/b\\\]",            "<b>$1</b>",
        "\\\[bb\\\](.+)\\\[/bb\\\]",                "<b>$1</b>",
        "\\\[i\\\]([^\\\[]+)\\\[/i\\\]",            "<i>$1</i>",
        "\\\[br\\\]",                               "<br/>",
        "\\\[blue\\\]([^\\\[]+)\\\[/blue\\\]",      "<span style='color:blue'>$1</span>",
        "\\\[red\\\]([^\\\[]+)\\\[/red\\\]",        "<span style='color:red'>$1</span>",
        "\\\[strong\\\](.+)\\\[/strong\\\]",        "<div class='strong'>$1</div>",
        "\\\[math\\\](.+)\\\[/math\\\]",            "<div class='math'><math>$1</math></div>",
        "\\\[mathxl\\\](.+)\\\[/mathxl\\\]",        "<div class='mathxl'><math>$1</math></div>"
    ];

    var ntype = { normal:0, scientific:1, physics:2 };

    var nodecounter = 0;
    var vocabulary  = 0;
    var actioncount = 0;
    var actiontmp   = 0;

    var action = {
        add:   {
            label:"+",    c:2, d:1,
            check: function(_node,_id) {
                var ret = helpers.node.filled(_node.children[_id]);
                if (_id==1) { ret = ret && (_node.children[1] && _node.children[1].type=="op" &&
                                ( _node.children[1].value=="eq" || _node.children[1].value=="gt" || _node.children[1].value=="lt" )); }
                return ret;
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    ret = helpers.node.create("n"+(nodecounter++));
                    ret.type = "op"; ret.value = _node.children[1].value;
                    for (var i=0; i<2; i++) {
                        var tmp = helpers.node.create("n"+(nodecounter++));
                        tmp.type = "op"; tmp.value="plus";
                        tmp.children.push(helpers.node.clone(_node.children[0]));
                        tmp.children.push(helpers.node.clone(_node.children[1].children[i]));
                        ret.children.push(tmp);
                    }
                }
                return ret;
            }
        },
        change: {
            label:"A", c:1,
            check: function(_node,_id) {
                return helpers.node.filled(_node.children[0]);
            },
            compute: function(_node) {
                var ret = helpers.node.create("n"+(nodecounter++)); helpers.node.extend(ret,_node);

                var done = false;
                if (_node.type=="op" && op[_node.value].p && (op[_node.value].p()&op.p.associative)) {
                    var children=[], val=0;
                    for (var i in _node.children) {
                        if (_node.children[i].type=="op" && _node.children[i].value==_node.value) {
                            val|=1<<i;
                            for (var j in _node.children[i].children) { children.push(_node.children[i].children[j]); }
                        }
                        else { children.push(_node.children[i]); }
                    }
                    if (children.length>2) {
                        done = true;
                        for (var j=0,i=1; j<2; j++) {
                            if (val&(j+1)) {
                                var tmp = helpers.node.create("n"+(nodecounter++)); helpers.node.extend(tmp,_node);
                                tmp.children.push(this.compute(children[i]));   i=(i+1)%children.length;
                                tmp.children.push(this.compute(children[i]));   i=(i+1)%children.length;
                                ret.children.push(tmp);
                            }
                            else {
                                ret.children.push(this.compute(children[i]));   i=(i+1)%children.length;
                            }
                        }
                    }
                }

                if (!done) { for (var i in _node.children) { ret.children.push(this.compute(_node.children[i])); } }

                return ret;
            },
            process: function(_node) { return (this.check(_node))?this.compute(_node.children[0]):0; }
        },
        cinteg:   {
            label:"C",    c:1,
            check: function(_node,_id) { return (helpers.node.filled(_node)?true:false); },
            compute: function(_node) {
                var ret = 0;
                if (_node.type=="op" && _node.value=="integ") {
                    ret = helpers.node.create("n"+(nodecounter++)); ret.type="op"; ret.value="mult";
                    ret.children.push(helpers.node.clone(_node.children[2]));
                    var tmp = helpers.node.create("n"+(nodecounter++)); tmp.type="op"; tmp.value="minus";
                    tmp.children.push(helpers.node.clone(_node.children[1]));
                    tmp.children.push(helpers.node.clone(_node.children[0]));
                    ret.children.push(tmp);
                }
                else {
                    ret = helpers.node.create("n"+(nodecounter++)); helpers.node.extend(ret,_node);
                    for (var i in _node.children) { ret.children.push(this.compute(_node.children[i])); }
                }
                return ret;
            },
            process: function(_node) { return (this.check(_node))?this.compute(_node.children[0]):0; }
        },
        eval:   {
            label:"=",    c:1,
            check: function(_node,_id) { return (helpers.node.filled(_node)?true:false); },
            compute: function(_node) {
            for (var i in _node.children) { action.eval.compute(_node.children[i]); }
                if (_node.type=="v") {
                    if (typeof(_node.value)=="number") { _node.tmp=[true,parseFloat(_node.value)]; }
                    else                               { _node.tmp=[false]; }
                }
                else if (_node.type=="op") {
                    var ok = true, children = [];
                    for (var i in _node.children) {
                        if (_node.children[i].tmp[0]) { children.push(_node.children[i].tmp[1]); } else { ok = false; } }
                    if (ok && op[_node.value].process) { _node.tmp=[true, op[_node.value].process(children)]; }
                    else                               { _node.tmp=[false]; }
                }
              },
              build: function(_node) {
                var ret = helpers.node.create("n"+(nodecounter++));
                if (_node.tmp[0]) { ret.type = "v"; ret.value = _node.tmp[1]; }
                else              { helpers.node.extend(ret,_node);
                                    for (var i in _node.children) { ret.children.push(action.eval.build(_node.children[i])); } }
                return ret;
              },
              process: function(_node) {
                action.eval.compute(_node);
                return action.eval.build(_node.children[0]);
              }
        },
        exnode: {
            label:"n", c:2, d:1,
            check: function(_node,_id) {
                var ret = helpers.node.filled(_node.children[_id]);
                if (_id==0) { ret = ret && (_node.children[0] && _node.children[0].type=="v" &&
                                            typeof(_node.children[0].value)=="number"); }
                return ret;
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    var value = parseInt(_node.children[0].value)-1;
                    if (value>=0 && value<_node.children[1].children.length) {
                        ret = helpers.node.clone(_node.children[1].children[value]);
                    }
                }
                return ret;
            }
        },
        inline: { label:"<img src='res/img/icon/geometry/line02.svg'/>", c:1,
            check : function(_node,_id) {
                return helpers.node.filled(_node) && (_node.children[0].type=="op") && (_node.children[0].value=="isin");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) {
                    var c = _node.children[0].children[1].value, v = _node.children[0].children[0].value;
                    if (actiontmp==c.value) { actioncount++; } actiontmp = c.value;
                    var value = [c, c[0]+v ];
                    if (actioncount%3==1) { value = [c, c[1]+v]; } else
                    if (actioncount%3==2) { value = [c[0]+v, c[1]+v ]; }
                    var tmp = {   type:"op", value:"eq", children:[
                            { type:"v", subtype:"line", value:value[0] }, { type:"v", subtype:"line", value:value[1] } ] };
                    ret = helpers.node.init(tmp);
                }
                return ret;
            },
        },
        med2perp: {
            label:"<img src='res/img/icon/geometry/mediator02.svg'/>", c:1,
            check : function(_node,_id) {
                return helpers.node.filled(_node) && (_node.children[0].type=="op") && (_node.children[0].value=="mediator");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node) ) { ret = helpers.node.clone(_node.children[0]); ret.value = "perp";
                                          ret.children[0].subtype = "line"; ret.children[1].subtype = "line"; }
                return ret;
            }
        },
        mid2d : { label:"<img src='res/img/icon/geometry/midpoint02.svg'/>", c:1,
            check : function(_node,_id) {
                return helpers.node.filled(_node) && (_node.children[0].type=="op") && (_node.children[0].value=="middle");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node) &&
                    _node.children[0].children[0].type=="v" && _node.children[0].children[0].value.length==1 &&
                    _node.children[0].children[1].subtype=="segment") {
                    var tmp = {   type:"op", value:"eq", children:[
                            { type:"v", value: _node.children[0].children[0].value+_node.children[0].children[1].value[0]} ,
                            { type:"v", value: _node.children[0].children[0].value+_node.children[0].children[1].value[1]} ] };
                    ret = helpers.node.init(tmp);
                }
                return ret;
            }
        },
        mid2in: { label:"<img src='res/img/icon/geometry/midpoint02.svg'/>", c:1, check:function(_node,_id) { return action.mid2d.check(_node,_id);},
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) { ret = helpers.node.clone(_node.children[0]); ret.value="isin"; }
                return ret;
            }
        },
        mid2par: {
            label:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", c:2,
            check: function(_node,_id) {
                return helpers.node.filled(_node.children[_id]) &&  _node.children[_id] &&
                       (_node.children[_id].type=="op") && (_node.children[_id].value=="middle");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    if (_node.children[0].children[0].type=="v" && _node.children[0].children[0].value.length==1 &&
                        _node.children[1].children[0].type=="v" &&
                        _node.children[0].children[0].value == _node.children[1].children[0].value &&
                        _node.children[0].children[1].subtype=="segment" && _node.children[1].children[1].subtype=="segment" &&
                        _node.children[0].children[1].value.indexOf(_node.children[1].children[1].value[0])==-1 &&
                        _node.children[0].children[1].value.indexOf(_node.children[1].children[1].value[1])==-1 ) {
                        ret = helpers.node.create("n"+(nodecounter++));
                        ret.type = "op"; ret.value = "parallelogram";

                        var v1 = _node.children[0].children[1].value, v2 = _node.children[1].children[1].value;
                        var tmp = helpers.node.create("n"+(nodecounter++));
                        tmp.type = "v"; tmp.value = v1[0]+v2[0]+v1[1]+v2[1];
                        ret.children.push(tmp);
                    }
                }
                return ret;
            }
        },
        mids2med : {
            label:"<img src='res/img/icon/geometry/mediator02.svg'/>", c:2,
            check: function(_node,_id) {
                return helpers.node.filled(_node.children[_id]) &&  _node.children[_id] &&
                       (_node.children[_id].type=="op") && (_node.children[_id].value=="eq");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    var vOk = true, v=[0,0,0,0], p;
                    for (var i=0; i<2; i++) {
                        if (_node.children[i].children[0].value.length==2 && _node.children[i].children[1].value.length==2 )
                        {
                            if ((p=_node.children[i].children[1].value.indexOf(_node.children[i].children[0].value[0]))!=-1) {
                                v[i*2] = _node.children[i].children[0].value[0];
                                v[i*2+1] = _node.children[i].children[0].value[1]+_node.children[i].children[1].value[1-p];
                            }
                            else if ((p=_node.children[i].children[1].value.indexOf(_node.children[i].children[0].value[1]))!=-1) {
                                v[i*2] = _node.children[i].children[0].value[1];
                                v[i*2+1] = _node.children[i].children[0].value[0]+_node.children[i].children[1].value[1-p];
                            }
                            else vOk = false;
                        }
                    }
                    if (vOk && (v[0]!=v[2]) && (v[1]==v[3] || v[1]==v[3][1]+v[3][0])) {
                        var tmp = {   type:"op", value:"mediator", children:[
                            { type:"v", subtype:"line", value: v[0]+v[2] },
                            { type:"v", subtype:"segment", value: v[1] }
                        ] };
                        ret = helpers.node.init(tmp);
                    }
                }
                return ret;
            }
        },
        mult:   {
            label:"*",    c:2, d:1,
            check: function(_node,_id) {
                var ret = helpers.node.filled(_node.children[_id]);
                if (_id==1) { ret = ret && (_node.children[1] && _node.children[1].type=="op" &&
                                ( _node.children[1].value=="eq" || _node.children[1].value=="gt" || _node.children[1].value=="lt" )); }
                return ret;
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    ret = helpers.node.create("n"+(nodecounter++));
                    ret.type = "op"; ret.value = _node.children[1].value;
                    if (_node.children[0].type=="v" && typeof(_node.children[0].value)=="number" && _node.children[0].value<0) {
                        if (ret.value=="gt") { ret.value="lt"; } else if (ret.value=="lt") { ret.value="gt"; }
                    }
                    for (var i=0; i<2; i++) {
                        var tmp = helpers.node.create("n"+(nodecounter++));
                        tmp.type = "op"; tmp.value="mult";
                        tmp.children.push(helpers.node.clone(_node.children[0]));
                        tmp.children.push(helpers.node.clone(_node.children[1].children[i]));
                        ret.children.push(tmp);
                    }
                }
                return ret;
            }
        },
        par2par: {
            label:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", c:2,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[_id]) && _node.children[_id].type=="op" && _node.children[_id].value=="par");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    if (_node.children[0].children[0].value != _node.children[1].children[0].value &&
                        _node.children[0].children[0].value != _node.children[1].children[1].value &&
                        _node.children[0].children[0].value.length == 2 &&
                        _node.children[0].children[1].value.length == 2 &&
                        _node.children[1].children[0].value.length == 2 &&
                        _node.children[0].children[1].value.length == 2 &&
                        _node.children[0].children[0].value.indexOf(_node.children[0].children[1].value[0])==-1 &&
                        _node.children[0].children[0].value.indexOf(_node.children[0].children[1].value[1])==-1 ) {

                        var value = _node.children[0].children[0].value + _node.children[0].children[1].value +
                                    _node.children[0].children[0].value[0];
                        if (value.indexOf(_node.children[1].children[0].value[0]+_node.children[1].children[0].value[1]) == -1 &&
                            value.indexOf(_node.children[1].children[0].value[1]+_node.children[1].children[0].value[0]) == -1 ) {
                            value = _node.children[0].children[0].value + _node.children[0].children[1].value[1] +
                                    _node.children[0].children[1].value[0] +_node.children[0].children[0].value[0];
                        }

                        var vOk = true;
                        for (var i=0; i<2; i++) {
                            if (value.indexOf(_node.children[1].children[i].value[0]+_node.children[1].children[i].value[1]) == -1 &&
                                value.indexOf(_node.children[1].children[i].value[1]+_node.children[1].children[i].value[0]) == -1 ) {
                                    vOk = false;
                            }
                        }
                        if (vOk) {
                            var tmp = {   type:"op", value:"parallelogram", children:[{ type:"v", value: value.substr(0,4) } ] };
                            ret = helpers.node.init(tmp);
                        }
                    }

                }
                return ret;
            }
        },
        par2pars: {
            label:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", c:1,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[0]) &&
                        _node.children[0].type=="op" && _node.children[0].value=="parallelogram");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) {
                    if (_node.children[0].children[0].value.length == 4 ) {
                        var c = _node.children[0].children[0].value;
                        if (actiontmp==c) { actioncount++; } actiontmp = c;
                        var tmp = {   type:"op", value:"par", children:[
                                        { type:"v", subtype:"line", value: c[0+actioncount%2]+c[1+actioncount%2] },
                                        { type:"v", subtype:"line", value: c[(3+actioncount%2)%4]+c[2+actioncount%2] } ] };
                        ret = helpers.node.init(tmp);
                    }
                }
                return ret;
            }
        },
        par2rect: {
            label:"<img src='res/img/icon/geometry/rectangle02.svg'/>", c:2,
            check: function(_node, _id) {
                var ret = (helpers.node.filled(_node.children[_id]) && _node.children[_id].type=="op" &&
                           _node.children[_id].value==(_id?"perp":"parallelogram"));
                return ret;
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)&&
                    _node.children[0].children[0].value.length == 4 &&
                    _node.children[1].children[0].value.length == 2 &&
                    _node.children[1].children[1].value.length == 2 &&
                    _node.children[1].children[0].value != _node.children[1].children[1].value ) {
                    var value = _node.children[0].children[0].value + _node.children[0].children[0].value[0];
                    var vOk = true;
                    for (var i=0; i<2; i++) {
                        if (value.indexOf(_node.children[1].children[i].value[0]+_node.children[1].children[i].value[1]) == -1 &&
                            value.indexOf(_node.children[1].children[i].value[1]+_node.children[1].children[i].value[0]) == -1 ) {
                                vOk = false;
                        }
                    }

                    if ( _node.children[1].children[0].value.indexOf(_node.children[1].children[1].value[0])== -1 &&
                         _node.children[1].children[0].value.indexOf(_node.children[1].children[1].value[1])== -1 ) { vOk = false; }

                    if (vOk) { ret = helpers.node.clone(_node.children[0]); ret.value="rectangle"; }
                }
                return ret;
            }
        },
        par3: {
            label:"<img src='res/img/icon/geometry/parallel02.svg'/>", c:2,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[_id]) && _node.children[_id].type=="op" && _node.children[_id].value=="par");
            },
            compute: function(_node, _value) {
                var ret = 0, same=0;
                for (var i=0; i<2; i++) for (var j=0; j<2; j++) {
                    var c1 = _node.children[0].children[i], c2 = _node.children[1].children[j];
                    if (c1.type=="v" && c2.type=="v" &&
                        ( c1.value == c2.value || ( c2.value.length==2 && c1.value == c2.value[1]+c2.value[0] ) ) ) { same = [i,j]; }
                }
                if (same) {
                    ret = helpers.node.create("n"+(nodecounter++));
                    ret.type = "op"; ret.value = _value;

                    ret.children.push(helpers.node.clone(_node.children[0].children[1-same[0]]));
                    ret.children.push(helpers.node.clone(_node.children[1].children[1-same[1]]));
                }
                return ret;
            },
            process: function(_node) { return (this.check(_node,0)&&this.check(_node,1))?action.par3.compute(_node,"par"):0; }
        },
        parid: {
            label:"<img src='res/img/icon/geometry/parallel02.svg'/>", c:1,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[0]) && _node.children[0].type=="op" && _node.children[0].value=="par");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) {
                    if (_node.children[0].children[0].value.length == 2 &&
                        _node.children[0].children[1].value.length == 2 &&
                        ( _node.children[0].children[1].value.indexOf(_node.children[0].children[0].value[0])!=-1 ||
                          _node.children[0].children[1].value.indexOf(_node.children[0].children[0].value[1])!=-1 ) ) {
                        ret = helpers.node.clone(_node.children[0]);
                        ret.value = "eq";
                    }
                }
                return ret;
            }
        },
        perp2: {
            label:"<img src='res/img/icon/geometry/perpendicular02.svg'/>", c:2,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[_id]) && _node.children[_id].type=="op" && _node.children[_id].value=="perp");
            },
            process: function(_node) { return (this.check(_node,0)&&this.check(_node,1))?action.par3.compute(_node,"par"):0; }
        },
        pperp: {
            "label":"<img src='res/img/icon/geometry/parperp02.svg'/>", c:2,
            check: function(_node, _id) {
                return (helpers.node.filled(_node.children[_id]) && _node.children[_id].type=="op" &&
                        _node.children[_id].value==(_id?"perp":"par"));
            },
            process: function(_node) { return (this.check(_node,0)&&this.check(_node,1))?action.par3.compute(_node,"perp"):0; }
        },
        pythagore:    {
            label:"&Pi;", c:1,
            check: function(_node,_id) {
                return (helpers.node.filled(_node) && _node.children[0].type=="op" && _node.children[0].value=="perp");
            },
            process: function(_node) {
                var ok = false;
                if (this.check(_node)) {
                    var ab = _node.children[0].children[0];
                    var ac = _node.children[0].children[1];
                    if (ab.type=="v" && ab.value.length==2 && typeof(ab.value)!="number" &&
                        ac.type=="v" && ac.value.length==2 && typeof(ac.value)!="number") {
                        var pab = 0, pac = ac.value.indexOf(ab.value[pab]);
                        if (pac==-1) { pab = 1; pac = ac.value.indexOf(ab.value[pab]); }
                        if (pac!=-1) {
                            var pythagore = {   type:"op", value:"eq", children:[
                                                  { type:"op", value:"pow", children:[
                                                      { type:"v", value:ab.value[1-pab]+ac.value[1-pac] } ,
                                                      { type:"v", value:2 }
                                                    ]
                                                  },
                                                  { type:"op", value:"plus", children:[
                                                      { type:"op", value:"pow", children:[
                                                        { type:"v", value:ab.value[pab]+ac.value[1-pac] } ,
                                                        { type:"v", value:2 }
                                                        ]
                                                      },
                                                      { type:"op", value:"pow", children:[
                                                        { type:"v", value:ab.value[1-pab]+ac.value[pac] } ,
                                                        { type:"v", value:2 }
                                                        ]
                                                      }
                                                    ]
                                                  }
                                                ]
                                            };
                            ret = helpers.node.init(pythagore);
                            ok = true;
                        }
                    }
                }
                if (!ok) { ret = 0; }
                return ret;
            }
        },
        replace:    {
            label:"R", c:2, d:1,
            check: function(_node,_id) {
                var ret = helpers.node.filled(_node.children[_id]);
                if (_id==0) { ret = ret && (_node.children[0] && _node.children[0].type=="op" && _node.children[0].value=="eq"); }
                return ret;
            },
            compute: function(_node, _from, _to) {
                var ret;
                if (helpers.node.equal(_node, _from)) { ret = helpers.node.clone(_to); }
                else {
                    ret = helpers.node.create("n"+(nodecounter++));
                    helpers.node.extend(ret,_node);
                    for (var i in _node.children) { ret.children.push(action.replace.compute(_node.children[i], _from, _to)); }
                }
                return ret;
            },
            process: function(_node) {
                if (this.check(_node,0)&&this.check(_node,1)) {
                    var from = _node.children[0].children[0];
                    var to   = _node.children[0].children[1];
                    ret = action.replace.compute(_node.children[1], from, to);
                }
                else { ret = 0; }
                return ret;
            }
        },
        rtriangle: {
            label:"<img src='res/img/icon/geometry/rtriangle02.svg'/>", c:1,
            check: function(_node,_id) {
                return (helpers.node.filled(_node) && _node.children[0].type=="op" && _node.children[0].value=="perp");
            },
            process: function(_node) {
                var ok = false;
                if (this.check(_node)) {
                    var ab = _node.children[0].children[0];
                    var ac = _node.children[0].children[1];
                    if (ab.type=="v" && ab.value.length==2 && typeof(ab.value)!="number" &&
                        ac.type=="v" && ac.value.length==2 && typeof(ac.value)!="number") {
                        var pab = 0, pac = ac.value.indexOf(ab.value[pab]);
                        if (pac==-1) { pab = 1; pac = ac.value.indexOf(ab.value[pab]); }
                        if (pac!=-1) {
                            var tmp = {   type:"op", value:"rtriangle", children:[
                                                  { type:"v", value:ab.value[pab]+ab.value[1-pab]+ac.value[1-pac] } ,
                                                  { type:"v", value:ab.value[pab] }
                                             ]};
                            ret = helpers.node.init(tmp);
                            ok = true;
                        }
                    }
                }
                if (!ok) { ret = 0; }
                return ret;
            }
        },
        swap: {
            label:"&lsaquo;&rsaquo;", c:1,
            check: function(_node,_id) {
                return helpers.node.filled(_node.children[0]) &&
                       (_node.children[0] && _node.children[0].type=="op" &&
                       op[_node.children[0].value].p && (op[_node.children[0].value].p()&op.p.commutative));
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) {
                    ret = helpers.node.create("n"+(nodecounter++));
                    helpers.node.extend(ret,_node.children[0]);
                    ret.children.push(helpers.node.clone(_node.children[0].children[1]));
                    ret.children.push(helpers.node.clone(_node.children[0].children[0]));
                }
                return ret;
            }
        },
        tomid : {
            label:"<img src='res/img/icon/geometry/midpoint02.svg'/>", c:2,
            check: function(_node,_id) {
                return helpers.node.filled(_node.children[_id]) && (_node.children[_id].type=="op") &&
                       (_node.children[_id].value==_id?"eq":"isin");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check(_node,0)&&this.check(_node,1)) {
                    var m = _node.children[0].children[0].value;
                    var a = [ _node.children[0].children[1].value[0], _node.children[0].children[1].value[1] ];
                    var vOk = (_node.children[1].children[0].value!=_node.children[1].children[1].value);

                    for (var i=0; i<2; i++) {
                        vOk = vOk && ( _node.children[1].children[i].value==m+a[0] ||
                                       _node.children[1].children[i].value==a[0]+m ||
                                       _node.children[1].children[i].value==m+a[1] ||
                                       _node.children[1].children[i].value==a[1]+m );
                        vOk = vOk && (_node.children[1].children[0].value.indexOf(a[i])!=-1 ||
                                      _node.children[1].children[1].value.indexOf(a[i])!=-1 );
                    }

                    if (vOk) {
                        ret = helpers.node.clone(_node.children[0]);
                        ret.value="middle";
                    }
                }
                return ret;
            }
        }
    };

    var op = {
        p: { final:1, commutative :2, associative:4 },
        abs:    { label:"abs",  l:.6,   c:1, m:"<mo>|</mo>c0<mo>|</mo>",                                t:"|c0|",
                  process:function(_children) { return Math.abs(_children[0]); } },
        complex: { label:"&copy;", c:2,
            needbracket:function(_node) {
                ret = [false, false];
                if (_node.children&&_node.children[1]&&_node.children[1].type=="op")
                    if (_node.children[1].value=="plus"||_node.children[1].value=="minus")
                        ret[1]=true;
                return ret;
            },
            m:function(_node) {
                var ret=["c0","c1","<mo>+</mo><mi>i</mi><mo>*</mo>"];
                var bra=op.complex.needbracket(_node);
                for (var i=0; i<2; i++) if (bra[i]) { ret[i] = "<mo>(</mo>c"+i+"<mo>)</mo>"; }
                return ret[0]+ret[2]+ret[1];
            },
            t:function(_node) {
                var bra=op.complex.needbracket(_node);
                var val=[bra[0]?"(c0)":"c0", bra[1]?"(c1)":"c1"];
                return val[0]+"+i*"+val[1] ;
            }
        },
        cos:    { label:"cos",  l:.6,   c:1, m:"<mi>cos</mi><mo>&#x2061;</mo><mo>(</mo>c0<mo>)</mo>",   t:"cos(c0)",
                  process:function(_children) { return Math.cos(_children[0]); } },
        div:    { label:"/",            c:2, m:"<mfrac><mrow>c0</mrow><mrow>c1</mrow></mfrac>",
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
            },
            process:function(_children) { return _children[0]/_children[1]; }
        },
        eq :    { label:"=", c:2, m:"c0<mo>=</mo>c1", t:["c0=c1","c1=c0"], p:function() { return op.p.commutative | op.p.associative; } },
        gt :    { label:">", c:2, m:"c0<mo>&gt;</mo>c1", t:["c0>c1","c1<c0"] },
        ident:  { label:"",  c:1, m:"c0", t:"c0", process:function(_children) { return _children[0]; } },
        integ:  { label:"&int;", c:3, d:2,
                  m:function(_node) { return "<msubsup><mo>&int;</mo><mrow>c0</mrow><mrow>c1</mrow></msubsup><mrow>c2"+
                                             "<mo>&InvisibleTimes;</mo><mrow><mi>d</mi><mi>"+_node.subtype+"</mi></mrow>"; },
                  t:function(_node) { return "int"+_node.subtype+"(c0,c1,c2)"; } },
        isin:   { label:"&isin;", c:2, m:"c0<mo>&isin;</mo>c1", t:"c0∈c1" },
        lt :    { label:"<", c:2, m:"c0<mo>&lt;</mo>c1", t:["c0<c1","c1>c0"] },
        mediator: { label:"<img src='res/img/icon/geometry/mediator01.svg'/>", c:2,
                  m:function() { return "c0<mtext mathsize='big'>"+(vocabulary?vocabulary.mediator:"mediator")+"</mtext>c1" },
                  t:"mediator(c0,c1)" },
        middle: { label:"<img src='res/img/icon/geometry/midpoint01.svg'/>", c:2,
                  m:function() { return "c0<mtext mathsize='big'>"+(vocabulary?vocabulary.middle:"middle")+"</mtext>c1" },
                  t:"mid(c0,c1)" },
        minus:  { label:"-", c:2,
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
            },
            process:function(_children) { return _children[0]-_children[1]; }
        },
        mult:   { label:"*", c:2, p:function() { return op.p.commutative | op.p.associative; },
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
            },
            process:function(_children) { return _children[0]*_children[1]; }
        },
        neg:  { label:"-", c:1,
            needbracket:function(_node) {
                ret = false;
                if (_node.children&&_node.children[0]&&_node.children[0].type=="op")
                    if (_node.children[0].value=="plus"||_node.children[0].value=="minus")
                        ret=true;
                return ret;
            },
            m:function(_node) { return "<mo>-</mo>"+(op.neg.needbracket(_node)?"<mo>(</mo>c0<mo>)</mo>":"c0"); },
            t:function(_node) { return "-"+(op.neg.needbracket(_node)?"(c0)":"c0"); },
            process:function(_children) { return -_children[0]; }
        },

        par:    { label:"//", c:2, m:"c0<mo>//</mo>c1", t:["par(c0,c1)","par(c1,c0)"], p:function() { return op.p.commutative | op.p.associative; } },
        parallelogram:  { label:"<img src='res/img/icon/geometry/parallelogram01.svg'/>", c:1,
                  m:function() { return "<mover><mrow><mtext mathsize='big'>"+(vocabulary?vocabulary.parallelogram:"parallelogram")+
                                        "</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"parallelogram(c0)", p:function() { return op.p.final; } },
        perp:   { label:"&perp;", c:2, m:"c0<mo>&perp;</mo>c1", t:["perp(c0,c1)","perp(c1,c0)"], p:function() { return op.p.commutative; } },
        plus:   { label:"+", c:2, m:"c0<mo>+</mo>c1", t:["c0+c1","c1+c0"], p:function() { return op.p.commutative | op.p.associative; },
                  process:function(_children) { return _children[0]+_children[1]; } },
        pow:    { label:"^", c:2,
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
            },
            process:function(_children) { return Math.pow(_children[0],_children[1]); }
        },
        rectangle:  { label:"<img src='res/img/icon/geometry/rectangle01.svg'/>", c:1,
                  m:function() { return "<mover><mrow><mtext mathsize='big'>"+(vocabulary?vocabulary.rectangle:"rectangle")+
                                        "</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"rectangle(c0)", p:function() { return op.p.final; } },
        rtriangle: { label:"<img src='res/img/icon/geometry/rtriangle01.svg'/>", c:2,
                  m:function() { return "<mover><mrow><mtext mathsize='small'>"+(vocabulary?vocabulary.rtriangle:"rtriangle")+
                                        " c1</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"rtriangle(c0,c1)", p:function() { return op.p.final; } }
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
            for (var i=0; i<21; i++) {
                var vReg = new RegExp("\\\["+(i+1)+"\\\](.+)\\\[/"+(i+1)+"\\\]", "g");
                _text = _text.replace(vReg,"<span class='data' id='d"+i+"'>$1</span>");
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

                // Build panel droppable
                $this.find("#editor").droppable({accept:".a.op,.a.action,.a.tree",
                    drop:function(event, ui) {
                        helpers.node.editor.addroot($this, parseInt($(ui.draggable).attr("id"))); }
                });

                $this.find("#editor").bind("mousedown touchstart", function(event) {
                    if ($(this).children().first().html().length) {
                        $this.find("#clear").css("opacity",0).show().animate({opacity:1},500);
                        if (settings.timers.clear) { clearTimeout(settings.timers.clear); }
                        settings.timers.clear = setTimeout(function() { $this.find("#clear")
                            .animate({opacity:0},500, function() { $(this).hide(); }); }, 2000);
                    }
                    if (settings.glossary && (!settings.root || settings.root.type!="action")) {
                        $this.find("#glossary").css("opacity",0).show().animate({opacity:1},500);
                        if (settings.timers.glossary) { clearTimeout(settings.timers.glossary); }
                        settings.timers.glossary = setTimeout(function() { $this.find("#glossary")
                            .animate({opacity:0},500, function() { $(this).hide(); }); }, 2000);
                    }
                    event.preventDefault();
                });

                vocabulary = settings.locale.vocabulary;

                // BUILD THE GLOSSARY
                var vIsValid = function(_a, _id) {
                    var ret = _a?false:true;
                    if (!ret) { for (var i in _a) { if (_a[i]==_id) ret = true; } }
                    return ret;
                }
                $this.find("#book #b").html("");
                for (var i in settings.locale.databook) {
                    var e=settings.locale.databook[i], vTValid=vIsValid(settings.a,"t"+e.id);
                    var $html=$("<h1 id='t"+i+"' class='"+(vTValid?" valid":" disabled")+"'>"+e.t+"</h1>");
                    $this.find("#book #b").append($html);
                    $html.bind("mousedown touchstart", function(event) {
                      if (!$(this).hasClass("disabled")) {
                        var vId = parseInt($(this).attr("id").substr(1));
                        if ($(this).hasClass("s")) {
                            $(this).removeClass("s");
                            $this.find("#book #b h2.t"+vId).animate({"margin-left":"-20em"},500,function() { $(this).hide(); } );
                            setTimeout(function() {
                                $this.find("#book #b h1").each(function(_index) {
                                    if (_index!=vId) { $(this).show().animate({"margin-left":"-0.5em"},500); }
                                });
                            }, 500);
                        }
                        else {
                            $(this).addClass("s");
                            $this.find("#book #b h1").each(function(_index) {
                                if (_index!=vId) { $(this).animate({"margin-left":"-16em"},500,function() { $(this).hide(); }); }
                            });
                            setTimeout(function() {
                                $this.find("#book #b h2.t"+vId).css("margin-left","-20em").show().animate({"margin-left":"-0.5em"},500);
                                }, 500);
                        }
                      }
                      event.preventDefault();
                    });

                    if (e.c) for (var j in e.c) {
                        var vBValid=vTValid&vIsValid(settings.a,"b"+e.c[j].id);
                        var $html2 = $("<h2 id='b"+e.c[j].id+"' class='t"+i+(vBValid?" valid":" disabled")+"'>"+e.c[j].t+"</h2>");
                        $this.find("#book #b").append($html2);
                        $html2.bind("mousedown touchstart", function(event) {
                          if (!$(this).hasClass("disabled")) {
                            var vId = parseInt($(this).attr("class").substr(1));
                            var vBook = parseInt($(this).attr("id").substr(1));
                            if ($(this).hasClass("s")) {
                                $(this).removeClass("s");
                                settings.mathmlup.action=0; helpers.node.mathml($this);
                                $this.find("#book #b #list").animate({"opacity":0},500, function(){$(this).html("").hide();});
                                setTimeout(function() {
                                    $this.find("#book #b h1#t"+vId).show().animate({"margin-left":"-0.5em"},500);
                                    $this.find("#book #b h2.t"+vId).each(function(_index) {
                                        if ($(this).attr("id")!="b"+vBook) { $(this).show().animate({"margin-left":"-0.5em"},500); }
                                    });
                                }, 500);
                            }
                            else {
                                $(this).addClass("s");
                                $this.find("#book #b h1#t"+vId).animate({"margin-left":"-16em"},500,function() { $(this).hide(); } );
                                $this.find("#book #b h2.t"+vId).each(function(_index) {
                                    if ($(this).attr("id")!="b"+vBook) {
                                        $(this).animate({"margin-left":"-20em"},500,function() { $(this).hide(); });
                                    }
                                });
                                setTimeout(function() {
                                    $this.find("#book #b #list").html("").show();
                                    var vBValid= $this.find("#book h2#b"+vBook).hasClass("valid");
                                    for (var k in settings.locale.action) {
                                        var a = settings.locale.action[k];
                                        if (a[2]==vBook) {
                                            var vClass=(vBValid && vIsValid(settings.a,k))?"":" disabled";
                                            var $h=$("<div class='icon a action"+vClass+"' id='a"+k+"'><div>"
                                                   + action[k].label+"</div></div>");
                                            $this.find("#book #b #list").append($h);
                                            $h.bind("mousedown touchstart", function(event) {
                                                if (!$(this).hasClass("disabled")) {
                                                    var vAction = $(this).attr("id").substr(1);
                                                    settings.mathmlup.action=vAction;
                                                    helpers.node.mathml($this, { type:"action", value:vAction });
                                                }
                                            });
                                        }
                                    }
                                    $this.find("#book #b #list").animate({"opacity":1},500,function(){$(this).show(); });
                                },500);
                            }
                          }
                          event.preventDefault();
                        });
                    }
                }
                $this.find("#book #b").append("<div id='list'></div>");

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
                            subtype:    "none",
                            value:      "",
                            abstract:   "",
                            tmp:        0,
                            children:   [],
                            width:      0,
                            left:       0 };
            },
            init: function(_node, _id) {
                var ret = helpers.node.create((typeof(_id)=="undefined")?"n"+(nodecounter++):_id);
                helpers.node.extend(ret, _node);
                for (var i in _node.children) { ret.children.push(helpers.node.init(_node.children[i])); }
                return ret;
            },
            find: function(_this, _idt) {
                if (_this.id==_idt)      { return _this; }
                else if (_this.children.length) {
                    var ret = 0; for (var i in _this.children) { ret = ret || helpers.node.find(_this.children[i],_idt); } return ret;
                } else { return 0; }
            },
            parent: function(_this, _idt) {
                if (_this.children.length) {
                    for (var i in _this.children) { if (_this.children[i].id==_idt) { return _this; } }
                    var ret = 0; for (var i in _this.children) { ret = ret || helpers.node.parent(_this.children[i],_idt); } return ret;
                } else { return 0; }
            },
            equal: function(_this, _node) {
                var ret = (_this.type==_node.type && _this.children.length==_node.children.length &&
                           _this.subtype==_node.subtype );

                if (ret) {
                    if ( _node.value.length==2 && (_node.subtype=="line" || _node.subtype=="segment" || !_node.subtype)) {
                        ret = ret && (_this.value==_node.value || _this.value==_node.value[1]+_node.value[0]);
                    }
                    else { ret = ret && _this.value==_node.value; }
                }

                if (ret) {
                    if (_this.children.length==2 && op[_this.value] && op[_this.value].p && (op[_this.value].p()&op.p.commutative)) {
                        ret = ret && (  ( helpers.node.equal(_this.children[0], _node.children[0]) &&
                                          helpers.node.equal(_this.children[1], _node.children[1]) )  ||
                                        ( helpers.node.equal(_this.children[0], _node.children[1]) &&
                                          helpers.node.equal(_this.children[1], _node.children[0]) ) );
                    }
                    else {
                        for (var i in _this.children) { ret = ret && helpers.node.equal(_this.children[i], _node.children[i]); }
                    }
                }
                return ret;
            },
            update: function(_this) {
                for (var i in _this.children) { helpers.node.update(_this.children[i]); }
                _this.width = 0; _this.left  = 0;
                if (_this.children.length) {
                    for (var i in _this.children) {
                        _this.left += _this.children[i].left + _this.width; _this.width += _this.children[i].width;
                    }
                    _this.left = _this.left/_this.children.length;
                } else { _this.width = 1; }
            },
            label: function(_this, _args) {
                var ret = "", size = 1;
                if (_this.type=="tree") {
                    ret = _this.abstract;
                    size = 1-(ret.toString().length-1)*0.2;
                    if (size<0.2) { ret = ret.substr(0,3)+"~"; size=0.4; }
                }
                else if (_this.type=="op" && op[_this.value]) {
                    ret = op[_this.value].label;
                    if (op[_this.value].l) { size = op[_this.value].l; }
                }
                else if (_this.type=="action" && action[_this.value]) {
                    ret = action[_this.value].label;
                    if (action[_this.value].l) { size = action[_this.value].l; }
                }
                else {
                    ret = _this.value;
                    if (typeof(ret)=="number") {
                        var p="";
                        if (_args && _args.ntype) {
                            var i=0;
                            if (Math.abs(ret)>=1000) {
                                var ps=["","K","M","G","T","P","E","Z","Y"];
                                while (Math.abs(ret)>=1000) { i++; ret=ret/1000; }
                                if (_args.ntype==ntype.physics) { p=(i<ps.length)?ps[i]:"?"; } else
                                if (_args.ntype==ntype.scientific && i>0) {
                                    if (_args && _args.frommathml) {
                                        p="<mo>*</mo><msup><mrow><mn>10</mn></mrow><mrow><mn>"+(i*3)+"</mn></mrow></msup>";
                                    }
                                    else { p=(i>0?"*10^"+(3*i):""); }
                                }
                            } else if (Math.abs(ret)<1) {
                                var ps=["","m","µ","p","f","a","z","y"];
                                while (Math.abs(ret)<1) { i++; ret=ret*1000; }
                                if (_args.ntype==ntype.physics) { p=(i<ps.length)?ps[i]:"?"; } else
                                if (_args.ntype==ntype.scientific && i>0) {
                                    if (_args && _args.frommathml) {
                                        p="<mo>*</mo><msup><mrow><mn>10</mn></mrow><mrow><mo>-</mo><mn>"+(i*3)+"</mn></mrow></msup>";
                                    }
                                    else { p=(i>0?"*10^"+(3*i):""); }
                                }
                            }
                        }
                        if (_args && _args.nbdec) { ret = Math.floor(ret*Math.pow(10,_args.nbdec))/Math.pow(10,_args.nbdec); }
                        ret = ((_args && _args.frommathml)?"<mn>"+ret+"</mn>":ret)+p;
                    }
                    switch (_this.subtype) {
                        case "segment"  : ret="["+ret+"]"; break;
                        case "line"     : ret="("+ret+")"; break;
                    }
                    size = Math.max(0.2,1-(ret.toString().length-1)*0.2);
                }
                if (_args && !_args.onlytext && size!=1) { ret = "<span style='font-size:"+size+"em;'>"+ret+"</span>"; }
                return ret;
            },
            filled: function(_this) {
                var ret = true;
                for (var i in _this.children) { ret = ret && helpers.node.filled(_this.children[i]); }
                if (_this.value==0) { ret = false; } return ret;
            },
            detach: function(_this) {
                if (_this.$html) { _this.$html.detach(); }
                for (var i in _this.children) { helpers.node.detach(_this.children[i]); }
            },
            dump: function(_this,_level) {
                if (!_level) { _level=0; }
                var spaces =""; for (var i=0; i<_level; i++) { spaces+=" "; }
                var ret = spaces+"id        :"+_this.id+"\n"+spaces+"type    : "+_this.type+"\n"+
                          spaces+"value   : "+_this.value+"\n"+spaces+"html    : "+(_this.$html?"1":"0")+"\n";
                if (_this.children.length) {
                    ret+=spaces+"children: "+_this.children.length+"\n";
                    for (var i in _this.children) { ret+=spaces+i+"\n"+helpers.node.dump(_this.children[i],_level+1); } }
                return ret;
            },
            extend: function(_this,_node) {
                _this.type=_node.type;
                _this.subtype=_node.subtype;
                _this.value=_node.value;
                _this.abstract=_node.abstract;
                for (var i in _this.children) { helpers.node.detach(_this.children[i]); }
                _this.children=[];
            },
            clone: function(_this) {
                var ret = helpers.node.create("n"+(nodecounter++));
                helpers.node.extend(ret,_this);
                for (var i in _this.children) { ret.children.push(helpers.node.clone(_this.children[i])); }
                return ret;
            },
            editor: {
                addroot: function($this, _elt) {
                    var settings = helpers.settings($this), vOk = true;
                    var sav = settings.root.type&&settings.root.type!="action"?settings.root:0;
                    helpers.node.editor.clear($this);
                    settings.root=helpers.node.editor.insert($this,true,_elt);

                    var vOk = true, c = settings.root, d = 0;;
                    if (c.type=="op" && op[c.value].p && (op[c.value].p()&op.p.final)) { vOk = false; }

                    if (sav && settings.root && vOk) {
                        if (c.type=="op" && op[c.value] && op[c.value].d)               { d=op[c.value].d; } else
                        if (c.type=="action" && action[c.value] && action[c.value].d)   { d=action[c.value].d; }

                        if (!c.children[d].type) {
                            helpers.node.editor.clear($this);
                            helpers.node.detach(c.children[d]);
                            c.children[d] = helpers.node.clone(sav);
                            settings.root=helpers.node.editor.insert($this,true,c);
                        }
                    }

                    helpers.node.editor.display($this);
                    helpers.node.mathml($this);
                },
                insert: function($this,_root,_elt) {
                    var settings = helpers.settings($this);
                    var data = (settings.data?settings.data[settings.dataid]:settings);
                    if (typeof(_elt)=="number") { _elt=(_elt<0?0:helpers.node.clone(settings.cvalues[_elt])); }

                    var ret = helpers.node.create("n"+(nodecounter++));
                    ret.$html = $("<div class='d' id='"+ret.id+"'></div>");
                    $this.find("#editor>div").append(ret.$html);

                    if (_root && _elt.type=="tree") { _elt.type="op"; }

                    ret.$html.droppable({accept:_root?".a.op,.a.action":".a.op,.a.v,.a.tree", greedy:true,
                        over: function(event, ui) { $(this).addClass("over"); },
                        out: function(event, ui) { $(this).removeClass("over"); },
                        drop:function(event, ui) {
                            $this.find(".over").removeClass("over");
                            var id = parseInt($(ui.draggable).attr("id"));
                            var node = helpers.node.find(settings.root,$(this).attr("id"));
                            var vOk = true;

                            var parent = helpers.node.parent(settings.root,$(this).attr("id"));
                            if (settings.cvalues[id].type!="v" && parent && parent.type=="op" && parent.value=="ident") {
                                helpers.node.detach(node); node=parent; node.$html.show();
                            }

                            if (settings.cvalues[id].type!="v" && parent && parent.type=="op"
                                && op[parent.value].p && (op[parent.value].p()&op.p.final) ) { vOk = false; }

                            if (node.type && !settings.modif) { vOk = (parent && parent.type=="action"); }

                            if (vOk) {
                                helpers.node.extend(node,settings.cvalues[id]);

                                if (settings.cvalues[id].type=="tree") {
                                    node.type="op";
                                    node.$html.html("<div class='a "+node.type+"' id='"+node.id+"'><div class='label'>"+
                                                    helpers.node.label(node, {nbdec: settings.nbdec, ntype: settings.ntype}) +
                                                    "</div></div>");
                                    for (var i in settings.cvalues[id].children) { 
                                            node.children.push(helpers.node.editor.insert($this,false,settings.cvalues[id].children[i]));
                                    }
                                }
                                else {
                                    node.$html.html($this.find(".a#"+id).clone().removeClass("move"));
                                    if (settings.cvalues[id].type=="op" && op[settings.cvalues[id].value]) {
                                        for (var i=0; i<op[settings.cvalues[id].value].c; i++) { 
                                            node.children.push(helpers.node.editor.insert($this,false,-1));
                                        }
                                    }
                                }

                                helpers.node.editor.display($this);
                                helpers.node.mathml($this);
                            }
                        }
                    });

                    // FILL THE NEW CELL
                    if (_elt && _elt.type) {
                        helpers.node.extend(ret, _elt);
                        ret.$html.html("<div class='a "+_elt.type+"' id='"+_elt.id+"'><div class='label'>"+
                                        helpers.node.label(_elt, {nbdec: settings.nbdec, ntype: settings.ntype})+"</div></div>");
                        if (_elt.children && _elt.children.length) {
                            for (var i in _elt.children) {
                                ret.children.push(helpers.node.editor.insert($this,false,_elt.children[i]));
                            }
                        }
                        else if (ret.type=="action") {
                            for (var i=0; i<action[ret.value].c; i++) {
                                ret.children.push(helpers.node.editor.insert($this,false,-1));
                            }
                        }
                        else if (ret.type=="op") {
                            for (var i=0; i<op[ret.value].c; i++) {
                                ret.children.push(helpers.node.editor.insert($this,false,-1));
                            }
                        }
                    }
                    return ret;
                },
                display: function($this,_node,_level,_left) {
                    var settings = helpers.settings($this);
                    if (!_node)         { $this.find("#editor").find(".l").detach();_node=settings.root; _level=0; _left=0;
                                          helpers.node.update(_node); }
                    if (_node.type=="op" && _node.value=="ident") {
                        if (_node.$html) { _node.$html.hide(); }
                        return helpers.node.editor.display($this,_node.children[0],_level,_left);
                    }
                    var level = _level;
                    var width = 0;
                    for (var i in _node.children) {
                        level=Math.max(level, helpers.node.editor.display($this,_node.children[i],_level+1,_left+width));
                        width+=_node.children[i].width;
                    }
                    var links="";
                    var offset = 0;
                    if (_node.children.length) {
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
                    if (links) { $this.find("#editor>div").append(links); }
                    _node.$html.css("top",(_level*1.75)+"em").css("left",((_left+_node.left)*1.5)+"em");

                    // ROOT LEVEL
                    if (_level==0) {
                        var ratio = Math.min(1,3.5/level,5.5/_node.width);
                        $this.find("#editor>div").css("font-size",ratio+"em");
                        var mx = ($this.find("#editor").width()-_node.$html.width()*_node.width*1.25)/2;
                        var my = ($this.find("#editor").height()-_node.$html.height()*(level+1)*1.45)/2;
                        $this.find("#editor>div").css("left",mx+"px").css("top",my+"px");
                        helpers.checkfilled($this);
                    }
                    return level;
                },
                clear:function($this) {
                    var settings = helpers.settings($this);
                    $this.find("#editor>div").html("");
                    helpers.node.detach(settings.root); settings.root={};
                    helpers.node.mathml($this);
                    $this.find("#toinventory").removeClass("s");
                    $this.find("#exec").removeClass("s");
                    $this.find("#submit").removeClass("s");
                }
            },
            mathml: function($this, _node) {
                var settings = helpers.settings($this), ret;
                var isroot = false, fromeditor = true;
                if (typeof(_node)=="number")      { _node = settings.cvalues[_node]; isroot = true; fromeditor = false;}
                if (!_node)                       { _node = settings.root; }
                if (!_node.type)                  { $this.find("#screen").html(""); return ""; }
                if (_node==settings.root)         { isroot = true; }


                if (_node.type=="action")         {
                    var txt = settings.locale.action[_node.value];
                    for (var i=1; i<action[_node.value].c+1; i++) {
                        var vReg = new RegExp("\\\["+i+"\\\](.+)\\\[/"+i+"\\\]","g");
                        txt[1] = txt[1].replace(vReg,"<span class='link' id='l"+i+"' "+
                            "onclick=\"$(this).closest('.mathcraft').mathcraft('ref',"+i+");\" "+
                            "ontouchstart=\"$(this).closest('.mathcraft').mathcraft('ref',"+i+");event.preventDefault();\" "+
                            ">$1</span>");
                    }
                    $this.find("#screen").html("<h1>"+txt[0]+"</h1><div class='ac'>"+txt[1]+"</div>");
                    return "";
                }

                if (_node.type=="op"&& !fromeditor) { return ""; }

                if (_node.type=="op" || _node.type=="tree") {
                    if (! op[_node.value]) { alert("DEBUG "+_node.value); }
                    ret = op[_node.value].m;
                    if (typeof(ret)=="function") { ret = ret(_node); }
                    for (var i in _node.children) {
                        var regexp = new RegExp("c"+i, "g");
                        ret = ret.replace(regexp, helpers.node.mathml($this,_node.children[i]));
                    }
                }
                else { ret = helpers.node.label(_node,
                                {nbdec: settings.nbdec, ntype: settings.ntype, onlytext:true, frommathml:true }); }

                if (isroot) {
                    if (_node.type) {
                        $this.find("#screen").html("<div><math><mrow>"+ret+"</mrow></math></div>").toggleClass("s",!fromeditor);
                        if (settings.mathmlup.timerid) { clearTimeout(settings.mathmlup.timerid); }
                        settings.mathmlup.timerid = setTimeout(function(){ helpers.node.mathmlup($this); }, 10 );
                    }
                    else { $this.find("#screen").html(""); }
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
                else {
                    var tmp = helpers.node.label(_node, {nbdec: settings.nbdec, ntype: settings.ntype, onlytext:true});
                    ret = [tmp?tmp:""];
                }
                return ret;
            },
            mathmlup: function($this) {
                var settings = helpers.settings($this);
                if (settings.mathmlup.timerid) { clearTimeout(settings.mathmlup.timerid); settings.mathmlup.timerid = 0; }
                var ratio = Math.max($this.find("#screen>div").height()/$this.find("#screen").height(),
                                     $this.find("#screen>div").width()/$this.find("#screen").width());
                if (ratio<0.5 || ratio>1) {
                    settings.mathmlup.ratio = settings.mathmlup.ratio*(ratio<0.5?1.1:0.9);
                    $this.find("#screen>div").css("font-size",settings.mathmlup.ratio+"em");
                    settings.mathmlup.timerid = setTimeout(function(){ helpers.node.mathmlup($this); }, 10 );
                }
            }
        },
        build: function($this) {
            var settings = helpers.settings($this);
            var data        = (settings.data?settings.data[settings.dataid]:settings);
            var values      = (settings.data&&settings.data[settings.dataid].values?settings.data[settings.dataid].values:settings.values);
            var exercice    = (settings.data?settings.exercice[settings.dataid%settings.exercice.length]:settings.exercice);
            var figure      = (settings.data&&settings.data[settings.dataid].figure?settings.data[settings.dataid].figure:settings.figure);

            settings.cvalues = values;
            settings.root    = 0;

            if (settings.clean) { $this.find("#editor>div").html(""); $this.find("#screen").html(""); }

            if (figure) {
                if (figure.url)        { $this.find("#figure").html("<img src='"+figure.url+"'/>"); } else
                if (figure.content)    {
                    if (figure.content.indexOf("<svg")==-1) {
                        $this.find("#figure").html(
                            "<svg width='100%' height='100%' viewBox='0 0 640 480'><def><style>"+
                            ".a { stroke-dasharray:8,8; }"+
                            ".l { fill:none; stroke:black; stroke-width:4px; stroke-linecap:round; }"+
                            ".s { fill:none; stroke:black; stroke-width:2px; stroke-linecap:round; }"+
                            ".p { fill:black; stroke:none; }"+
                            ".d { stroke:#dd8833 !important; }"+
                            ".p.d { fill:#dd8833 !important; }"+
                            ".blue { fill:#00F; }"+
                            ".red { fill:#F00; }"+
                            "text { font-size:30px;} text.dd { fill:#dd8833} "+
                            "</style></def><rect x='0' y='0' width='640' height='480' style='fill:white;'/>"+
                            figure.content+"</svg>"
                        );
                    }
                    else { $this.find("#figure").html(figure.content); }
                }
            }

            /* Exercice stuff */
            if ($.isArray(exercice)) {
                var html=""; for (var i in exercice) {
                    html+="<div style='font-size:"+settings.font+"em;'>"+
                            (exercice[i].length?helpers.format(exercice[i]):"&nbsp;")+"</div>"; }
                $this.find("#exercice>div").html(html);
            }
            else { $this.find("#exercice>div").html(helpers.format(exercice)); }

            $this.find("#inventory .z").each(function(_index) {
                var html="";
                if (values && _index<values.length) {
                    values[_index]= helpers.node.init(values[_index], _index);
                    html="<div class='a "+values[_index].type+"' id='"+values[_index].id+"'>"+
                         "<div class='label'>"+helpers.node.label(values[_index], {nbdec: settings.nbdec, ntype: settings.ntype})+
                         "</div></div>";
                }
                $(this).html(html);
            });
            $this.find("#inventory .a").each(function() { helpers.draggable($this, $(this)); });
        },
        draggable: function($this, $elt) {
            $elt.bind("mousedown touchstart", function(event) { helpers.node.mathml($this,parseInt($(this).attr("id"))); });
            $elt.draggable({containment:$this, helper:"clone", appendTo:$this, /* revert:true, */
                start:function( event, ui) {
                    $("#exercice .data#d"+$(this).attr("id")).addClass("s");
                    $(this).addClass("move");},
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

                    helpers.node.mathml($this);
                    $("#exercice .data").removeClass("s");
                    $(this).removeClass("move"); } });
        },
        checkfilled: function($this) {
            var settings = helpers.settings($this);
            var isFilled = helpers.node.filled(settings.root);
            $this.find("#toinventory").toggleClass("s",settings.root.type=="op"&&isFilled);
            $this.find("#exec").toggleClass("s",settings.root.type=="action"&&isFilled);
            $this.find("#submit").toggleClass("s", settings.root.type=="op"&&isFilled);
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
    $.fn.mathcraft = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    interactive     : false,
                    dataid          : 0,                                    // data index
                    root            : {},                                   // build tree
                    wrongs          : 0,                                    // wrongs value
                    mathmlup        : { ratio: 1, timerid: 0, action:0 },   // ratio of the mathml output
                    timers          : { glossary: 0, clear: 0 },            // Timers id
                    cvalues         : 0                                     // current values
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
                if (settings.interactive && $this.find("#submit").hasClass("s")) {
                    settings.interactive = false;
                    var result = (settings.data?settings.data[settings.dataid].result:settings.result);
                    if (!$.isArray(result)) { result = [ result ]; }
                    settings.dataid++;

                    var min = 5;
                    var values = helpers.node.text($this);
                    if (settings.onlyone) { values = [ values[0] ]; }
                    for (var i in values) for (var j in result ) { min = Math.min (min,helpers.levenshtein(values[i], result[j])); }
                    min = Math.min(5,min*settings.errratio);
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
            },
            toinventory: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && $this.find("#toinventory").hasClass("s")) {
                    var vIndex = settings.cvalues.length;
                    if (vIndex<21) {
                        var vNew = $.extend({}, settings.root, {type:"tree", id:vIndex, abstract:helpers.node.text($this)[0]} );
                        helpers.node.detach(vNew);
                        settings.cvalues.push(vNew);
                        var $html=$("<div class='a "+vNew.type+"' id='"+vNew.id+"'><div class='label'>"+
                                     helpers.node.label(vNew, {nbdec: settings.nbdec, ntype: settings.ntype})+"</div></div>");
                        $($this.find("#inventory .z").get(vIndex)).html($html);
                        helpers.node.editor.clear($this);
                        helpers.draggable($this, $html);
                    }

                }
            },
            clear: function() {
                var $this = $(this) , settings = helpers.settings($this);
                helpers.node.editor.clear($this);
                $this.find("#clear").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#glossary").animate({opacity:0},500, function() { $(this).hide(); });
            },
            glossary: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.mathmlup.action=0;
                $this.find("#clear").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#glossary").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#book").css("opacity",0).show().animate({opacity:1},500);
            },
            execute: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && $this.find("#exec").hasClass("s")) {
                    var n = action[settings.root.value].process(settings.root);
                    if (n && n.type=="v") {
                        var tmp = helpers.node.create("n"+(nodecounter++));
                        tmp.type="op"; tmp.value="ident";
                        tmp.children.push(n);
                        n=tmp;
                    }

                    $this.find("#mask").css({"opacity":0,"background-color":n?"#0F0":"#F00"}).show().animate({opacity:1},500);
                    setTimeout(function(){
                        if (n) {
                            helpers.node.editor.clear($this);
                            settings.root=helpers.node.editor.insert($this,true,n);
                            helpers.node.editor.display($this);
                            helpers.node.mathml($this);
                            $this.find("#toinventory").addClass("s");
                        }
                        $this.find("#mask").animate({opacity:0},500, function(){$(this).hide(); });
                    },500);
                }
            },
            closebook: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#book").animate({opacity:0}, 500, function() { $(this).hide(); });
                settings.mathmlup.action=0;
                helpers.node.mathml($this);
            },
            onscreen: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.mathmlup.action) {
                    $this.find("#book").animate({opacity:0}, 500, function() { $(this).hide(); });
                    helpers.node.editor.addroot($this, {type:"action", value:settings.mathmlup.action });
                    settings.mathmlup.action=0;
                }
            },
            ref: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                if (!settings.mathmlup.action && settings.root && settings.root.type=="action") {
                    settings.root.children[_id-1].$html.addClass("over");
                    if (!action[settings.root.value].check(settings.root,_id-1)) {
                        $this.find("#screen #l"+_id).addClass("wrong");
                    }
                    setTimeout(function() {
                        $this.find("#editor .d").removeClass("over");
                        $this.find("#screen .link").removeClass("wrong");
                    }, 800);
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mathcraft plugin!'); }
    };
})(jQuery);

