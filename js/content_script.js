console.log("Workflowy content script called!");
(function(global) {
	console.log("Called content_script.js!");
	function elementsToArray(e, level) {
		console.log("element to array func called!")
		var list = [];
		e.each(function(){
			list.push({
				type: 'node',
				//title: elementToText($(this).children(".name").children(".content")),
				title: elementToText($(this).children(".name").children(".content")),
				note: elementToText($(this).children(".notes").children(".content")),
				url: $(this).children(".name").children("a").attr('href'),
				level: level,
				complete: $(this).hasClass("done"),
				children: []
			});
			$(this).children(".children").children().each(function(){
				if($(this).text()!= ""){
					list = list.concat(elementsToArray($(this), level+1));
				}
			});
		});
		return list;
	}

	var TextExported = function(text, isUnderline, isBold, isItalic){
		this.text = text;
		this.isUnderline = isUnderline;
		this.isBold = isBold;
		this.isItalic = isItalic;
		this.isStrike = false;
	};

	function elementToText(e){
		try {
			var cloneE = e.clone();
			cloneE.find("a").each(function(){
				$(this).replaceWith( $( this ).text() );
			});

			cloneE.find(".contentTag").each(function(){
				$(this).replaceWith( $( this ).text() );
			});
			cloneE.html(cloneE.html().replace(/\n+$/g, ''));
			var elements = cloneE.contents();
			var list = [];
			elements.each( function( index ){
				var text = $(this).text();
				if(text != '')
					list.push(new TextExported(text, $(this).has("u").length ? true : false, $(this).has("b").length ? true : false, $(this).has("i").length ? true : false));
			});
			return list;
		}
		catch(error) {
			return [];
		}
	}

	function getContent(callback) {
		console.log("Get Content Called!");
		
		var url = location.href;
		var title = document.title;
		console.log("Meta")
		console.log("url: ",url);
		console.log("title: ", title);
		//var nodeList = $('div.addedToSelection');
		//var nodeList = $('div.is-currentRoot > .u-hidden').remove();
		/*
		var res = $("div").filter(function() {
			return $(this).css('display') == 'none';
		}).remove();
		console.log("Test Div Removal")
		console.log(res);*/
		var nodeList = $('div.addedToSelection');
		
		if (nodeList.length==0){
			nodeList = $('div.selected');
		}
		var email = document.getElementById("userEmail").innerText;
		chrome.storage.sync.set({'lastURL' : url}, function() {});
		var content = elementsToArray(nodeList, 0);
		var result = {
			content: content,
			url: url,
			title: title.replace(/ \- WorkFlowy$/, ''),
			email: email
		};
		console.log("getContent", result);
		callback(result);
	}

function injectJS(){
	var s = document.createElement('script');
	s.innerText = "(function(){ var div = document.createElement('div'); div.id='userEmail'; try {div.innerText=JSON.parse(window.localStorage['userstorage.settings']).email;} catch (e) {div.innerText='';} (document.head||document.documentElement).appendChild(div);})();";
	(document.head||document.documentElement).appendChild(s);
}

	function main() {
		console.log("Content Script main()!");
		injectJS();
		// show icon in address bar
		chrome.runtime.sendMessage({
			type: 'showIcon'
		}, function() {});

		chrome.extension.onMessage.addListener(function(msg, sender, callback) {
			console.log("Received a request:")
			console.log(msg.request)
			switch (msg.request) {
				case 'getTopic':
					getContent(callback);
					break;
			};
		});
	}
	
	main();
})();
