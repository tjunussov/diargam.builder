/*
 * DV 1.4.7 - JavaScript Diagram
 *
 * Copyright (c) 2010 Timur Junussov (http://bee.kz)
 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
 */
 
 
var DV = {
	overlay : null,
	prop : null,
	canvas:null,
	notepad:null,
	ctx:null,
	container:null,
	offsetY:0,
	offsetX:0,
	pointer:null,
	pointerAfterDrag:false,
	setup : function(canvasName)
	{	
		this.notepad = document.getElementById(canvasName);
		this.prop = document.createElement("DIV");
		this.prop.className = "wx-dv properties";
		this.overlay = document.createElement("DIV");
		this.overlay.className = "wx-dv overlay";
		this.prop.innerHTML = '<span class="closeBut" onclick="DV.hideNode()">Close</span><div></div>';
		document.body.appendChild(this.overlay);
		document.body.appendChild(this.prop);
		
		this.container = document.createElement("DIV");
		this.container.className="wx-dv container";
		this.container.style.position = "relative";
		/*this.container.onclick = function(){
			console.log("Dragged");	
		}*/
		$(this.notepad).append($('<span id="inputProcessName" class="wx-dv-processname">Chuhan</span>'));
		this.notepad.appendChild(this.container);
		
		this.canvas = document.createElement("canvas");
		this.canvas.style.position = "absolute";
		this.canvas.style.zIndex = "0";
		this.canvas.oncontextmenu = function(){return false;}
		//this.canvas.onselectstart = function () { return false; }
		this.ctx = this.canvas.getContext('2d');
		
		this.pointer = document.createElement("div");
		this.pointer.className="wx-dv-pointer";
		this.pointer.oncontextmenu = function(){return false;}

		$(this.pointer).draggable({zIndex: 2700,which:3,distance:20, 
			drag:function(event,ui){
				DV.drawTP(ui);
			},
			stop: function(event, ui) {
				if(! $.ui.ddmanager.drop( $(this).data("draggable"), event ))  DV.drawTP(ui,true);
				else DV.pointerAfterDrag = true;
			}
		});
		
		this.pointer.onmouseup = function(){ 
			DV.pointer.style.display = "none";
			return false;
		}
		
		$(document).keyup(function (event) {
			if(event.keyCode == 46 && DV.selectedNode) {
				DV.deleteNode(DV.selectedNode);
				DV.selectedNode = null;
			}
		});
		
		$(document.body).click(function (e) {
			if(!e.originalEvent.isNode) DV.selectNode(null);
		});
		
		this.loadSettings();
		
		$("#toolOpen").contextMenu(function(e) {
				var opts = new Array();
				
				opts.push({'definition':{onclick:function(){DV.init('data/process-definition.xml')}}});
				opts.push({'definitionX':{onclick:function(){DV.init('data/process-definitionX.xml')}}});
				opts.push({'definition-da':{onclick:function(){DV.init('data/definition-da.xml')}}});
				opts.push({'Translate to English':{disabled:true}});
				opts.push($.contextMenu.separator);
				opts.push({'process-instanceX':{onclick:function(){DV.loadInstance('data/process-instanceX.xml')}}});
				opts.push({'instance-da':{onclick:function(){DV.loadInstance('data/instance-da.xml')}}});
				
				return opts;
				
		  });
		
	},
    init : function (url) {
		$.ajax({type: "GET",url: url,dataType:"xml",success:function(xml){DV.loaded(xml)}});
    },
	
	/*-------PARSING---------*/
	
	nodes : new Array(),
	transitions : new Array(),
	processName : "",
	ga : function (node,name){
		if(node.attributes.getNamedItem(name))
			return node.attributes.getNamedItem(name).nodeValue;
		return "";
	},
	processDefinition : null,
	loaded : function (xml){
		this.processDefinition = xml;
		var pd = xml.documentElement;
		
		
		document.getElementsByTagName("title")[0].innerHTML = "Diagram Viewer : " + ( this.ga(pd,"label") ? this.ga(pd,"label") : this.ga(pd,"name"));

		this.container.innerHTML = "";
		
		this.container.appendChild(this.canvas);
		this.container.appendChild(this.pointer);
		
		inputProcessName.innerHTML = this.ga(pd,"name") + " : " + this.ga(pd,"label");
		
		var nodes = new Array();
		this.nodes = nodes;
		
		this.transitions = new Array();
		
		if(pd.childNodes)
		for(var n=0; n < pd.childNodes.length; n++){
			var node = pd.childNodes[n];
			var nodeName = node.tagName;
			
			if(nodeName == null || nodeName == 'description' || nodeName == 'swimlane' || nodeName == 'variable' || nodeName == 'event' || nodeName == 'expression') continue;
			
			nodes.push(node);
			
			var x = Number(this.ga(node,"x"))
			var y = Number(this.ga(node,"y"))
			
			if(x < this.offsetX ) this.offsetX = x - 50;
			if(y < this.offsetY ) this.offsetY = y - 50;
			
		}
		
		this.offsetX = Math.abs(this.offsetX);
		this.offsetY = Math.abs(this.offsetY);
		
		this.processName = this.ga(pd,"name");
		
		this.pH = Number(this.ga(pd,"height"));
		this.pW = Number(this.ga(pd,"width"));
		
		
		if(this.notepad.clientWidth < (this.pW + this.offsetX) ){
			this.container.style.width = this.pW + this.offsetX + 'px';
			this.canvas.width = this.pW + this.offsetX;
			
		} else {
			this.container.style.width = '100%';
			this.canvas.width = this.notepad.offsetWidth - 30;
		}
		
		if(this.notepad.clientHeight < (this.pH + this.offsetY) ){
			this.container.style.height = this.pH +  this.offsetY +'px';
			this.canvas.height = this.pH + this.offsetY;
		} else {
			this.container.style.height = '96%';
			this.canvas.height = this.notepad.offsetHeight - 30;
		}
				
		
		
		
		for(var n=0; n < nodes.length; n++){
			this.drawNode(nodes[n]);
		}
		
		for(var n=0; n < nodes.length; n++){
			var node = nodes[n];
			var nodeName = node.tagName;
			
			for(var t=0; t < node.childNodes.length; t++){
				var transition = node.childNodes[t];

				if(transition.tagName != 'transition') continue;
				
				transition.fromNode = node;
				transition.toNode = this.getNodeByName(this.ga(transition,"to"));
				
				this.drawTransition(transition,false);				
				
				this.transitions.push(transition);
			}
		}
	
	},
	getNodeByName : function (name){
		for(var n=0; n < this.nodes.length; n++){
			var node = this.nodes[n];
			var nodeName = this.ga(node,"name");
			if(nodeName == name) return node;
		}
		return;
	},	
	getNodeById : function (id){
		for(var n=0; n < this.nodes.length; n++){
			var node = this.nodes[n];
			var nodeId = this.ga(node,"id");
			if(nodeId == id) return node;
		}
		return;
	}, 
	getTransitionById : function (id){
		for(var t=0; t < this.transitions.length; t++){
			var transition = this.transitions[t];
			var transitionId = this.ga(transition,"id");
			if(transitionId == id) return transition;
		}
		return;
	},
	selectedNode : null,
	selectNode : function (node){
		if(this.selectNode) {
			$(this.selectedNode).removeClass("selected");
		}
		
		this.selectedNode = node;
		$(this.selectedNode).addClass("selected");
		
	},
	deleteNode : function (node){
		node.parentElement.removeChild(node);
	},
	buildTransition : function (fromNode,toNode){
		console.log("Drawing transiontion ");
		fromNode.tempNode = toNode.node; toNode.tempNode = fromNode.node; // patching
		this.drawT(fromNode.node,toNode.node);
	},
	drawT : function(fromNode,toNode){

		var x1 = Number(this.ga(fromNode,"x")+ '.50') + this.offsetX;
		var y1 = Number(this.ga(fromNode,"y")+ '.50') + this.offsetY;
		var x2 = Number(this.ga(toNode,"x")+ '.50') + this.offsetX;
		var y2 = Number(this.ga(toNode,"y")+ '.50') + this.offsetY;
		
		var w = Number(this.ga(fromNode,"width"));
		var h = Number(this.ga(fromNode,"height"));
		var w2 = Number(this.ga(toNode,"width"));
		var h2 = Number(this.ga(toNode,"height"));
		
		var dx1 = Math.round(w / 2);
		var dy1 = Math.round(h / 2);
		var dx2 = Math.round(w2 / 2);
		var dy2 = Math.round(h2 / 2);
		
		var xx1 = x1 + dx1;
		var yy1 = y1 + dy1;
		var xx2 = x2 + dx2;
		var yy2 = y2 + dy2;
		
		this.lines[0] = [xx1,yy1,"#bbb",xx2,yy2,[xx2,yy2]];
		this.redraw();
	},
	drawTP : function(ui,flag){
		var fromNode = ui.helper.context.vnode.node;
		var x1 = Number(this.ga(fromNode,"x")+ '.50') + this.offsetX;
		var y1 = Number(this.ga(fromNode,"y")+ '.50') + this.offsetY;
		var x2 = ui.position.left;
		var y2 = ui.position.top;
		
		var w = Number(this.ga(fromNode,"width"));
		var h = Number(this.ga(fromNode,"height"));
		
		var dx1 = Math.round(w / 2);
		var dy1 = Math.round(h / 2);
		
		var xx1 = x1 + dx1;
		var yy1 = y1 + dy1;
		var xx2 = x2 + 5;
		var yy2 = y2 + 5;
		
		this.lines[0] = [xx1,yy1,"#bbb",xx2,yy2,[xx2,yy2]];
		this.redraw(flag);
	},
	lines : new Array(),
	redraw : function(isClear){
		var ctx = this.ctx;
		//this.canvas.width = this.canvas.width; 
		
		var mima = {x1:0,y1:0,x2:0,y2:0};
		
		ctx.beginPath();
		
		for(i in this.lines){
			var l = this.lines[i];
			ctx.moveTo(l[0],l[1]);
			mima = this.getMinMax(mima,l[0],l[1]);
			var p = l[5];
			for(var j = 0; j < p.length;j+=2){
				ctx.lineTo(p[j],p[j+1]);
				mima = this.getMinMax(mima,p[j],p[j+1]);
				
			}
			ctx.arc(l[3],l[4],5,0,Math.PI*2 ,true);
			ctx.strokeStyle= l[2];
			ctx.fillStyle= l[2];
			
		}
		
		ctx.clearRect(mima.x1,mima.y1,mima.x2-mima.x1+70,mima.y2-mima.y1+20); // Claering region
		//ctx.strokeRect(mima.x1,mima.y1,mima.x2-mima.x1,mima.y2-mima.y1);
		if(!isClear) {
			ctx.stroke();
		//	ctx.fill();
		}
	},
	getMinMax : function(mima,x,y){
			mima.x1 = mima.x1 < x ? mima.x1 : x;
			mima.y1 = mima.y1 < y ? mima.y1 : y;
			mima.x2 = mima.x2 > x ? mima.x2 : x;
			mima.y2 = mima.y2 > y ? mima.y2 : y;
		return mima;
	},
	drawNode : function (node){
		var div = document.createElement("DIV");
			div.className = "node";
			div.style.top = (Number(this.ga(node,"y")) + this.offsetY ) + 'px';
			div.style.left = (Number(this.ga(node,"x")) + this.offsetX ) + 'px';
			div.style.width = this.ga(node,"width") + 'px';
			div.style.height = this.ga(node,"height") + 'px';
			div.style.position = "absolute";
			div.style.zIndex = 10;
			
			div.node = node;
			div.ondblclick = DV.showNode;
			div.setAttribute("tabindex","");
			
			$(div).contextMenu(function(e) {
				var opts = new Array();
				
				if(!this.target.tempNode || !DV.pointerAfterDrag) return false;
				DV.pointerAfterDrag = false;
				
				$(this.target.tempNode).find("transition").each(function(){
					var name = $(this).attr("label") ? $(this).attr("label") : $(this).attr("name");
					if(!name) return;
					var o = {}; o[name]=function(){};
					opts.push(o);
				});
				
				if(opts.length < 1) return false;
				
				opts.push($.contextMenu.separator);
				/*opts.push({'Save as...':{}});
				opts.push({'Print...':{}});
				opts.push({'Translate to English':{disabled:true}});
				opts.push({'View page source':{}});
				opts.push({'View page info':{}});
				opts.push($.contextMenu.separator);*/
				opts.push({'&lt;Any&gt;':{}});
				
				return opts;
				
		  });
			
		   div.onclick = function(e){
			   DV.selectNode(this);
			   e.isNode = true;
			   return e;
			   //e.stopPropagation(); //maybe we should cancel buble
		   }

		   div.onmousedown = function(e){
				if(event.which == 3){
					DV.pointer.style.left = event.x - DV.notepad.offsetLeft - 5  + DV.notepad.scrollLeft + 'px';
					DV.pointer.style.top = event.y - DV.notepad.offsetTop - 5  + DV.notepad.scrollTop + 'px';
					DV.pointer.style.display = "block";
					DV.pointer.vnode = this;
					DV.pointer.focus();
					try { $(DV.pointer).draggable().trigger(e); } catch(e){} // patching
					return false;
				}
			};
			
			div.onmouseup = function(e){
				DV.pointer.style.display = "none";
			};
			
			$(div).draggable({distance: 5, zIndex: 2700,/*scroll:true,scrollSensitivity:40,grid:[10,10],*/
				//stop:function(event,ui){
				drag:function(event,ui){
					DV.updateNode(ui);
				}
			});
			
			$(div).droppable({hoverClass:'ui-droppable-hover',accept:'.wx-dv-pointer',
				drop: function( event, ui ) {
					//console.log(this);
					//$(this).addClass("ui-state-highlight" );//.find("p").html("Dropped!");*/
					DV.buildTransition(this,ui.helper.context.vnode);
				}
			});
			
			
			
		var label = this.ga(node,"label");
			label = ( label == "" ? this.ga(node,"name") : label );
			div.title = label;
			//label = label.length > 12 ? label.substring(0,12)+'...' : label;

			div.innerHTML = '<span class="wx-dv-icon" style="background-image: url(node-types/'+node.tagName.toUpperCase()+'.png)"></span><h3>'+node.tagName+'</h3>'+'<span style="text-overflow: ellipsis; white-space: nowrap; display:inline-block; width:'+(Number(this.ga(node,"width"))-55)+'px; overflow-x:hidden">'+label+'</span>';
			
			this.container.appendChild(div);
			
			node.div = div;
			
			return div;
	},	
	drawTransition : function (transition,isActive){
		var fromNode = transition.fromNode;
		var toNode = transition.toNode;
		var points = transition.getElementsByTagName("bendpoint");
		
		var ctx = this.ctx;
		
		var x1 = Number(this.ga(fromNode,"x")+ '.50') + this.offsetX;
		var y1 = Number(this.ga(fromNode,"y")+ '.50') + this.offsetY;
		var x2 = Number(this.ga(toNode,"x")+ '.50') + this.offsetX;
		var y2 = Number(this.ga(toNode,"y")+ '.50') + this.offsetY;
		
		//console.log(this.ga(fromNode,"x")+":"+this.ga(toNode,"x") + " - " + x1);
		
		var w = Number(this.ga(fromNode,"width"));
		var h = Number(this.ga(fromNode,"height"));
		var w2 = Number(this.ga(toNode,"width"));
		var h2 = Number(this.ga(toNode,"height"));
		
		var dx1 = Math.round(w / 2);
		var dy1 = Math.round(h / 2);
		var dx2 = Math.round(w2 / 2);
		var dy2 = Math.round(h2 / 2);
		
		var xx1 = x1 + dx1;
		var yy1 = y1 + dy1;
		var xx2 = x2 + dx2;
		var yy2 = y2 + dy2;
		
		var lx = xx1;
		var ly = yy1;
		
		ctx.beginPath();
		ctx.moveTo(xx1,yy1);
		
		for(var p = 0; p < points.length; p++){
			lx = xx1 + Number(this.ga(points[p],"w1"));
			ly = yy1 + Number(this.ga(points[p],"h1"));
			ctx.lineTo(lx, ly);
			
			var vBendPoint = document.createElement("DIV");
				vBendPoint.className = "wx-dv-bendpoint";
				vBendPoint.style.top = ly - 4 + 'px';
				vBendPoint.style.left = lx - 4 + 'px';
				
				this.container.appendChild(vBendPoint);
		}
		
		// label
		var label = transition.getElementsByTagName("label")[0];
		var labelText = this.ga(transition,"label");
			labelText = ( labelText != "" ? labelText : 'to ' + this.ga(transition,"to") );
			
		var dX = (xx2 - lx);
		var dY = (yy2 - ly);
		
		var lbx = 0;
		var lby = 0;
		
		if(points.length == 0){
			lbx = (xx2 - lx)/2;
			lby = (yy2 - ly)/2;
			
			if(lby == 0) lby = -5;
			
		}
		else {
			var middle = Math.floor(points.length/2);
			if(points.length%2 == 0){
				var middle = (points.length > 1) ? points.length/2 : 0;
				lbx = (Number(this.ga(points[middle-1],"w1")) + Number(this.ga(points[middle],"w1")))/2;
				lby = (Number(this.ga(points[middle-1],"h1")) + Number(this.ga(points[middle],"h1")))/2;
			}
			else {
				
				lbx = Number(this.ga(points[middle],"w1"));
				lby = Number(this.ga(points[middle],"h1"));
			}
		}
		
		// 
		
		// label
		
		if(labelText && !isActive){
		
			var minSize = this.ga(fromNode,"width") > this.ga(toNode,"width") ? this.ga(toNode,"width") : this.ga(fromNode,"width");
		
			var vLabel = document.createElement("DIV");
				vLabel.className = "wx-dv-label";
				vLabel.style.width = minSize + 'px';
				vLabel.innerText = labelText;
				vLabel.title = labelText;
				
				this.container.appendChild(vLabel);
				
				vLabel.style.top = yy1 + lby + Number(this.ga(label,"y")) + 'px';
				vLabel.style.left = xx1 + lbx + Number(this.ga(label,"x")) /* - minSize/2 */ + 'px';
		}
		// arrow
		var alpha = 0;
		var degree = alpha*(180/Math.PI);
		
		var ddX = 0;
		var ddY = 0;
		
		var d = Math.PI/6;
				
		if(Math.abs(dX/dY) < w2/h2){
			if(dY >= 0){ 
				ddY = dY - h2/2 - 5; 
				ddX = ddY*dX/dY; 
				alpha = Math.atan(dY/dX)
				//console.log(labelText + " I - " + alpha  + "," + ddX + ":" + ddY );
			}
			else { 
				ddY = h2/2 + dY + 5;
				ddX = ddY*dX/dY; 
				alpha = Math.atan(dY/dX)
				//console.log(labelText + " II - " + alpha  + "," + ddX + ":" + ddY );
			}
		} else {
			if(dX >= 0)	{
				ddX = dX - w2/2 - 5;
				ddY = ddX*dY/dX;
				alpha = Math.atan(dY/dX)
				//console.log(labelText + " III - " + alpha  + "," + ddX + ":" + ddY );
			}
			else {
				ddX = w2/2 + dX + 2 ;
				ddY = ddX*dY/dX;
				alpha = Math.atan(dY/Math.abs(dX))
				//console.log(labelText + " IV - " + alpha  + "," + dX + ":" + ddY );
			}
		}
		
		ctx.lineTo((lx + ddX), (ly + ddY));
		ctx.strokeStyle= isActive ? "#0c0" : "#bbb";
//		if(isActive) ctx.lineWidth = 1;
		ctx.stroke();
		
		
		var angle =90;
		var r1 = (0 + angle)* Math.PI/180
		var r2 = (180 + angle) * Math.PI/180;
		
		//console.log(labelText + " " + alpha);
		
		var vArrow = document.createElement("canvas");
			vArrow.className = "wx-dv-arrow";
			vArrow.style.top = ly + ddY -5 + 'px';
			vArrow.style.left = lx + ddX - 5 + 'px';
			vArrow.width = 30;
			vArrow.height = 30;
		
		var actx = vArrow.getContext('2d');	
			/*actx.save(); 
			
			actx.rotate(r1);
			actx.translate(0,0);
			actx.beginPath();
			
			/*actx.arc(5,5,4,r1,r2 ,true); */
			/*
			actx.lineTo(9.5,3.5);
			actx.lineTo(0,7.5);
			actx.lineTo(0,0);
			
			actx.fillStyle = isActive ? "#0c0" : "#000";
			//actx.strokeStyle= isActive ? "#0c0" : "#bbb";
			
			//actx.stroke();
			actx.closePath();

			actx.fill();
			actx.restore();   */
			
			var cx = 8;
			
			actx.save();
			actx.translate(cx/2+3,cx/2+3) ;
			actx.rotate(alpha) ;
			actx.translate(-cx/2+3,-cx/2+3) ;
			actx.beginPath();
			actx.moveTo(-cx/2,cx/2);
			actx.lineTo(cx/2,0);
			actx.lineTo(-cx/2,-cx/2);
			actx.lineTo(-cx/2,cx/2);
			actx.fillStyle =  isActive ? "#0c0" : "#000";
			actx.strokeStyle = isActive ? "#0c0" : "#bbb";
			actx.stroke();
			actx.fill();
			actx.restore();
			
				
		this.container.appendChild(vArrow);
		
		
	},
	showNode : function (){	
		DV.prop.style.display = "block";
		DV.overlay.style.display = "block";
		//prop.style.top = event.clientY + 'px';
		//prop.style.left = event.clientX + 'px';
		DV.prop.lastChild.innerHTML = DV.toHtml(this.node); 
		DV.overlay.style.height = document.body.scrollTop + window.innerHeight + 'px';
		DV.prop.style.top = document.body.scrollTop + (window.innerHeight/2 - DV.prop.offsetHeight/2 ) + 'px';
		DV.prop.style.left = (window.innerWidth/2 - 280 ) + 'px';
	}, 
	hideNode : function (){	
		DV.prop.style.display = "none";
		DV.overlay.style.display = "none";
	},
	
	/* --------------------- */
	
	loadInstance : function (url){
		$.ajax({type: "GET",url:url,dataType:"xml",success:function(xml){DV.loadedInstance(xml)}});
	},
	loadedInstance : function (xml){
		var pi = xml.documentElement.getElementsByTagName("process-instance")[0];
		
		if(this.processName != this.ga(pi,'processDefinition')){
			alert(ga(pi,'processDefinition') + " not instance of " + this.processName);
			return;
		}
			
		//this.canvas.width = this.canvas.width; // reseting canvas
		
		var nodeLogs  = pi.getElementsByTagName('NodeLog');
		var transitionLogs  = pi.getElementsByTagName('TransitionLog');
		var tokens  = pi.getElementsByTagName('token');
		
		for(var n=0; n < nodeLogs.length; n++){
			var ni = nodeLogs[n];
			var nd = this.getNodeById(this.ga(ni,'node'));
				nd.div.className = "node active";
		}
			
		for(var t=0; t < tokens.length; t++){
			var tk= tokens[t];
			var nd = this.getNodeById(this.ga(tk,'node'));
				nd.div.className = "node current";
		}
		
		for(var t=0; t < transitionLogs.length; t++){
			var ti = transitionLogs[t];	
			var td = this.getTransitionById(this.ga(ti,'transition'));
				
				this.drawTransition(td,true);
				
				// handling special nodes
				for(var n=0; n < this.nodes.length; n++){
					var node = this.nodes[n];
					var nodeId = this.ga(node,"id");
					
					if(nodeId == this.ga(ti,'sourceNode') || nodeId == this.ga(ti,'destinationNode'))
						if(node.div.className == "node") node.div.className = "node active";
				}	
		}
		
		
	},
	toHtml : function (xml_data)
	{
	
		var context = "<div style='padding-left:10px;'>&lt;" + xml_data.nodeName;
		
		for(var a=0; a < xml_data.attributes.length; a++ ) 
			if(xml_data.attributes[a]) 
				context += "&nbsp;" + xml_data.attributes[a].name + "=\"" + xml_data.attributes[a].value + "\"";
		
		if(xml_data.hasChildNodes)
		{
			context += "&gt;";
			for(var i=0; i < xml_data.childNodes.length; i++ ) 
			{
				var n = xml_data.childNodes[i];
				if(n.nodeType == 1 ) context += this.toHtml(n);
				else if(n.nodeType == 3) context += "<b style='color:black'>"+n.nodeValue+"</b>";
			}
			context += "&lt;/" + xml_data.tagName + "&gt;</div>";
		}
		else context += "/&gt;</div>";
		
		return context;
	},
	updateNode : function(ui){
		var node = ui.helper[0].node;
		node.setAttribute("x",ui.position.left - DV.offsetX );
		node.setAttribute("y",ui.position.top - DV.offsetY);
		if(ui.helper[0].tempNode) DV.drawT(ui.helper[0].tempNode,node); // patching
		//node.setAttribute("height",37);
		//node.setAttribute("width",145);});
	},
	toolbox : function (container){
/*		var xsl = "" ;
		var xml = "";
		xsltProcessor=new XSLTProcessor();
		xsltProcessor.importStylesheet(xsl);
		container.innerHTML = xsltProcessor.transformToFragment(xml,document);*/
		
		$.ajax({type: "GET",url: "data/jpdl-3.1.xsd",dataType:"xml",success:function(xml){
			console.log("toolbox : loaded");
			$(xml).children().children().each(
				function(){
					console.log("toolbox : " + this.nodeName);
					if( this.nodeName == "xs:element" && $(this).attr("name") && !$(this).attr("wx:abstract")){
						
						// toolbox buttons
						var hol = document.createElement("div");
							hol.className = "wx-bpm-tool";
						var but = document.createElement("div");
							but.className = "wx-bpm-tool-node";
							but.style.backgroundImage = "url(node-types/"+$(this).attr("name")+".png)";
							but.node = this;
							but.title = $(this).attr("wx:title") ? $(this).attr("wx:title") : $(this).attr("name");
							
							hol.appendChild(but);
							//hol.appendChild(document.createTextNode($(this).attr("wx:title") ? $(this).attr("wx:title") : $(this).attr("name")));
							$(container).append(hol);
							
							// dragging
							$(but).draggable({helper:"clone",cursor: 'crosshair',distance: 5, zIndex: 2700,
								stop:function(event,ui){
									var xsdNode = ui.helper.context.node;
									var node = document.createElement(xsdNode.getAttribute("name"));
									
									node.setAttribute("name",node.nodeName);
									node.setAttribute("x",ui.position.left - DV.notepad.offsetLeft - DV.offsetX - 60 + DV.notepad.scrollLeft );
									node.setAttribute("y",ui.position.top - DV.notepad.offsetTop - DV.offsetY - 13 + DV.notepad.scrollTop);
									node.setAttribute("height",37);
									node.setAttribute("width",145);
									
									var trans = document.createElement("transition");
										trans.setAttribute("name","Default");
									//node.appendChild(trans)
									
									
									
									//node.appendChild(xsdNode.cloneNode(true)); // Could transfer xsd nodes to defintion
									
									var xn = DV.drawNode(node);
										$(xn).addClass("initial");
										setTimeout(function(){
											$(xn).removeClass("initial");
										},1);
									DV.selectNode(xn);
								} 
							});
					}
				}
			);
		}});
		
	},
	toolCreate : function(){
		var xml = document.implementation.createDocument("process-definition");
		var pd = xml.documentElement;
		var procName = prompt("Enter process name","Untitled");
			if(!procName) return;
			pd.setAttribute("name",procName);
			pd.setAttribute("height",this.notepad.offsetHeight - 30);
			pd.setAttribute("width",this.notepad.offsetWidth-240);
		this.loaded(xml);
	},
	toolOpen : function(procFile){
		if(!procFile) procFile = prompt("Enter file","data/definition.xml");
		if(!procFile) return;
		DV.init(procFile);
	},
	toolBrowse : function(){
		$.ajax({type: "GET",url:this.registry.BROWSE_URL,dataType:"xml",
			success:function(xml){
				dialog.show();
				/*$.dialog({title:'Browse process definitions',type:'normal',center:true,modal:true,theme:'light',
					content:function(){
						var $body = $('<div class="wx-dv-tool-browser"></div>');*/
						var $sel = $('<select size="5" ondblclick="DV.toolOpen(this.value); dialog.hide();" style="height:100%"></select>');
						$(xml).find('definition').each(function(){
							$sel.append($('<option value="'+$(this).attr("tempFile")+'">'+nvl($(this).attr("label"),$(this).attr("name"))+'</option>'));
						});
						$("#dialog-content").html($sel);
					/*	$body.append($sel);
						return $body;
					}
				});*/
				console.log($sel);
			}
		});
	},
	registry:{
		BROWSE_URL:this.serverURL+'/bpm/definition/list.xml.seam',
		DEPLOY_URL:this.serverURL+'/bpm/deploy/',
		DEFINITION_URL:this.serverURL+'/bpm/definition/',
		INSTANCE_URL:this.serverURL+'/bpm/instance/'
	},
	toolInstance : function(){
		var procNum = prompt("Enter process number");
		if(!procNum) return;
		$.ajax({type: "GET",url:this.registry.INSTANCE_URL+procNum,dataType:"xml",success:function(xml){DV.init(xml)}});
		//$.ajax({type: "GET",url:url,dataType:"xml",success:function(xml){DV.init(xml)}});
	},
	toolDeploy : function(){
		var pd = this.processDefinition.documentElement;
		
		if(!this.ga(pd,"version")) if(!prompt("Enter process name",this.ga(pd,"name"))) return;
		
		$.ajax({type: "POST",url:this.registry.DEPLOY_URL,dataType:"xml",processData:false,contentType: "text/xml",data:this.processDefinition,
			success:function(xml){
				alert(DV.ga(pd,"name") + " deployed!");
			},
			error:function(){
				alert("Error occured " + arguments[2] );
			}
		});
																					 
		
	},
	serverURL:null,
	toolSettings : function(){
		if(!this.serverURL) 
			this.serverURL = "http://localhost:8080/seam";
			
		this.deployURL = prompt("Enter server url",this.serverURL);
		
		try { if(this.deployURL) localStorage.setItem("WX-DVB:SERVER_URL",this.serverURL ); } catch(e){}
	},
	loadSettings : function(){	
		try { this.deployURL = localStorage.getItem("WX-DVB:SERVER_URL"); } catch(e){}	
	}
};

function nvl(a,b){
	return (a) ? a : b;
}
var dialog = { 
	show : function (){
		$("#dialog").css("display","block");
		$("#facebox_overlay").css("display","block");
	},
	hide : function (){
		$("#dialog").css("display","none");
		$("#facebox_overlay").css("display","none");
	}
};