var exportLib = (function() {
	// private method
	var hasChild, getElement, toc2, exportNodesTree, exportNodesTreeBody;
	var wfe_count={};
	var wfe_count_ID={};
	var TABLE_REGEXP = /^\s*\|/;
	var BQ_REGEXP = /^\>/;
	var LIST_REGEXP = /^((\*|\-|\+)\s|[0-9]+\.\s)/;
	var WF_TAG_REGEXP = /((^|\s|,|:|;|.)(#|@)[a-z][a-z0-9\-_:]*)/ig;
	var firstItem=true;
	var indentEnum=1;
	var lineSpacing_RTF={
		Normal:[0,180],
		Heading1: [0,180],
		Heading2: [0,180],
		Heading3: [0,180],
		Heading4: [0,180],
		Heading5: [0,180],
		Heading6: [0,180],
		Note: [0,180]
	}

	var RTF_STYLE = {
			Normal: "\\s0\\f0\\sb"+lineSpacing_RTF["Normal"][0]+"\\sa"+lineSpacing_RTF["Normal"][1]+"\\fs22\\cf2",
			Heading1: "\\s1\\f0\\sb"+lineSpacing_RTF["Heading1"][0]+"\\sa"+lineSpacing_RTF["Heading1"][1]+"\\fs32\\cf2\\b",
			Heading2: "\\s2\\f0\\sb"+lineSpacing_RTF["Heading2"][0]+"\\sa"+lineSpacing_RTF["Heading2"][1]+"\\fs28\\cf2\\b",
			Heading3: "\\s3\\f0\\sb"+lineSpacing_RTF["Heading3"][0]+"\\sa"+lineSpacing_RTF["Heading3"][1]+"\\fs22\\cf2\\b",
			Heading4: "\\s4\\f0\\sb"+lineSpacing_RTF["Heading4"][0]+"\\sa"+lineSpacing_RTF["Heading4"][1]+"\\fs22\\cf2\\b",
			Heading5: "\\s5\\f0\\sb"+lineSpacing_RTF["Heading5"][0]+"\\sa"+lineSpacing_RTF["Heading5"][1]+"\\fs22\\cf2\\b",
			Heading6: "\\s6\\f0\\sb"+lineSpacing_RTF["Heading6"][0]+"\\sa"+lineSpacing_RTF["Heading6"][1]+"\\fs22\\cf2\\b",
			Note: "\\s7\\f0\\sb"+lineSpacing_RTF["Note"][0]+"\\sa"+lineSpacing_RTF["Note"][1]+"\\cf4\\fs22",
			link: "\\cf3\\ul",
			code: "\\f2\\cf4\\highlight5",
			bullet: "\\f3\\'95"
		};

	var ESCAPE_CHARACTER = {
			text: [["",""]],
			md: [["",""]],
			HTML: [["&","&amp;"],[">","&gt;"],["<","&lt;"],["\"","&quot;"],["\'","&#39;"]],
			LaTeX: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			beamer: [["\\","\\textbackslash "],["ˆ","\\textasciicircum "],["&","\\&"],["%","\\%"],["$","\\$"],["#","\\#"],["_","\\_"],["{","\\{"],["}","\\}"]],
			opml: [["",""]],
			RTF: [["\\","\\\\"],["{","\\{"],["}","\\}"]]
		};

	hasChild = function(nodes, pos) {
		if (nodes[pos].type != "node") return false;
		for (var i = pos + 1; i < nodes.length; i++) {
			if (nodes[i].type == "eoc") return false;
			if (nodes[i].type == "node") return true;
		};
		return false;
	};

	getElement = function(line) {
		var e;
		if (line.match(TABLE_REGEXP)) e = "TABLE";
		else if (line.match(BQ_REGEXP)) e = "QUOTE";
		else if (line.match(LIST_REGEXP)) e = "LIST";
		else e = "PARAGRAPH";
		return e;
	};

	exportNodesTree = function(nodes, index, level, options, indent_chars, prefix_indent_chars) {
		var header = "";
		var body = "";
		var footer = "";
		var is_document = nodes[index].is_title;
		var new_level = level;

		var HEADER = {
			text: "",
			md: "",
			HTML: "<!DOCTYPE html>\n<html>\n  <head>\n    <title>" + nodes[index].title + "</title>\n    <style>\n img {max-height: 1280px;max-width: 720px;} h4,h5,h6 {font-size: 1em;}\n    </style>\n  </head>\n  <body>\n",
			LaTeX: "",
			beamer: "",
			opml: "<?xml version=\"1.0\"?>\n<opml version=\"2.0\">\n  <head>\n    <ownerEmail>user@gmail.com</ownerEmail>\n  </head>\n  <body>\n",
			RTF: "{\\rtf1\\ansi\\deff0\n"+
			     "{\\fonttbl {\\f0 Arial;}{\\f1 Times New Roman;}{\\f2 Courier;}{\\f3 Symbol;}}\n"+
			     "{\\colortbl;\\red255\\green255\\blue255;\\red0\\green0\\blue0;\\red0\\green0\\blue130;\\red25\\green25\\blue25;\\red180\\green180\\blue180;}\n"+
			     "{\\stylesheet {"+RTF_STYLE["Normal"]+" Normal;}{"+RTF_STYLE["Heading1"]+" Heading 1;}{"+RTF_STYLE["Heading2"]+" Heading 2;}{"+RTF_STYLE["Heading3"]+" Heading 3;}{"+RTF_STYLE["Heading4"]+" Heading 4;}{"+RTF_STYLE["Heading5"]+" Heading 5;}{"+RTF_STYLE["Heading6"]+" Heading 6;}{"+RTF_STYLE["Note"]+" Note;}}\n"
			};
		var FOOTER = {
			text: "",
			md: "",
			HTML: "  </body>\n</html>",
			LaTeX: "",
			beamer: "",
			opml: "  </body>\n</opml>",
			RTF: "}"
			};
		// Set default rules
		options.rules.ignore_item = false;
		options.rules.ignore_outline = false;

		// Create header text
		switch (options.format) {
			case 'HTML':
				header = HEADER[options.format];
			break;
			case 'opml':
				header = HEADER[options.format];
				new_level = level + 1;
			break;
			case 'RTF':
				header = HEADER[options.format];
				new_level = level;
			break;
		}
		console.log("header", header, nodes[index].type);
		// Create body text
		body = exportNodesTreeBody(nodes, index, new_level, options, indent_chars, prefix_indent_chars);

		// Create footer text
		switch (options.format) {
			case 'HTML':
				footer = FOOTER[options.format];
			break;
			case 'opml':
				footer = FOOTER[options.format];
			break;
			case 'RTF':
				footer = FOOTER[options.format];
			break;
		}
		wfe_count={};
		wfe_count_ID={};
		indentEnum=1;
		return header + body + footer;
	}

	exportNodesTreeBody = function(nodes, index, level, options, indent_chars, prefix_indent_chars) {
		var start = 0; //nodes[0].node_forest[0]; // EP

		var indent = "";
		var output = "";
		var output_after_children = "";
		var new_level = level;
		var text = "";
		var note = "";
		var textTag=[""];
		var ignore_item = false;
		var ignore_outline = false;
		var output_children;
		var isItem=false;
		var isTitle=(nodes[index].myType == "HEADING" && options.titleOptions == "titleParents") || options.titleOptions == "alwaysTitle";

		// Create section heading LaTeX
/* 					var title_level = 0;
		var part_level = -1;
		var section_level = 1;
		var subsection_level = 2;
		var frame_level = 3; */

		var title_level = -1;
		var part_level = -1;
		var section_level = 0;
		var subsection_level = -1;
		var frame_level = 1;
		var heading = 0;
		var page_break = -1;

		console.log("nodesTreeToText -- processing nodes["+index.toString()+"] = ", nodes[index].title, 'at level', level.toString());
		console.log("options:", options);

		if (nodes[index].title == null) new_level = new_level; // + 1;

		//	if (!options.rules.ignore_item && !options.rules.ignore_outline) {

		text = "";
		note = "";

		if (options.applyWFERules && (nodes[index].title !== null))
		{
			// Assign new rules from WFE-tags in item
			if (nodes[index].title.search(/(^|\s)#wfe\-ignore\-tags($|\s)/ig) != -1)
			{
				console.log('ignore-tags found');
				options.rules.ignore_tags = true;
			}
			if (nodes[index].title.search(/(^|\s)#(note|wfe\-ignore\-item)($|\s)/ig) != -1)
			{
				console.log('ignore-item found');
				//options.rules.ignore_item = true;
				ignore_item = true;
			}
			if (nodes[index].title.search(/(^|\s)#wfe\-ignore\-outline($|\s)/ig) != -1)
			{
				console.log('ignore-outline found');
				ignore_outline = true; // todo: ! ? anywhere
			}

			// Match style tags

			// bullets https://stackoverflow.com/questions/15367975/rtf-bullet-list-example

 			if (nodes[index].title.search(/#h4($|\s)/ig) != -1)
			{
				console.log('#h4 found');
				if (options.format == 'beamer') level = 1; else level = 4; // ppt
			}
			if (nodes[index].title.search(/#slide($|\s)/ig) != -1)
			{
				console.log('#slide found');
				if (options.format == 'beamer') level = frame_level; else level = 0; // ppt
			}
			if (nodes[index].title.search(/#section($|\s)/ig) != -1)
			{
				console.log('#section found');
				if (options.format == 'beamer') level = section_level; else level = 0; // ppt
			}
			if (nodes[index].title.search(/#subsection($|\s)/ig) != -1)
			{
				console.log('#section found');
				if (options.format == 'beamer') level = subsection_level; else level = 0; // ppt
			}

			if (nodes[index].title.match(/#h([0-9]+)(?:\s|$)/ig)!=null)
			{
				console.log('#h'+RegExp.$1+' found');
				level = parseInt(RegExp.$1)-1;
				isTitle=true;
			}

			new_level = level;
			if (nodes[index].title.search(/#wfe-page-break($|\s)/ig) != -1)
			{
				console.log('page break found');
				page_break = 0;
			}
			if (nodes[index].title.search(/#item($|\s)/ig) != -1)
			{
				console.log('item found');
				isItem=true;
			}
			//
			// marks
			console.log('matching marks');
			nodes[index].title = nodes[index].title.replace(/(.*\(\d\smarks\).*)/g, "$1 #bf #right"); // #todo
		}

		console.log('Finished processing rules:', text, options.rules.ignore_item);

		// Compute indent - #todo improve
		if(level>0) indent = Array(level+1).join(prefix_indent_chars);
		if(options.format == 'text') indent = indent + indent_chars;
		indent = indent.replace(/(enum)/g,indentEnum++);
		indent = indent.replace(/(bull)/g,'•');
		indent = indent.replace(/(\\t)/g,"\t");


		if (nodes[index].title !== null) {
			// Not a dummy node

			// Only process item if no rule specifies ignoring it
			if (!ignore_item && !ignore_outline) {

				text = nodes[index].title;
				note = nodes[index].note;
				console.log('Process item:', text, options.rules.ignore_item);


				textTag = text.match(WF_TAG_REGEXP);
				if(textTag!=null)
				textTag.forEach(function(e) {
					if(e.indexOf(" #wfe-count")!=-1){
						text = text.replace(/#wfe-count:([^|\s|,|:|;|.]*):?([^|\s|,|:|;|.]*)?:?([^|\s|,|:|;|.]*)?/g,function(){
							if(RegExp.$3 && !isNaN(RegExp.$3)) wfe_count[RegExp.$1]=parseInt(RegExp.$3)-1;
							if(!wfe_count[RegExp.$1])
								wfe_count[RegExp.$1]=0;
							  wfe_count[RegExp.$1]++;
							if(RegExp.$2)
						 		wfe_count_ID[RegExp.$1+":"+RegExp.$2]=wfe_count[RegExp.$1];
							return wfe_count[RegExp.$1];
						});
					}
					else if(e.indexOf(" #wfe-refLast:")!=-1){
						text = text.replace(/#wfe-refLast:([^|\s|,|:|;|.]*)/g,function(){
							if(wfe_count[RegExp.$1])
								return wfe_count[RegExp.$1];
							return "NaN";
						});
					}
					else if(e.indexOf(" #wfe-ref:")!=-1){
						text = text.replace(/#wfe-ref:([^|\s|,|:|;|.]*):([^|\s|,|:|;|.]*)/g,function(){
							if(wfe_count_ID[RegExp.$1+":"+RegExp.$2])
								return wfe_count_ID[RegExp.$1+":"+RegExp.$2];
							return "NaN";
						});
					}
				});

				if (options.rules.ignore_tags) {
					// Strip off tags
					text = text.replace(WF_TAG_REGEXP, "");
					note = note.replace(WF_TAG_REGEXP, "");
					//console.log('regexp' + myArray, 'replced:', text);
				}
				if(options.rules.escapeCharacter)
					ESCAPE_CHARACTER[options.format].forEach(function(e) {
	  					text = text.split(e[0]).join(e[1]);
			  			note = note.split(e[0]).join(e[1]);
					});

				// Update output
				if (options.format == 'HTML') {
					//output = output + indent + text + nodes[index].myType;

					text = text.replace(/--/g, "&ndash;");

					//Interpretation of `code`
					text = text.replace(/`([^`]*)`/g, "<code style=\"background-color: #d3d3d3;\"> &nbsp;$1 </code>");

					//Insert Image
					text = text.replace(/!\[([^\]]*)\]\(([^\)]*)\)/g, "<img src=\"$2\"  title=\"$1\"><br /><span style=\"font-style: italic; font-size: 0.9em; color:grey;\">$1</span>");

					//Create hyperlinks
					text = text.replace(/\[([^\]]*)\]\(([^\)]*)\)/g, "<a href=\"$2\" target=\"_blank\">$1</a>");

					var temp_level = level + 1;
					if(options.output_type=='list')
						if(temp_level==1){
							output = output + indent + "<h1>" + text + "</h1>\n"+"<ul>";
							output_after_children= indent +"</ul>\n";
						}
						else if (nodes[index].myType == "HEADING") {
							output = output + indent + "<li>" + text + "</li>\n"+"<ul>";
							output_after_children= indent +"</ul>\n";
						}
						else {
							output = output + indent + "<li>" + text + "</li>";
						}
					else if(isItem){
							output = output + indent + "<li>" + text + "</li>"; //need to know lastItem for do <ul>
					}
					else if (isTitle)
							output = output + indent + "<h" + temp_level.toString() + ">" + text + "</h" + temp_level.toString() + ">";
					else // #todo implement ITEM
						output = output + indent + "<p>" + text + "</p>";

					if ((note !== "") && options.outputNotes) output = output + "\n" + indent + "<p>" + note + "</p>";


					output = output + options.item_sep;

				}
				else if (options.format == 'beamer')
				{

					// Create images
					console.log('check for images ');
					// First replace with optional {: } syntax
					text = text.replace(/\!\[(.*)\]\((.*)\)\{:(.*)\}/g, "\\begin{figure}[t]\\includegraphics[$3]{$2}\\centering \\end{figure}");
					console.log('item now', text);
					// Replace if this is missing
					text = text.replace(/\!\[(.*)\]\((.*)\)/g, "\\begin{figure}[t]\\includegraphics[]{$2}\\centering \\end{figure}");  // https://regex101.com/r/vOwmQX/1    https://regex101.com/r/vOwmQX/2
					console.log('item now', text);

					// Create hyperlinks
					console.log('check for hyperlink');
					text = text.replace(/\[(.*)\]\((.*)\)/g, "\\href{$2}{$1}");
					console.log('item now', text);



					if (level == title_level)
						output = output + indent + "\\title{" + text + "}";
					else if (level == section_level)
						output = output + indent + "\\section{" + text + "}";
					else if (level == subsection_level)
						output = output + indent + "\\subsection{" + text + "}";
					else if (level == frame_level)
						output = output + indent + "\\begin{frame}{" + text + "}";
					else if (level > frame_level)
						output = output + indent + "\\item " + text;

					// Add notes if required by option
					if ((note !== "") && (options.outputNotes))
					{
						// Create images
						console.log('check for images ');
						// First replace with optional {: } syntax
						note = note.replace(/\!\[(.*)\]\((.*)\)\{:(.*)\}/g, "\\begin{figure}[t]\\includegraphics[$3]{$2}\\centering \\end{figure}");
						console.log('item now', note);
						// Replace if this is missing
						note = note.replace(/\!\[(.*)\]\((.*)\)/g, "\\begin{figure}[t]\\includegraphics[width=.75\\textwidth]{$2}\\centering \\end{figure}");
						console.log('item now', note);

						// Create hyperlinks
						console.log('check for hyperlink');
						note = note.replace(/\[(.*)\]\((.*)\)/g, "\\href{$2}{$1}");
						console.log('item now', note);

						output = output + options.item_sep + indent + " " + note;
						// .replace(/\!\[(.*)\]\((.*)\)\{:(.*)\}/g, "\\begin{figure}[t]\\includegraphics[$3]{$2}\\centering \\end{figure}")
					}
					output = output + options.item_sep;

					if ((nodes[index].myType == "HEADING") && (level >= frame_level))
					{
						output = output + indent + "\\begin{itemize}" + options.item_sep;
					}

				}
				else if (options.format == 'opml') {

					output = output + indent + "<outline text=\"" + text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;") + "\"";
					if (options.outputNotes) output = output + " _note=\"" + note + "\"";
					output = output + ">\n";

				} else if (options.format == 'WFE-TAGGED') {
					//output = output + indent + text + nodes[index].myType;
					var temp_level = level + 1;

					if ((options.output_type=='list') || (nodes[index].myType == "HEADING"))
						output = output + indent + text + " #h" + temp_level.toString();
					else // #todo implement ITEM
						output = output + indent + text;

					if ((note !== "") && options.outputNotes) output = output + "\n" + indent + "[" + note + "]";
					output = output + options.item_sep;

				} else if (options.format == 'RTF') {
					//output = output + indent + text + nodes[index].myType;
 					var temp_level = level;

					text = text.replace(/--/g, "\\endash ");
					text = text.replace(/`([^`]*)`/g, "{" + RTF_STYLE["code"] + " $1}");
					text = text.replace(/!\[([^\]]*)\]\(([^\)]*)\)/g,"$2"); //TODO Insert img
					text = text.replace(/\[([^\]]*)\]\(([^\)]*)\)/g,"{\\field{\\*\\fldinst HYPERLINK $2 }{\\fldrslt" + RTF_STYLE["link"] + " $1}}");
					note = note.replace(/URL:[ ]+([^ |\n]*)/g,"{\\field{\\*\\fldinst HYPERLINK $1 }{\\fldrslt" + RTF_STYLE["link"] + " $1}}");//URL in note

					if(options.output_type=='list')
						if(temp_level==0)
							output = output + "{\\pard" + RTF_STYLE["Heading1"] + " " + text + "\\par}";
						else
							output = output + "{\\pard" + RTF_STYLE["Normal"] + "\\fi-200\\li" + ((400 * (temp_level-1))+200) + "{" + RTF_STYLE["bullet"] + "\\tab}" + text + "\\par}";
					else if (isTitle){
						output = output + "{\\pard" + RTF_STYLE["Heading"+(temp_level+1)] + " " + text + "\\par}";
					}
					else
						if(isItem){
							if(firstItem){
									output = output + "\\pard{\\*\\pn\\pnlvlblt\\pnf1\\pnindent0{\\pntxtb" + RTF_STYLE["bullet"] + "}}\\fi-360\\li720" + RTF_STYLE["Normal"] + "{\\pntext" + RTF_STYLE["bullet"] + "\\tab}" + text + "\\par";
									firstItem=false;
							}
							else
									output = output + "{\\pntext" + RTF_STYLE["bullet"] + "\\tab}" + RTF_STYLE["Normal"] + " " + text + "\\par";
						}
						else
							output = output + "{\\pard" + RTF_STYLE["Normal"] + " " + text + "\\par}";

					if (page_break > -1)
					{
						output = output + "\\page";
					}
					if ((note !== "") && options.outputNotes) output = output + "\n" + "{\\pard" + RTF_STYLE["Note"] + "" + note + "\\par}";
					output = output + "\n";
				}
				else {
					output = output + indent + text;
					//if (options.rules.include_notes) output = output + " [" + note + "]";
					//console.log(options);
					if ((note !== "") && (options.outputNotes))
						output = output + "\n" + indent + "[" + note + "]";

					output = output + options.item_sep;
				}

			}
		}

			if(!isItem) firstItem=true;
			//console.log(nodes[index].note);
			console.log("Output: ", output);
			// Reset item-local rules
			options.rules.ignore_item = false;

			output_children = '';
			if (!ignore_outline) {
				// Recursion on children
				if ((!ignore_item) && (nodes[index].title !== null)) new_level = level + 1;
				console.log("Apply recursion to: ", nodes[index].children);

				for (var i = 0; i < nodes[index].children.length; i++)
				{
					output_children = output_children + exportNodesTreeBody(nodes, nodes[index].children[i], new_level, options, indent_chars, prefix_indent_chars);
				}

			}

			output = output + output_children + output_after_children;

			if (!ignore_item && !ignore_outline) {
				// Only finish item if no rule specifies ignoring it
				if (options.format == 'opml')
					output = output + indent + "</outline>\n"
				else if (options.format == 'beamer')
				{
					console.log("toto", level, nodes[index].children.length);
					if ((level >= frame_level) && (output_children.length > 0))
						output = output + indent + "\\end{itemize}\n";
					if (level == frame_level)
						output = output + indent + "\\end{frame}\n";
				}
			}
			// Reset outline-local rules
			ignore_outline = false;
		return output;
	};


	return {
		// public method
		// options -> {outputNotes: outputToc: outputHeadingLink}




		toMyText: function(my_nodes, options) {
			var text = "";
			var indent_chars = options.indent_chars;
			var prefix_indent_chars = options.prefix_indent_chars;

			console.log("Options in toMyText:", options, options.rules.ignore_tags);
			text = text + exportNodesTree(my_nodes[0], my_nodes[1], 0, options, indent_chars, prefix_indent_chars); // EP
/* 			for (var i = 0; i < nodes[0].node_forest.length; i++) {
				text = text + nodesTreeToText(nodes, nodes[0].node_forest[i], 0, options, indent_chars, prefix_indent_chars);
			}
 */			return text;
		},


	};
})();
