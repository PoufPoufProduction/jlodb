(function($) {
    var defaults = {
        debug       : true,
        url         : "",               // cross platform json (not available for the moment)
        id          : "activity",       // activity id
        isvisible   : false,            // is visible
        // OVERWRITABLE METHODS
        onevent     : function($this, _begin)   { if (_begin) { helpers.settings($this).onstart($this); }
                                                  else        { helpers.settings($this).onfinish($this); } },
        onstart     : function($this)           { /** START THE ACTIVITY */ },
        onfinish    : function($this)           { /** FINISH THE ACTIVITY */ },
        onscore     : function($this, _ret)     { /** HANDLE THE SCORE */ return false; },
        onexercice  : function($this, _id)      { /** GET THE ID OF THE EXERCICE */ }

    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },

        rerun       : function($this) {
            var settings = helpers.settings($this);
            helpers.run($this, settings.last, settings.args);
        },

        // RUN THE EXERCICE REGARDING THE ACTIVITY NAME AND ITS ARGUMENTS
        run         : function($this, _name, _args) {
            var settings = helpers.settings($this);

            settings.last = _name;
            settings.args = $.extend(true, {},_args);

            var args = $.extend({ 'context': settings.context } , _args);
            args.debug   = settings.debug;
            args.context = settings.context;

            if (typeof($this[_name])=='undefined') {
                $.getScript('activities/'+_name+'/'+_name+'.js', function() {
                    $this.find("#"+settings.id)[_name](args); });
            }
            else { $this.find("#"+settings.id)[_name](args); }
        },

        // FORCE QUIT FROM THE CURRENT EXERCICE
        quit        : function($this) {
            var settings = helpers.settings($this);
            $this.find("#"+settings.id)[settings.last]('quit');
        },

            // GET EXERCICE AND LAUNCH
        exercice    : function($this, _args) {
            var settings = helpers.settings($this);
            // HANDLE ARGS
            var tmp     = new Date();
            var args    = "?debug="+tmp.getTime();
            for (var i in _args) { args+="&"+i+"="+_args[i]; }

            // GET EXERCICE FROM DATABASE AND LAUNCH
            var url     = "api/exercice.php"+args;
            $.getJSON(url, function (data) {
                var d = data.data;
                if (data.locale) { if (d.locale) { d.locale = $.extend(d.locale, data.locale); } else { d.locale = data.locale; } }
                d.label = data.label;
                if (settings.onexercice) { settings.onexercice($this, data.id, data.activity); }

                if (data.ext && jlodbext && jlodbext[data.ext]) {
                    jlodbext[data.ext].js(function() { helpers.run($this,data.activity, d); });
                }
                else { helpers.run($this,data.activity, d); }
            });
        },

        // CLOSE THE EXERCICE
        end: function($this, _hide) {
            var settings = helpers.settings($this);
            if (_hide) {
                $this.find("#"+settings.id).html("").hide();
                if (!settings.isvisible) { $this.hide(); }
            }
            settings.onevent($this,false);
        }

    };

    // The plugin
    $.fn.jlodb = function(method) {

        // public methods
        var methods = {
            init: function(options, args) {
                // The settings
                var settings = {
                    last        : "",
                    args        : "",
                    context     : {
                        onquit : function($activity, _ret) {
                            var $this = $activity.closest(".jlodb"), settings = helpers.settings($this);
                            if (_ret.status!="success" || !settings.onscore($this, _ret)) { helpers.end($this, true); }
                        },
                        onload: function($activity) {
                            var $this = $activity.closest(".jlodb"), settings = helpers.settings($this);
                            if (!settings.isvisible) { $this.show(); }
                            $this.find("#"+settings.id).show();
                            settings.onevent($this,true);
                        }
                    }
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
                    helpers.settings($this, $settings);
                    $this.addClass("jlodb");
                    if (args && args.activity && args.args) { helpers.run($this, args.activity, args.args); }
                    else                                    { helpers.exercice($this, args); }
                });
            },
            quit: function() { helpers.quit($(this)); return $(this);},
            close: function(_hide) { helpers.end($(this), _hide); return $(this); },
            reload: function() { helpers.end($(this), false); helpers.rerun($(this)); return $(this); }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in jlodb plugin!'); }
    };
})(jQuery);

