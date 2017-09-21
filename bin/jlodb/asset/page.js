jSav = jQuery; // EPUB READER OVERWRITING
data = {};
lang = "";
user = 0;
$(window).ready(function() { $(window).resize(); });

var store = function(_name, _value) {
    var ret = 0;
    if ($.cookie) {
        if (typeof(_value)=="undefined") { ret = $.cookie(_name); }
        else                             { $.cookie(_name, _value, { expires:365 }); }
    }
    else if (localStorage) {
        alert("local storage");
    }
    return ret;
}

var changeuser = function(_this, _value) {
    if ($(_this).hasClass("s")) { $(_this).removeClass("s"); store("user",0); }
    else { $(_this).siblings().removeClass("s"); $(_this).addClass("s"); store("user",_value); }
}

$(window).load(function() {
    $.getJSON("data/lang.json", function(_lang) {
        
        // COOKIE HANDLING
        lang = store("lang");
        if (!lang) { lang=_lang[0]; store("lang",lang); }
        user = store("user");
        
        // SPECIFIC CONTENT
        $("#aatemplate").load( "data/"+lang+"/content_"+pageid+".html", function() {
            // TOC UPDATE
            if ($("#aatoc").length) {
                $("#aatoc .icon").removeClass("s");
                $("#aausers #u"+user).addClass("s");
                $("#aalangs #"+lang).addClass("s");
                $("#aatemplate h1").bind("mousedown touchstart", function(e) {
                    $(this).next().toggle();
                    e.preventDefault();
                });
                $("#aatemplate h2").bind("mousedown touchstart", function(e) {
                    document.location="page_"+$(this).attr("class").substr(1)+".html";
                    e.preventDefault();
                });
            }
        
        });
    
        $ = jQuery = jSav; // EPUB READER OVERWRITING
        
    if ($("#aamenu").length) {
        
        $.getJSON("data/"+lang+"/activities.json", function(_activities) {
            data.activities = _activities;
                
        $.getJSON("data/"+lang+"/content_"+pageid+".json", function(_content) {
            data.content = _content;
                    
        $.getJSON("data/"+lang+"/exercices_"+pageid+".json", function(_exercices) {
            data.exercices = _exercices;
 
            // STATE
            var state = ""; for (var i in data.content) { state+="."; }
            if (user!=0) {
                state = store("p"+pageid+"u"+user);
                if (!state) { state="."; }
                for (var i=state.length; i<data.content.length; i++) { state+="l"; }
            }

            

            $("#aamenu").menu({
                list    : data.content,
                state   : state,
                onupdate: function($this, _state) { store("p"+pageid+"u"+user, _state); },
                onclick : function($this, _args) {
                
                    var args = $.extend({}, {activity:data.exercices[_args.id].activity, args:data.exercices[_args.id].args});
                    args.args.locale        = data.activities[data.exercices[_args.id].activity].locale;
                    args.args.locale.label  = data.activities[data.exercices[_args.id].activity].label;
                    
                    $("#activity").jlodb({
                        onstart:    function($this) { $("#aapage").hide(); $this.parent().show(); },
                        onfinish:   function($this, _hide) { if (_hide) { $("#aapage").show(); $this.parent().hide(); }
                                                             $("#score").score('hide'); },
                        onscore:    function($this, _ret) {
                                    var isnext = false;
                                    if (_ret.score>=2) { isnext = $("#aamenu").menu('score', _ret.score).menu('more'); }
                                    $("#score #next").toggle(isnext);
                                    $("#score").score('show',_ret.score);
                                    return true; } },args);
                }
            });
            
        });
        });
        });
    }
    });
    
    $("#score").score({
        onreload:function($this) { $('#activity').jlodb('reload'); },
        onmenu:  function($this) { $('#activity').jlodb('close', true); },
        onnext:  function($this) { $('#activity').jlodb('close',false);$('#aamenu').menu('next'); } 
    });
    
});

var changepage=function(_offset) {
    var id = parseInt(pageid)+_offset;
    if (id<10) id="00"+id; else if (id<100) id="0"+id;
    document.location.href="page_"+id+".html";
}
