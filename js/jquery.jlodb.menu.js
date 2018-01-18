(function($) {
    var defaults = {
        onclick : function($this, _args) {},
        onupdate: function($this, _state, _lastId) {},
        large   : 12
    };

    // private methods
    var helpers = {
        // Get the settings
        settings: function($this, _val) { if (_val) { $this.data("settings", _val); } return $this.data("settings"); },

        state : function($this, _id) {
            var settings = helpers.settings($this);
            $this.find(".menu #"+_id+" .state").removeClass()
                 .addClass("state"+(settings.state[_id]!='.'?" s"+settings.state[_id]:""));
        },
        drag: function($this) {
            var settings = helpers.settings($this);
            var y= ($this.find(".cursor").offset().top-$this.find(".slider").offset().top)/
                   ($this.find(".slider").height()-$this.find(".cursor").height());
            $this.find(".header").toggle((y>0));
            $this.find(".footer").toggle((y<0.999));
            var val = -Math.floor(y*(20+$this.find(".menu").height()-$this.find(".jmenu").height()));
            $this.find(".menu").css("top",val+"px");
        },
        build: function($this) {
            var settings = helpers.settings($this);
            while (settings.state.length < settings.list.length) { settings.state+="l"; }

			$this.html("<div class='jmenu'><div class='menu"+(settings.list.length<=settings.large?" large":"")+"'></div></div>");
						
            /* $this.html("<div class='jmenu'><div class='slider'><div class='cursor'></div></div><div class='header'></div>"+
                        "<div class='footer'></div><div class='menu"+(settings.list.length<=settings.large?" large":"")+"'></div></div>");
						*/
            for (var i in settings.list) {
                $this.find(".menu").append("<div class='icon"+(i>=99?" gtc":"")+"' id='"+i+"' onclick='$(this).closest(\".jmenu\").parent().menu(\"click\", "+i+");event.stopPropagation();' ontouchstart='$(this).closest(\".jmenu\").parent().menu(\"click\","+i+");event.stopPropagation();event.preventDefault();'><div class='legend'>"+(parseInt(i)+1)+"</div><div class='state sl'></div></div>");
            }

            for (var i=0; i<settings.state.length; i++) { helpers.state($this,i); }

			/*
            if ($this.height()<$this.find(".menu").height()) {
                $this.find(".slider").css("opacity",1);
                $this.find(".cursor").draggable({ axis:"y", containment:"parent", drag:function() { helpers.drag($this); }});
                helpers.drag($this);
            }
            else { $this.find(".slider").css("opacity",0); }
			*/
        },
        run: function($this, _id) {
            var settings = helpers.settings($this);
            if (!$this.find("div.icon#"+_id+" .state").hasClass("sl")) {
                settings.last = _id;
                settings.onclick($this, { id:settings.list[_id]} );
            }
        },
        update: function($this, _score) {
            var settings = helpers.settings($this);
            if (settings.last!=-1 && settings.state[settings.last]!='l') {
                if (settings.state[settings.last]=='.' || parseInt(settings.state[settings.last])<=_score) {

                    settings.state = settings.state.substr(0, settings.last)+_score.toString()+settings.state.substr(settings.last+1);
                    helpers.state($this,settings.last);

                    if (settings.last<settings.list.length-1 && settings.state[settings.last+1]=='l') {
                        settings.state = settings.state.substr(0, settings.last+1)+"."+settings.state.substr(settings.last+2);
                        helpers.state($this,settings.last+1);
                    }

                    settings.onupdate($this, settings.state, settings.last);
                }
            }
        },
    };

    // The plugin
    $.fn.menu = function(method) {

        // public methods
        var methods = {
            init: function(options) {
                // The settings
                var settings = {
                    last: -1
                };

                return this.each(function() {
                    var $this = $(this);

                    var $settings = $.extend(true, {}, defaults, options, settings);
                    helpers.settings($this, $settings);
                    helpers.build($this);
                });
            },
            score: function(_score) { helpers.update($(this), _score); return $(this); },
            click: function(_id) { helpers.run($(this), _id); return $(this); },
            next: function() { helpers.run($(this), helpers.settings($(this)).last+1); return $(this); },
            more: function() {
                var $this = $(this), settings = helpers.settings($this);
                return (settings.last<settings.list.length-1);
            },
            state: function() { return helpers.settings($(this)).state; }
        };

        if (methods[method])    { return methods[method].apply(this, Array.prototype.slice.call(arguments, 1)); } 
        else if (typeof method === 'object' || !method) { return methods.init.apply(this, arguments); }
        else { $.error( 'Method "' +  method + '" does not exist in jlodb menu plugin!'); }
    };
})(jQuery);

