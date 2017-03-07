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
        devmode     : false,                                    // devmode
        debug       : true                                     // Debug mode
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
        "\\\[mathxl\\\](.+)\\\[/mathxl\\\]",        "<div class='mathxl'><math>$1</math></div>",
        "\\\[icon\\\](.+)\\\[/icon\\\]",            "<div class='img'><div class='icon'><img src='$1.svg'/></div></div>"
    ];

    var ntype = { normal:0, scientific:1, physics:2 };

    var nodecounter = 0;
    var vocabulary  = 0;
    var actioncount = 0;
    var actiontmp   = 0;

    var action = {
        par3: function(_node, _value) {
            var ret = 0, same=0;
            for (var i=0; i<2; i++) for (var j=0; j<2; j++) {
                var c1 = _node.children[0].children[i], c2 = _node.children[1].children[j];
                if (c1.type=="value" && c2.type=="value" &&
                   (c1.value==c2.value || ( c2.value.length==2 && c1.value == c2.value[1]+c2.value[0] ) ) ) { same = [i,j]; }
            }
            if (same) {
                ret = $.extend(true,{},nodetype[_value]);
                ret.children = [ _node.children[0].children[1-same[0]], _node.children[1].children[1-same[1]] ];
                for (var i=0; i<2; i++) { if (ret.children[i].subtype=="segment") { ret.children[i].subtype="line"; } }
            }
            return ret;
        }
    };

    var nodetype = {
/*
        add:   {
            type:"action", value:"+", l:1, c:2, d:1,
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
            type:"action", value:"A", l:1, c:1,
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
            type:"action", value:"C", l:1,    c:1,
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
            type:"action", value:"=", l:1,    c:1,
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
            type:"action", value:"n", l:1, c:2, d:1,
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
        inline: {
            type:"action", value:"<img src='res/img/icon/geometry/line02.svg'/>", l:1, c:1,
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
            type:"action", value:"<img src='res/img/icon/geometry/mediator02.svg'/>", l:1, c:1,
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
        mid2d : {
            type:"action", value:"<img src='res/img/icon/geometry/midpoint02.svg'/>", l:1, c:1,
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
        mid2in: {
            type:"action", value:"<img src='res/img/icon/geometry/midpoint02.svg'/>", l:1, c:1, check:function(_node,_id) { return action.mid2d.check(_node,_id);},
            process: function(_node) {
                var ret = 0;
                if (this.check(_node)) { ret = helpers.node.clone(_node.children[0]); ret.value="isin"; }
                return ret;
            }
        },
*/
        mid2par: {
            type:"action", value:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", l:1, c:2,
            check: function(_id) {
                return (this.children[_id].filled() && this.children[_id].type=="op" && this.children[_id].id=="middle");
            },
            process: function() {
                var ret = 0;
                if (this.check(0)&&this.check(1)) {
                    if (this.children[0].children[0].type=="value" && this.children[0].children[0].value.length==1 &&
                        this.children[1].children[0].type=="value" &&
                        this.children[0].children[0].value == this.children[1].children[0].value &&
                        this.children[0].children[1].subtype=="segment" && this.children[1].children[1].subtype=="segment" &&
                        this.children[0].children[1].value.indexOf(this.children[1].children[1].value[0])==-1 &&
                        this.children[0].children[1].value.indexOf(this.children[1].children[1].value[1])==-1 ) {

                        ret = $.extend(true,{},nodetype["parallelogram"]);
                        var v1 = this.children[0].children[1].value, v2 = this.children[1].children[1].value;
                        ret.children = [ { type:"value", value : v1[0]+v2[0]+v1[1]+v2[1] } ];
                    }
                }
                return ret;
            }
        },
/*
        mids2med : {
            type:"action", value:"<img src='res/img/icon/geometry/mediator02.svg'/>", l:1, c:2,
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
            type:"action", value:"*", l:1, c:2, d:1,
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
            type:"action", value:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", l:1, c:2,
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
            type:"action", value:"<img src='res/img/icon/geometry/parallelogram02.svg'/>", l:1, c:1,
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
            type:"action", value:"<img src='res/img/icon/geometry/rectangle02.svg'/>", l:1, c:2,
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
*/
        par3: {
            type:"action", value:"<img src='res/img/icon/geometry/parallel02.svg'/>", l:1, c:2,
            check: function(_id) {
                return (this.children[_id].filled() && this.children[_id].type=="op" && this.children[_id].id=="par");
            },
            process: function() { return (this.check(0)&&this.check(1))?action.par3(this,"par"):0; }
        },
        parid: {
            type:"action", value:"<img src='res/img/icon/geometry/parallel02.svg'/>", l:1, c:1,
            check: function() {
                return (this.children[0].filled() && this.children[0].type=="op" && this.children[0].id=="par");
            },
            process: function(_node) {
                var ret = 0;
                if (this.check()) {
                    if (this.children[0].children[0].value.length == 2 &&
                        this.children[0].children[1].value.length == 2 &&
                        ( this.children[0].children[1].value.indexOf(this.children[0].children[0].value[0])!=-1 ||
                          this.children[0].children[1].value.indexOf(this.children[0].children[0].value[1])!=-1 ) ) {
                        
                        ret = $.extend(true,{},nodetype["eq"]);
                        ret.children = [ this.children[0].children[0], this.children[0].children[1] ];
                        for (var i=0; i<2; i++) { if (ret.children[i].subtype=="segment") { ret.children[i].subtype="line"; } }
                    }
                }
                return ret;
            }
        },
        perp2: {
            type:"action", value:"<img src='res/img/icon/geometry/perpendicular02.svg'/>", l:1, c:2,
            check: function(_id) {
                return (this.children[_id].filled() && this.children[_id].type=="op" && this.children[_id].id=="perp" );
            },
            process: function() { return (this.check(0)&&this.check(1))?action.par3(this,"par"):0; }
        },
        pperp: {
            type:"action", value:"<img src='res/img/icon/geometry/parperp02.svg'/>", l:1, c:2,
            check: function(_id) {
                return (this.children[_id].filled() && this.children[_id].type=="op" && this.children[_id].id==(_id?"perp":"par"));
            },
            process: function() { return (this.check(0)&&this.check(1))?action.par3(this,"perp"):0; }
        },
/*
        pythagore:    {
            type:"action", value:"&Pi;", l:1, c:1,
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
            type:"action", value:"R", c:2, d:1,
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
        rectriangle: {
            type:"action", value:"<img src='res/img/icon/geometry/rtriangle02.svg'/>", l:1, c:1,
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
            type:"action", value:"&lsaquo;&rsaquo;", l:1, c:1,
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
            type:"action", value:"<img src='res/img/icon/geometry/midpoint02.svg'/>", l:1, c:2,
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
        },
*/
        integ:  { type:"op", value:"&int;", l:1, c:3, d:2,
                  m:function(_node) { return "<msubsup><mo>&int;</mo><mrow>c0</mrow><mrow>c1</mrow></msubsup><mrow>c2"+
                                             "<mo>&InvisibleTimes;</mo><mrow><mi>d</mi><mi>"+_node.subtype+"</mi></mrow>"; },
                  t:function(_node) { return "int"+_node.subtype+"(c0,c1,c2)"; } },
        isin:   { type:"op", value:"&isin;", l:1, c:2, m:"c0<mo>&isin;</mo>c1", t:"c0∈c1" },
        mediator: { type:"op", value:"<img src='res/img/icon/geometry/mediator01.svg'/>", l:1, c:2,
                  m:function() { return "c0<mtext mathsize='big'>"+(vocabulary?vocabulary.mediator:"mediator")+"</mtext>c1" },
                  t:"mediator(c0,c1)" },
        middle: { type:"op", value:"<img src='res/img/icon/geometry/midpoint01.svg'/>", l:1, c:2,
                  m:function() { return "c0<mtext mathsize='big'>"+(vocabulary?vocabulary.middle:"middle")+"</mtext>c1" },
                  t:"mid(c0,c1)" },
        par:    { type:"op", value:"//", c:2, m:"c0<mo>//</mo>c1", t:["par(c0,c1)","par(c1,c0)"],
                  p:function() { return nodemathtype.commutative | nodemathtype.associative; } },
        parallelogram:  { type:"op", value:"<img src='res/img/icon/geometry/parallelogram01.svg'/>", l:1, c:1,
                  m:function() { return "<mover><mrow><mtext mathsize='big'>"+(vocabulary?vocabulary.parallelogram:"parallelogram")+
                                        "</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"parallelogram(c0)", p:function() { return nodemathtype.final; } },
        perp:   { type:"op", value:"&perp;", c:2, l:1, m:"c0<mo>&perp;</mo>c1", t:["perp(c0,c1)","perp(c1,c0)"],
                  p:function() { return nodemathtype.commutative; } },
        rectangle:  { type:"op", value:"<img src='res/img/icon/geometry/rectangle01.svg'/>", l:1, c:1,
                  m:function() { return "<mover><mrow><mtext mathsize='big'>"+(vocabulary?vocabulary.rectangle:"rectangle")+
                                        "</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"rectangle(c0)", p:function() { return nodemathtype.final; } },
        rtriangle: { type:"op", value:"<img src='res/img/icon/geometry/rtriangle01.svg'/>", l:1, c:2,
                  m:function() { return "<mover><mrow><mtext mathsize='small'>"+(vocabulary?vocabulary.rtriangle:"rtriangle")+
                                        " c1</mtext></mrow><mrow>c0</mrow></mover>";},
                  t:"rtriangle(c0,c1)", p:function() { return nodemathtype.final; } }
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

                // Build panel droppable
                $this.find("#editor").editor({
                    size: [3.5,5.5],
                    onclick:function($editor, _event) {
                        if (settings.timers.clear) { clearTimeout(settings.timers.clear); }
                        else { $this.find("#clear").css("opacity",0).show().animate({opacity:1},500); }
                        settings.timers.clear = setTimeout(function() { $this.find("#clear")
                            .animate({opacity:0},500, function() { $(this).hide(); settings.timers.clear=0; }); }, 2000);

                         if (settings.glossary) {
                            $this.find("#glossary").css("opacity",0).show().animate({opacity:1},500);
                            if (settings.timers.glossary) { clearTimeout(settings.timers.glossary); }
                            settings.timers.glossary = setTimeout(function() { $this.find("#glossary")
                                .animate({opacity:0},500, function() { $(this).hide(); settings.timers.glossary = 0; }); }, 2000);
                        }
                    },
                    onupdate:function($editor, $root) {
                        var settings = helpers.settings($this);
                        var isFilled = $root&&$root.filled();
                        $this.find("#toinventory").toggleClass("s",$root&&$root.type=="op"&&isFilled);
                        $this.find("#exec").toggleClass("s",$root&&$root.type=="action"&&isFilled);
                        $this.find("#submit").toggleClass("s", isFilled);
                    },
                    getnode:function($editor, _val) {
                        return typeof(_val)=="object"?nodetype[_val.id]:helpers.settings($this).cvalues[_val];
                    }
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
                                settings.bookid=0;
                                $this.find("#editor").editor("mathml");
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
                                    settings.booknode = {};
                                    for (var k in settings.locale.action) {
                                        var a = settings.locale.action[k];
                                        if (a[2]==vBook) {

                                            var vNode = $this.find("#editor").editor("tonode", {id:k});
                                            settings.booknode[k] = vNode;
                                            var vClass=(vBValid && vIsValid(settings.a,k))?"":" disabled";
                                            var $elt=$("<div class='icon ea action"+vClass+"' id='a"+k+"'><div class='label'>"+
                                                    vNode.label()+"</div></div>");
                                            $this.find("#book #b #list").append($elt);
                                            
                                            $elt.bind("mousedown touchstart", function(event) {
                                                if (!$(this).hasClass("disabled")) {
                                                    var vAction = $(this).attr("id").substr(1);
                                                    $this.find("#editor").editor("mathml",settings.booknode[vAction]);
                                                    settings.bookid = vAction;
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

                // Update the action node type
                for (var n in nodetype) {
                    if (nodetype[n].type=="action") {

                        nodetype[n].m = "<h1>"+settings.locale.action[n][0]+"</h1>"+
                                        "<p class='sub'>"+settings.locale.action[n][1]+"</p>";

                        for (var i=1; i<nodetype[n].c+1; i++) {
                            var vReg = new RegExp("\\\["+i+"\\\](.+)\\\[/"+i+"\\\]","g");
                            nodetype[n].m = nodetype[n].m.replace(vReg,"<span class='link' id='l"+i+"' "+
                                "onclick=\"$(this).closest('.mathcraft').mathcraft('ref',"+i+");\" "+
                                "ontouchstart=\"$(this).closest('.mathcraft').mathcraft('ref',"+i+");event.preventDefault();\" "+
                                ">$1</span>");
                        }

                        nodetype[n].nomathml = true;
                        nodetype[n].p = function() { return nodemathtype.rootonly; };
                    }
                    nodetype[n].id = n;
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
        build: function($this) {
            var settings = helpers.settings($this);
            var data        = (settings.data?settings.data[settings.dataid]:settings);
            var values      = (settings.data&&settings.data[settings.dataid].values?settings.data[settings.dataid].values:settings.values);
            var exercice    = (settings.data&&$.isArray(settings.exercice)?
                                 settings.exercice[settings.dataid%settings.exercice.length]:settings.exercice);
            var figure      = (settings.data&&settings.data[settings.dataid].figure?settings.data[settings.dataid].figure:settings.figure);

            settings.cvalues = [];

            if (settings.clean) { $this.find("#editor").editor("clear"); }

            if (figure) {
                if (figure.url)        { $this.find("#figure").html("<img src='"+figure.url+"'/>"); } else
                if (figure.content)    {
                    if (figure.content.indexOf("<svg")==-1) {
                        var svgContent = "<svg xmlns:svg='http://www.w3.org/2000/svg' xmlns='http://www.w3.org/2000/svg' "+
                            " width='100%' height='100%' viewBox='0 0 640 480'><def><style>"+
                            ".a { stroke-dasharray:8,8; }"+
                            ".l { fill:none; stroke:black; stroke-width:4px; stroke-linecap:round; }"+
                            ".s { fill:none; stroke:black; stroke-width:2px; stroke-linecap:round; }"+
                            ".p { fill:black; stroke:none; }"+
                            ".l.d { stroke:#dd8833; } .s.d { stroke:#dd8833; } .p.d { fill:#dd8833; }"+
                            ".blue { fill:#00F; } .red { fill:#F00; }"+
                            ".l.hl { stroke:red; stroke-width:6px !important; }"+
                            ".s.hl { stroke:red; stroke-width:3px !important; }"+
                            ".p.hl { fill:red !important; stroke:red; stroke-width:1px; }"+
                            "text { font-size:30px;} text.dd { fill:#dd8833} "+
                            "text.hl { fill:red !important; }"+
                            "</style></def><rect x='0' y='0' width='640' height='480' style='fill:white;'/>"+
                            figure.content+"</svg>";
                        var $figure = $this.find("#figure");

                        $figure.svg();
                        settings.svg = $figure.svg('get');
                        settings.svg.load(svgContent, { addTo: false, changeSize: true});
                    }
                    else { $this.find("#figure").html(figure.content); }
                }
            }

            /* Exercice stuff */
            if ($.isArray(exercice)) {
                var html=""; for (var i in exercice) {
                    html+="<div style='font-size:"+settings.font+"em;'>"+
                            (exercice[i].length?helpers.format(exercice[i]):"&#xA0;")+"</div>"; }
                $this.find("#exercice>div").html(html);
            }
            else {
                $this.find("#exercice>div").html("<div style='font-size:"+settings.font+"em;'>"+helpers.format(exercice)+"</div>");
            }

            $this.find("#inventory .z").each(function(_index) {
                if (values && _index<values.length) {
                    var vNode = $this.find("#editor").editor("tonode", values[_index]);
                    settings.cvalues.push(vNode);
                    var vClass=(values[_index].children?"ea tree":"ea")+" "+vNode.type;
                    var $elt=$("<div class='"+vClass+"' id='"+_index+"'><div class='label'>"+vNode.label()+"</div></div>");
                    $(this).html($elt);
                    helpers.draggable($this,$elt);
                }
            });
            
        },
        draggable: function($this, $elt) {
            var settings = helpers.settings($this);
            $elt.bind("mousedown touchstart", function(event) { /* helpers.node.mathml($this,parseInt($(this).attr("id")));*/ });
            $elt.draggable({containment:$this, helper:"clone", 
                start:function( event, ui) {
                    $("#exercice .data#d"+$(this).attr("id")).addClass("hl");
                    if (settings.cvalues[$(this).attr("id")].children.length ||
                        settings.cvalues[$(this).attr("id")].type == "action" ) {
                        $this.find("#editor").editor("mathml",settings.cvalues[$(this).attr("id")]);
                    }
                    if (settings.svg) {
                        $(".p"+(parseInt($(this).attr("id"))+1),settings.svg.root()).each(function() {
                            var vClass = $(this).attr("class");
                            $(this).attr("class",vClass+" hl");
                        });
                    }
                    $(this).addClass("move");
                },
                stop: function( event, ui) {
                    var vEvent = (event && event.originalEvent && event.originalEvent.touches && event.originalEvent.touches.length)?
                                    event.originalEvent.touches[0]:event;
                    $("#exercice .data").removeClass("hl");
                    $this.find("#editor").editor("mathml");
                    
                    if (settings.svg) {
                        $(".hl",settings.svg.root()).each(function() {
                            var vClass = $(this).attr("class");
                            $(this).attr("class",vClass.replace(" hl",""));
                        });
                    }

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
                    cvalues         : 0,                                    // current values
                    booknode        : {},                                   // book page editor node
                    svg             : 0                                     // figure as svg
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
                    var values = $this.find("#editor").editor("text");
                    if (settings.onlyone) { values = [ values[0] ]; }
                    for (var i in values) for (var j in result ) { min = Math.min (min,helpers.levenshtein(values[i], result[j])); }
                    min = Math.min(5,min*settings.errratio);
                    $this.find("#escreen").addClass("s"+min);

                    if (settings.devmode) { alert($this.find("#escreen>div").html()+"\n"+values[0]); }

                    settings.wrongs+=min;

                    if (settings.dataid<settings.number) {
                        setTimeout(function(){
                            $this.find("#escreen").removeClass();
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
                        var vNew    = $this.find("#editor").editor("value");
                        vNew.abstract  = $this.find("#editor").editor("text")[0];
                        $this.find("#editor").editor("clear");

                        var vClass="ea";
                        if (vNew.children && vNew.children.length) { vClass+=" tree"; } else { vClass+=" "+vNew.type; }

                        settings.cvalues.push(vNew);
                        var $html=$("<div class='"+vClass+"' id='"+vIndex+"'><div class='label'>"+vNew.label()+"</div></div>");
                        $($this.find("#inventory .z").get(vIndex)).html($html);
                        helpers.draggable($this, $html);
                    }

                }
            },
            clear: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $(this).find("#editor").editor('clear'); 
                $this.find("#clear").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#glossary").animate({opacity:0},500, function() { $(this).hide(); });
            },
            glossary: function() {
                var $this = $(this) , settings = helpers.settings($this);
                settings.bookid=0;
                $this.find("#clear").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#glossary").animate({opacity:0},500, function() { $(this).hide(); });
                $this.find("#book").css("opacity",0).show().animate({opacity:1},500);
            },
            execute: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.interactive && $this.find("#exec").hasClass("s")) {
                    var root    = $this.find("#editor").editor("value");
                    var n       = root.process();

                    $this.find("#mask").css({"opacity":0,"background-color":n?"#0F0":"#F00"}).show().animate({opacity:1},500);
                    setTimeout(function(){
                        if (n) {
                            root.detach();
                            $this.find("#editor").editor("value", n);
                            $this.find("#toinventory").addClass("s");
                        }
                        $this.find("#mask").animate({opacity:0},500, function(){$(this).hide(); });
                    },500);
                }
            },
            closebook: function() {
                var $this = $(this) , settings = helpers.settings($this);
                $this.find("#book").animate({opacity:0}, 500, function() { $(this).hide(); });
                settings.bookid=0;
                $this.find("#editor").editor("mathml");
            },
            onscreen: function() {
                var $this = $(this) , settings = helpers.settings($this);
                if (settings.bookid) {
                    $this.find("#book").animate({opacity:0}, 500, function() { $(this).hide(); });
                    $this.find("#editor").editor("value", settings.booknode[settings.bookid], true );
                    settings.bookid=0;
                }
            },
            ref: function(_id) {
                var $this = $(this) , settings = helpers.settings($this);
                var root = $this.find("#editor").editor("value");
                if (root && root.type=="action") {

                    root.children[_id-1].$html.addClass("over");
                    $this.find("#escreen #l"+_id).addClass(root.check(_id-1)?"good":"wrong");

                    setTimeout(function() {
                        $this.find("#editor .ed").removeClass("over");
                        $this.find("#escreen .link").removeClass("wrong").removeClass("good");
                    }, 800);
                }
            }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in mathcraft plugin!'); }
    };
})(jQuery);

