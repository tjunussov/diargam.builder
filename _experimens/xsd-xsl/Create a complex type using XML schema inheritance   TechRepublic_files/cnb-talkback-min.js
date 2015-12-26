CNB.Talkback=new Class({Implements:[Options,Events],options:{onReportClicked:function(btn){this.addLoader(btn)},onReplyClicked:function(btn){this.addLoader(btn)},onEditClicked:function(btn){this.addLoader(btn)},onDeleteClicked:function(btn){this.addLoader(btn)},onReportLoad:function(btn){var content=btn.retrieve('content');this.initLoadedContent(btn);content.inject(this.getCmntContainer(btn),'bottom');this.removeLoader(btn)},onDeleteLoad:function(btn){var content=btn.retrieve('content');this.initLoadedContent(btn);content.inject(this.getCmntContainer(btn),'bottom');this.removeLoader(btn)},onReplyLoad:function(btn){var content=btn.retrieve('content');this.initLoadedContent(btn);content.inject(this.getCmntContainer(btn),'bottom');this.removeLoader(btn)},onEditLoad:function(btn){var currentContent=this.getCmntContent(btn);currentContent.setStyle('display','none');var content=btn.retrieve('content');this.initLoadedContent(btn);content.inject(currentContent,'after');this.removeLoader(btn)},onPostSuccess:function(form,data){if(data.redirectUrl){window.location=data.redirectUrl}var content=CNB.htmlToElement(data.html);var container=(data.injectId)?$(data.injectId):null;if(container){container.empty().adopt(content)}else{content.inject(this.threadContainer,'bottom')}if(data.threadId&&data.forumId){var resetData={'forumId':data.forumId,'threadId':data.threadId};this.updatePostData(form,resetData)}this.resetForm(form);this.fireEvent('cmntAdded',content)},onDeleteSuccess:function(btn,data){var container=this.getCmntContainer(btn);container.empty().addClass(this.options.cmntClass.deleted).set('html','<p>Message has been deleted.</p>');this.unloadAction(btn)},onReportSuccess:function(btn,data){btn.getParent('li').set('html','Reported');this.unloadAction(btn)},onReplySuccess:function(btn,data){this.unloadAction(btn);var content=CNB.htmlToElement(data.html);content.inject(this.getCmntContainer(btn),'after');this.fireEvent('cmntAdded',content)},onEditSuccess:function(btn,data){this.unloadAction(btn);var content=CNB.htmlToElement(data.html);content.replaces(this.getCmntContainer(btn));content.getElement('.'+this.options.cmntClass.container).highlight(this.options.highlightColor);this.fireEvent('cmntEdited',content)},onEditUnload:function(btn){this.getCmntContent(btn).setStyle('display','block')},onActionUnload:function(btn){var content=btn.retrieve('content');if(content!==null)content.destroy()},cmntClass:{container:'cmnt',content:'content',loadingIcon:'loading',deleted:'cmnt-deleted',added:'cmnt-added'},highlightColor:'#aef130',container:document.body,threadContainer:null},initialize:function(options){this.setOptions(options);this.container=$(this.options.container);this.threadContainer=(this.options.threadContainer!==null)?$(this.options.threadContainer):this.container;this.container.addEvents({'click:relay(a[tbkaction])':this.handleClickEvent.bind(this)});this.container.getElements('form[tbkaction]').each(function(form){this.initSubmitEvent(form)},this)},handleClickEvent:function(e,el){e.stop();var action=el.getProperty('tbkaction');CNB.Reg.gatedEvent(null,this.activateAction.pass(el,this),'tkb-'+action,'Please Log In First')},initSubmitEvent:function(form){var action=form.getProperty('tbkaction');var validator=new CNB.Validator(form,{'validateOnBlur':false,'onValidateSuccess':function(e,form){e.stop();CNB.Reg.gatedEvent(null,this.handleActionRequest.pass(form,this),'tkb-'+action,'Please Log In First')}.bind(this)})},activateAction:function(btn){if(this.activated.check(btn,true)){this.unloadAction(btn);return false}var container=this.getCmntContainer(btn);var activeAction=this.activated.get(container);if(activeAction!==null){this.unloadAction(activeAction)}this.loadAction(btn)},loadAction:function(btn){var action=btn.getProperty('tbkaction');this.fireEvent(action+'Clicked',btn);this.activated.set(btn,true);this.activated.set(this.getCmntContainer(btn),btn);var request=new Request.JSON({url:btn.getProperty('href'),onSuccess:function(data){if(typeof data.html=='undefined'){CNB.log('bad data - need to do something here')}var content=CNB.htmlToElement(data.html);btn.store('content',content);this.fireEvent(action+'Load',btn)}.bind(this),onFailure:function(){this.fireEvent('actionLoadFailure',btn);this.fireEvent(action+'LoadFailure',btn);this.removeLoader(btn)}.bind(this),onCancel:function(){CNB.log('has been canceled');this.removeLoader(btn)}.bind(this)});btn.store('request',request);request.get()},unloadAction:function(btn){var action=btn.getProperty('tbkaction');this.activated.remove(btn);this.activated.remove(this.getCmntContainer(btn));var activeRequest=btn.retrieve('request');if(activeRequest!==null){activeRequest.cancel()}this.fireEvent('actionUnload',btn);this.fireEvent(action+'Unload',btn)},handleActionRequest:function(form,btn){var el=(!btn)?form:btn;if(el.retrieve('isActive')){return false}el.store('isActive',true);var req=new Request.JSON({url:form.getProperty('action'),data:form.toJSON(),onSuccess:function(data){this.handleActionResponse(data,el,form)}.bind(this),onComplete:function(){el.store('isActive',false)}.bind(this),onFailure:this.handleActionResponse.pass([{status:'failure',action:'request'},el],this),noCache:true}).post()},handleActionResponse:function(data,el,form){if(typeof data=='undefined'&&typeof data.status=='undefined'){CNB.log('json data is no good');return false}var action=el.getProperty('tbkaction');if(data.status=='success'){CNB.log('firing '+action+'Success');this.fireEvent(action+'Success',[el,data])}else{if(typeof data.gate!='undefined'){switch(data.gate){case'login':CNB.User.set('isLoggedIn',false);CNB.Reg.gatedEvent(null,this.handleActionRequest.pass([form,el],this),'tkb-'+action,'Please Log In First');break;case'confirm':CNB.Reg.confirmAccount();break}}else if(typeof data.errors!='undefined'){this.displayErrors(form,data.errors)}this.fireEvent(action+'Failure',[el,data])}},handleActionCancel:function(e,btn){e.stop();this.unloadAction(btn)},initLoadedContent:function(btn){var content=btn.retrieve('content');content.getElements('form').each(function(form){this.getValidator(form).addEvent('validateSuccess',function(e,form){e.stop();this.handleActionRequest(form,btn)}.bind(this))},this);content.getElements('.cancel').each(function(cancel){cancel.addEvent('click',this.handleActionCancel.bindWithEvent(this,btn))},this)},getCmntContainer:function(btn){return btn.getParent('.'+this.options.cmntClass.container)},getCmntContent:function(btn){return this.getCmntContainer(btn).getElement('.'+this.options.cmntClass.content)},activated:{set:function(el,value){var store=(value!==null)?value:true;el.store('activated',store)},get:function(el){return el.retrieve('activated')},check:function(el,value){var stored=el.retrieve('activated');if(stored!==null){return stored}else{if(value!==null){this.set(el,value)}return false}},remove:function(el){el.eliminate('activated')}},displayErrors:function(form,errors){var validator=this.getValidator(form);$splat(errors).each(function(error){validator.addGlobalError(error)})},addLoader:function(btn){btn.addClass(this.options.cmntClass.loadingIcon)},removeLoader:function(btn){btn.removeClass(this.options.cmntClass.loadingIcon)},getValidator:function(form){var validator=form.retrieve('validator');if(validator===null){validator=new CNB.Validator(form,{validateOnBlur:false})}return validator},resetForm:function(form){form.reset();form.getElements('input[placeholder]').each(function(input){var ph=input.retrieve('placeholder');if(ph!==null){ph.addPlaceholder(input)}})},updatePostData:function(form,data){$each(data,function(val,key){var input=form.getElement('input[name='+key+']');if(input!==null){input.setProperty('value',val)}})}});CNB.TR.Talkback=new Class({Extends:CNB.Talkback,options:{onSelectAnswerClicked:function(btn){this.addLoader(btn)},onEditorsPickClicked:function(btn){this.addLoader(btn)},onTakeOfflineClicked:function(btn){this.addLoader(btn)},onReportLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onDeleteLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onReplyLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onEditorsPickLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onSelectAnswerLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onTakeOfflineLoad:function(btn){this.loadContent(btn);this.removeLoader(btn)},onActionUnload:function(btn){this.unloadContent(btn)},onReportSuccess:function(btn,data){this.unloadAction(btn);btn.getParent('li').set('html','Flagged')},onEditorsPickSuccess:function(btn,data){this.unloadAction(btn);btn.set('text','Picked')},onSelectAnswerSuccess:function(btn,data){this.unloadAction(btn);btn.set('text','Selected as Answer')},onReplySuccess:function(btn,data){this.unloadAction(btn);var content=CNB.htmlToElement(data.html);if(data.injectId&&$(data.injectId)){content.inject($(data.injectId),'top')}else{content.inject(this.getCmntContainer(btn),'after')}this.fireEvent('cmntAdded',content)},onPostSuccess:function(form,data){if(data.redirectUrl){window.location=data.redirectUrl}var content=CNB.htmlToElement(data.html);var container=(data.injectId)?$(data.injectId):null;if(container){container.empty().adopt(content)}else{content.inject(this.threadContainer,'bottom')}if(data.threadId&&data.forumId){var resetData={'forumId':data.forumId,'threadId':data.threadId};this.updatePostData(form,resetData)}this.resetForm(form)},onTakeOfflineSuccess:function(btn,data){if(data.redirectUrl){window.location=data.redirectUrl}},onGetMessageClicked:function(btn){this.msgLoader=new CNB.Loading(this.getCmntContainer(btn).getElement('.int')).add()},onGetMessageLoad:function(btn){var content=btn.retrieve('content');content.replaces(this.getCmntContainer(btn))},onGetMessageLoadFailure:function(btn){this.msgLoader.remove()},postForm:null,highlightColor:'#cbe7a2'},initialize:function(options){this.parent(options);this.postForm=$(this.options.postForm);if(this.postForm){this.postForm.getElements('input[type=text], textarea').each(function(el){el.addEvent('focus',function(){if(!CNB.User.get('isLoggedIn')){CNB.Reg.login()}})},this)}this.addEvents({'cmntAdded':this.handleCmntAdded.bind(this)});this.container.addEvents({'click:relay(a[voteaction])':this.handleVote.bind(this)});this.initReplyExpand();this.initContentExpand()},loadContent:function(btn){var content=btn.retrieve('content');var container=this.getCmntContainer(btn);this.initLoadedContent(btn);if(container.hasClass('cmnt-feature')){container=container.getElement('.int')}content.inject(container,'bottom');this.removeLoader(btn);var slide=new Fx.Slide(content,{'mode':'vertical','onStart':function(){if(this.open){this.wrapper.setStyle('overflow','hidden')}},'onComplete':function(){if(this.open){this.wrapper.setStyle('overflow','visible')}}}).hide().slideIn();btn.store('slide',slide)},unloadContent:function(btn){var slide=btn.retrieve('slide');var content=btn.retrieve('content');if(slide!=null){slide.slideOut().chain(function(){content.destroy()}.bind(this))}else{if(content!=null){content.destroy()}}},handleCmntAdded:function(container){var el=container.getElement('.'+this.options.cmntClass.container);el.set('tween',{duration:3000});el.addClass(this.options.cmntClass.added).highlight(this.options.highlightColor)},handleVote:function(e,el){e.stop();var container=el.getParent('.cmnt-vote');var voting=new CNB.Voting({url:el.getProperty('href'),container:container,loadingContainer:container.getElement('.int'),btn:el}).attempt()},notify:function(btn,msg){btn.retrieve('content').set('html','<p>'+msg+'</p>');this.unloadAction.delay(2000,this,btn)},disablePostForm:function(){this.postForm.getElements('input[type=text], textarea').each(function(el){el.setProperty('disabled','disabled')},this);this.postForm.setStyle('opacity','.5')},enablePostForm:function(){this.postForm.getElements('input[type=text], textarea').each(function(el){el.removeProperty('disabled')},this);this.postForm.setStyle('opacity','1')},initReplyExpand:function(){var groups=this.container.getElements('.reply-group');var limit=3;groups.each(function(group){var msgs=group.getElements('.cmnt');if(msgs.length>limit){var cont=new Element('div').inject(group);var removedMsgs=msgs.splice(limit,msgs.length-limit);cont.adopt(removedMsgs);var exand=new CNB.Expander(cont,{'btnClass':'view-more clear','btnText':{'show':'Show '+removedMsgs.length+' More Comments +','hide':'Show Less -'}})}},this)},initContentExpand:function(){var containers=this.container.getElements('.content-expandable');$splat(containers).each(function(container){var excerpt=new CNB.ExcerptContent(container,{textMore:'Read Whole Comment&nbsp;+'})})}});CNB.TR.StartThread=new Class({Implements:[Options,Events],options:{suggestThreadsUrl:null,postDiscussionUrl:null,forumType:'discussions',subjectInjectId:null},initialize:function(form,options){this.setOptions(options);this.form=$(form);this.validator=new CNB.Validator(this.form,{'validateOnBlur':false});this.subjectInject=$(this.options.subjectInjectId);this.subjectField=this.form.getElement('[name=subject]');this.subjectField.addEvent('blur',this.makeSuggestThreadsRequest.bind(this));if(this.options.forumType=='questions'){this.subjectField.addEvent('blur',this.checkForQuestion.bind(this))}this.initWaterCoolerTag()},makeSuggestThreadsRequest:function(){var query=this.subjectField.value;if(!query){this.subjectInject.empty();return false}var req=new Request.JSON({url:this.options.suggestThreadsUrl,data:{q:query},onSuccess:this.handleSuggestThreadsResponse.bind(this),noCache:true}).post()},handleSuggestThreadsResponse:function(data){if(typeof data.html=='undefined'||data.html.trim()==''){return false}var content=CNB.htmlToElement(data.html);this.subjectInject.empty().adopt(content)},checkForQuestion:function(e,form){var subject=this.subjectField.value.trim();if(subject!=''&&subject.charAt(subject.length-1)!='?'){this.validator.addError(this.subjectField,'Your subject is not in the form of a question. <a href="'+this.options.postDiscussionUrl+'?subject='+encodeURIComponent(subject)+'" class="c-3 heavy">Post as Discussion &raquo;</a>')}else{this.validator.removeError(this.subjectField)}},initWaterCoolerTag:function(){var tags=this.form.getElements('[name^=tags]');var wcTag=null;tags.each(function(el,i){if(el.getProperty('id')=='start-thread-tags-watercooler'){wcTag=tags.splice(i,1)}});if(wcTag){wcTag[0].addEvent('click',function(e){var isChecked=$(this).checked;tags.each(function(el){if(isChecked){el.removeProperty('checked')}})});tags.addEvent('click',function(e){var isChecked=$(this).checked;if(isChecked){wcTag[0].removeProperty('checked','checked')}})}}});