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
	ctxCanvas:null,
	offsetY:0,
	offsetX:0,
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
		
		var container = document.createElement("DIV");
		container.className="wx-dv container";
		
		this.canvas = document.createElement("DIV");
		this.canvas.className="wx-dv canvas";
		
		this.ctxCanvas = document.createElement("canvas");
		this.ctxCanvas.style.float = "left";
		this.ctx = this.ctxCanvas.getContext('2d');
		
		container.appendChild(this.ctxCanvas);
		container.appendChild(this.canvas);
		this.notepad.appendChild(container);
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
	loaded : function (xml){
		var pd = xml.documentElement;

		this.canvas.innerHTML = "";
		
		var nodes = new Array();
		this.nodes = nodes;
		
		this.transitions = new Array();
		
		
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
		
		this.canvas.style.width = this.pW + 'px';
		this.canvas.style.height = this.pH + 'px';
				
		this.ctxCanvas.height = this.pH + this.offsetY;
		this.ctxCanvas.width = this.pW + this.offsetX;
		
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
	drawNode : function (node){
		var div = document.createElement("DIV");
			div.className = "node";
			div.style.top = (Number(this.ga(node,"y")) + this.offsetY ) + 'px';
			div.style.left = (Number(this.ga(node,"x")) + this.offsetX ) + 'px';
			div.style.width = this.ga(node,"width") + 'px';
			div.style.height = this.ga(node,"height") + 'px';
			div.style.opacity = "1.0";
			div.node = node;
			div.ondblclick = DV.showNode;
			div.setAttribute("tabindex","");
			div.onclick = function(event) {
				if(event.ctrlKey) this.parentElement.removeChild(this);
			}
			
			
		var label = this.ga(node,"label");
			label = ( label == "" ? this.ga(node,"name") : label );
			div.title = label;
			//label = label.length > 12 ? label.substring(0,12)+'...' : label;

			div.innerHTML = '<span class="wx-dv-icon" style="background-image: url(node-types/'+node.tagName.toUpperCase()+'.png)"></span><h3>'+node.tagName+'</h3>'+'<span style="text-overflow: ellipsis; white-space: nowrap; display:inline-block; width:'+(Number(this.ga(node,"width"))-55)+'px; overflow-x:hidden">'+label+'</span>';
			
			this.canvas.appendChild(div);	
			
			node.div = div;
			return div;
	},	
	drawTransition : function (transition,isActive){
		var fromNode = transition.fromNode;
		var toNode = transition.toNode;
		var points = transition.getElementsByTagName("bendpoint");
		
		var canvas = this.canvas;
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
				
				canvas.appendChild(vLabel);
				
				vLabel.style.top = yy1 + lby + Number(this.ga(label,"y")) + 'px';
				vLabel.style.left = xx1 + lbx + Number(this.ga(label,"x")) /* - minSize/2 */ + 'px';
		}
		// arrow
		var degree = Math.atan(dY/dX);
		
		var ddX = 0;
		var ddY = 0;
		
		var d = Math.PI/6;
				
		if(Math.abs(dX/dY) < w2/h2){
			if(dY >= 0){ 
				ddY = dY - h2/2; 
				ddX = ddY*dX/dY; 
			}
			else { 
				ddY = h2/2 + dY;
				ddX = ddY*dX/dY; 
			}
		} else {
			if(dX >= 0)	{
				ddX = dX - w2/2;
				ddY = ddX*dY/dX;
			}
			else {
				ddX = w2/2 + dX ;
				ddY = ddX*dY/dX;
			}
		}
		
		ctx.lineTo((lx + ddX), (ly + ddY));
		ctx.strokeStyle= isActive ? "#0c0" : "#bbb";
//		if(isActive) ctx.lineWidth = 1;
		ctx.stroke();
		
		ctx.beginPath();
		ctx.arc(lx + ddX, ly + ddY, isActive ? 6 : 5 , 0, Math.PI*2, true); 
		ctx.fillStyle = isActive ? "#0c0" : "#000";
		ctx.closePath();
		ctx.fill();
		
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
	toolbox : function (container){
/*		var xsl = "" ;
		var xml = "";
		xsltProcessor=new XSLTProcessor();
		xsltProcessor.importStylesheet(xsl);
		container.innerHTML = xsltProcessor.transformToFragment(xml,document);*/
		$.ajax({type: "GET",url: "data/jpdl-3.1.xsd",dataType:"xml",success:function(xml){
			$(xml).children().children().each(
				function(){
					if( this.nodeName == "xs:element" && $(this).attr("name") && !$(this).attr("wx:abstract")){
						var hol = document.createElement("div");
						var but = document.createElement("div");
							but.className = "wx-bpm-tool-node";
							but.style.backgroundImage = "url(node-types/"+$(this).attr("name")+".png)";
							but.setAttribute("node-name", $(this).attr("name"));
							but.node = $(this);
							hol.appendChild(but);
							hol.appendChild(document.createTextNode($(this).attr("wx:title") ? $(this).attr("wx:title") : $(this).attr("name")));
							$(container).append(hol);
					}
				}
			);
		}});
	}
};