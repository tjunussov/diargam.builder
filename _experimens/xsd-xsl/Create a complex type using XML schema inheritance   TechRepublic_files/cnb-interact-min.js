CNB.SocialShare = new Class({
    Implements: [Options, Events],
    options: {
        title: '',
        url: '',
        shortUrl: '',
        summary: '',
        container: document.body,
        twitterRelated: '',
        onBuzzSumbit: function() {
            window.open('http://buzz.yahoo.com/buzz?targetUrl='+this.url+'&headline='+this.title+'&summary='+this.summary);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;yahoo-buzz;click'});
        },
        onYahooBuzzSubmit: function() {
            window.open('http://buzz.yahoo.com/buzz?targetUrl='+this.url+'&headline='+this.title+'&summary='+this.summary);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;yahoo-buzz;click'});
        },
        onHackerNewsSubmit: function() {
            window.open('http://news.ycombinator.com/submitlink?u='+this.url+'&t='+this.title+'&summary='+this.summary);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;hacker-news;click'});
        },
                
        onDiggSubmit: function() {
            window.open('http://digg.com/submit?url=' + this.url + '&title=' + this.title);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;digg;click', usrAction: 152}); //Digg Referral        
        },
        onEmailSubmit: function() {
            window.open('mailto:?subject=' + this.title + '&body=' + this.url + ' %0D%0D' + this.summary);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;email;click', usrAction: 19}); //Send Article Via Email            
        },
        onFacebookSubmit: function() {
            var c = this.getPopUpCoords(626, 436);
            window.open('http://www.facebook.com/sharer.php?u=' + this.url + '&t=' + this.title, 'facebook_share', 'width='+c.w+',height='+c.h+',left='+c.x+',top='+c.y+',toolbar=0,personalbar=0,status=0,resizable=1');

            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;facebook;click', usrAction: 501}); //Facebook Sharing        
        },
        onRedditSubmit: function() {
            window.open('http://reddit.com/submit?url=' + this.url + '&title=' + this.title);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;reddit;click'});
        },
        onStumbleuponSubmit: function() {
            window.open('http://www.stumbleupon.com/submit?url=' + this.url);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;stumbleupon;click'});
        },
        onTwitterSubmit: function() {
            var c = this.getPopUpCoords(550, 450);
            var twitterUrl = 'http://twitter.com/share?text='+this.title;
            twitterUrl += '&related='+encodeURIComponent(this.options.twitterRelated);
            twitterUrl += (!this.shortUrl) ? '&url='+this.url : '&url='+this.shortUrl+'&counturl='+this.url;

            window.open(twitterUrl, 'twitter_tweet', 'width='+c.w+',height='+c.h+',left='+c.x+',top='+c.y+',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
                
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;twitter;click', usrAction: 460, tag: 'twitter'}); //Twitter Sharing
        },
        onDeliciousSubmit: function() {
            window.open('http://del.icio.us/post?url=' + this.url + '&title=' + this.title);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;delicious;click'});
        },
        onGoogleBuzzSubmit: function() {
            window.open('http://www.google.com/buzz/post?url=' + this.url);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;google-buzz;click'});
        },
        onNewsvineSubmit: function() {
            window.open('http://www.newsvine.com/_tools/seed&amp;save?url=' + this.url + '&title=' + this.title);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;newsvine;click'});
        },
        onTechnoratiSubmit: function() {
            window.open('http://technorati.com/faves?add=' + this.url);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;technorati;click'});
        },
        onLinkedInSubmit: function() {
            window.open('http://www.linkedin.com/shareArticle?mini=true&url=' + this.url + '&title=' + this.title + '&summary=' + this.summary);
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;linked-in;click'});
        },
        onPrintSubmit: function() {
        	window.print();
            DW.redir({ctype: 'shareapp;type;evt', cval: 'sharebar;print;click'});
        }
    },

    initialize: function(options){
        this.setOptions(options);
        
        if (!this.options.title || !this.options.url) {
            return false;
        }
        
        this.url = this.options.url;
        this.shortUrl = this.options.shortUrl;
        this.title = this.options.title;
        this.summary = this.options.summary;
        
        this.encodedUrl = encodeURIComponent(this.options.url);
        this.encodedShortUrl = encodeURIComponent(this.options.shortUrl);
        this.encodedTitle = encodeURIComponent(this.options.title);
        this.encodedSummary = encodeURIComponent(this.options.summary);
        
        this.load(this.options.container);
    },
    
    load: function(container) {
        this.fireEvent('load');
        $(container).addEvent('click:relay(a[shareaction])',  this.handleShareAction.bind(this));
    },

    handleShareAction: function(e, el) {
        e.stop();
        
        var action = el.getProperty('shareaction');
        
        this.fireEvent(action+'Submit');
    },

    getPopUpCoords: function(w, h) {
        var sw = screen.width, sh = screen.height;
        var x = Math.round((sw/2)-(w/2));
        var y = (sh > h) ? Math.round((sh/2)-(h/2)) : 0;
 
        return {
            x: x, y: y, w: w, h: h
        };
    }
});


CNB.TR.SocialShare = new Class({
    Extends: CNB.SocialShare,
    options: {
        twitterRelated: 'techrepublic,zdnet'
    },
    
    initialize: function(container, options) {
       this.parent(container, options);
       this.setOptions(options);
       this.twitterRelated = this.options.twitterRelated;
    },
    
    loadThirdParty: function(opts) {
        window.addEvent('domready', function() {
            if (opts.contains('facebook')) {
            	this.loadFacebook();
            }
    
            if (opts.contains('twitter')) {
            	this.loadTwitter();
            }
    
            if (opts.contains('stumbleupon')) {
            	this.loadStumbleupon();
            }
        }.bind(this));
    },
    
    loadFacebook: function(opts) {
    	var el = $(this.options.container).getElement('.fb-share-btn');
    	if(!el){
    		return;
    	}
    	el.setProperties({
    		'share_url' : this.url,
    		'name' : 'fb_share',
    		'type' : 'box_count',
        	'share_title' : this.title
    	});
    	var s1 = document.createElement('script'); 
    	s1.type = 'text/javascript';
        s1.src = 'http://static.ak.fbcdn.net/connect.php/js/FB.Share';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(s1);
    },
    
    loadTwitter: function(opts) {
    	var el = $(this.options.container).getElement('.twitter-share-button');
    	var twitterRelated = this.options.twitterRelated;
    	if(!el){
    		return;
    	}
    	el.setProperties({
    		'data-url': this.shortUrl, //short url set here
    		'data-counturl': this.url, //permalink/long url for matching counts shared from short and long versions
    		'data-count': 'vertical', //this is the type of button - see doc: http://dev.twitter.com/pages/tweet_button
    		'data-text': this.title,
    		'data-related' : this.twitterRelated
    	});
    	
        var s2 = document.createElement('script'); 
        s2.type = 'text/javascript';
        s2.src = 'http://platform.twitter.com/widgets.js';
        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(s2);
    },
    
    loadStumbleupon: function(opts) {
    	var suCont = $(this.options.container).getElement('.su-share-cont');
        if (suCont) {
            suCont.set('html', '<iframe src="http://www.stumbleupon.com/badge/embed/5/?url='+this.url+'" scrolling="no" frameborder="0" style="border:none;overflow:hidden;width:50px;height:60px;" allowTransparency="true"></iframe>');
        }
    }
    
});





CNB.Voting = new Class({
    Implements: [Options, Events],
    options: {
        url: null,
        container: null, //container to delegate click events
        loadingContainer: null, //container to add loader to
        btn: null, //pass in btn to bypass built in click events (init after click)
        data: {
            cid: null,
            title: null,
            url: null,
            ct: null,
            siteId: null, //future
            assetTypeId: null //future        
        },
        hasVoted: false,
        onSuccess: function(data) {
            var suffix = (data.voteCount == 1) ? 'Vote' : 'Votes';
            var voteCount = (data.voteCount > 0) ? '+'+data.voteCount : data.voteCount;
            
            this.container.getElement('.count').set('text', voteCount);
            this.container.getElement('.suffix').set('text', suffix);           
        },
        onClick: function(btn) {
           
        }
        //onComplete: $empty,
        //onStartRequest: $empty
    },

    initialize: function(options){
        this.setOptions(options);
        
        this.voteHistory = Cookie.read('service');
        
        this.data = this.options.data;

        this.url = this.options.url;
        this.container = $(this.options.container);
        this.loadingContainer = $(this.options.loadingContainer);
        this.btn = this.options.btn;
    },
    
    // use this to addEventHandlers
    activate: function() {
        this.container.addEvent('click:relay(a[voteaction])',  this.handleClickEvent.bind(this));
    },

    handleClickEvent: function(e, el) {
        e.stop();

        this.btn = el;
        this.attempt();
    },
    
    attempt: function() {
        if (!this.container) {
            this.container = this.btn;
        }
        
        if (this.container.retrieve('voted') === true || this.btn.hasClass('disabled')) {
            return false;
        }

        if (this.loadingContainer) {
            this.loader = new CNB.Loading(this.loadingContainer);
        }


        this.fireEvent('click', this.btn);
        
        CNB.Reg.gatedEvent(null, this.handleVoteInit.bind(this), 'tbar-vote', 'Please Log In To Cast Your Vote.');    
    },
    
    handleVoteInit: function() {
        var action = this.btn.getProperty('voteaction');
        var credit;

        switch(action) {
            case 'vote-up':
                credit = '1';
            break;
            case 'vote-down':
                credit = '-1';
            break;
            default:
                CNB.log('no voteaction found');
        }

        this.data = $merge(this.data, {
            'cr': credit        
        });

        this.makeVoteRequest();
    },

    makeVoteRequest: function() {
        //set loading
        if (this.loader) {
           this.loader.add();
        }
        
        this.container.store('voted', true);
        
        this.fireEvent('startRequest');

        //make jsonp request
        var request = new Request.JSON({
            url: this.url,
            data: this.data,
            onSuccess: this.handleVoteResponse.bind(this),
            onComplete: function() {
                if (this.loader) {
                   this.loader.remove();
                }                
                this.fireEvent('complete');
            }.bind(this)
        }).send();
    },
    
    handleVoteResponse: function(data) {
        if(!data || typeof data.status == 'undefined') {
            return false;
        }

        if(data.status == 'success') {
            this.fireEvent('success', data);
            
            this.disableBtns();
            
            DW.redir({usrAction: 421}); //Rate it
        } else {
            if(typeof data.gate != 'undefined') {
                switch(data.gate) {
                    case 'login':
                        CNB.Reg.gatedEvent(null, this.handleVoteInit.bind(this), 'tbar-vote', 'Please Log In To Cast Your Vote.');
                        break;
                    case 'confirm':
                        CNB.Reg.confirmAccount();
                        break;
                } 
            }
        }
    },
    
    disableBtns: function() {
        var btns = this.container.getElements('a[voteaction]');
        
        if (btns) {
            btns.each(function(btn) {
                btn.addClass('disabled');
            });
        }
    }
});


CNB.TR.Voting = new Class({
    Extends: CNB.Voting,
    options: {
       onSuccess: function(data) {
           var suffix = (data.voteCount == 1) ? 'Vote' : 'Votes';
           var updatedCount = parseInt(this.options.voteCount) + parseInt(data.cr);
           this.container.getElement('.count').set('text', updatedCount);
           this.container.getElement('.suffix').set('text', suffix);  
           this.container.getElement('.status').addClass('on');
       },
       onClick: function(container) {
           this.loader = new CNB.Loading(container.getElement('.status'));
       }
    },
    
    initialize: function(container, options) {
       this.parent(container, options);
    }
});
