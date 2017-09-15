jSav = jQuery; // EPUB READER OVERWRITING
data = {};
$(window).ready(function() { $(window).resize(); });

$(window).load(function() {
    $.getJSON("data/lang.json", function(_lang) {
        lang=_lang[0];
        
        // SPECIFIC CONTENT
        $("#aatemplate").load( "data/"+lang+"/content_"+pageid+".html");
    
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

            // if ( localStorage && localStorage.getItem("jlodb") ) { state = localStorage.getItem("jlodb"); }
            
            for (var i=state.length; i<data.content.length; i++) { state+="."; }

            $("#aamenu").menu({
                list    : data.content,
                state   : state,
                onupdate: function($this, _state) {
                    // if (localStorage) { localStorage.setItem("jlodb", _state); }
                },
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
