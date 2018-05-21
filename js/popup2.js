var popup2 = (function() {
	//chrome.storage.sync.clear(function (){}); //For cleaning the storage
	var start = Date.now();


	chrome.storage.onChanged.addListener(function(changes, namespace) {
		for (key in changes) {
			var storageChange = changes[key];
			console.log("Storage key ",key," in namespace ",namespace," changed. Old value was ",storageChange.oldValue,", new value is ",storageChange.newValue,".");
		}
	});

	function load(currentTabId, callback) {

		chrome.tabs.onRemoved.addListener(
			function(tabId, removeInfo) {
					if(tabId==currentTabId) {
						window.close();
					}
			}
		);

    chrome.tabs.onUpdated.addListener(
			function(tabId, changeInfo, tab){
				if(tabId==currentTabId && tab.url.indexOf("https://workflowy.com")!=0) {
					window.close();
				}
    	}
		);

		chrome.tabs.sendMessage(currentTabId, {
			request: 'getTopic'
		}, function(response) {
			chrome.storage.local.get(["textAreaStyle", "refreshOptions", "windowSize"], function(storageL) {
				chrome.storage.sync.get(['profileList', 'profileName'], function(storageS) {
					//return a copy of an object (recursif)
					function copy(o) {
					  var output, v, key;
					  output = Array.isArray(o) ? [] : {};
					  for (key in o) {
					    v = o[key];
					    output[key] = (typeof v === "object" && v !== null) ? copy(v) : v;
					  }
					  return output;
					}

					function download(filename, text) {
					  var element = document.createElement('a');
					  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
					  element.setAttribute('download', filename);

					  element.style.display = 'none';
					  document.body.appendChild(element);

					  element.click();

					  document.body.removeChild(element);
					}

					var HTML_true = '<small><i class="glyphicon glyphicon-ok"></i></small>';
					var HTML_false = '<small><i class="glyphicon glyphicon-remove"></i></small>';

					function openSolverConflictProfile(newkey, newProfile){
						console.log("Conflic profile", newkey, newProfile);
						$('#myModal').modal("show");
						$("#renameNewProfile").val(newkey);
						$("#newNameProfile").text(newkey);


						$("#yourProfile-format").text(profileList[newkey].format);

						if(profileList[newkey].defaultItemStyle=="None") $("#yourProfile-defaultItemStyle").html('<span class="text-muted">None</span>');
						else $("#yourProfile-defaultItemStyle").text(profileList[newkey].defaultItemStyle);

						if(profileList[newkey].indent_chars=="" || profileList[newkey].defaultItemStyle!="Bullet") $("#yourProfile-indent_chars").html('<span class="text-muted">None</span>');
						else $("#yourProfile-indent_chars").text(profileList[newkey].indent_chars);

						if(profileList[newkey].prefix_indent_chars=="\t")$("#yourProfile-prefix_indent_chars").text("Tab");
						else if(profileList[newkey].prefix_indent_chars=="  ")$("#yourProfile-prefix_indent_chars").text("Space");
						else $("#yourProfile-prefix_indent_chars").html('<span class="text-muted">None</span>');

						if(profileList[newkey].item_sep == "\n\n") $("#yourProfile-item_sep").html(HTML_true);
						else $("#yourProfile-item_sep").html(HTML_false);

						if(profileList[newkey].applyWFERules) $("#yourProfile-applyWFERules").html(HTML_true);
						else $("#yourProfile-applyWFERules").html(HTML_false);

						if(profileList[newkey].outputNotes) $("#yourProfile-outputNotes").html(HTML_true);
						else $("#yourProfile-outputNotes").html(HTML_false);

						if(profileList[newkey].ignore_tags) $("#yourProfile-ignore_tags").html(HTML_true);
						else $("#yourProfile-ignore_tags").html(HTML_false);

						if(profileList[newkey].escapeCharacter) $("#yourProfile-escapeCharacter").html(HTML_true);
						else $("#yourProfile-escapeCharacter").html(HTML_false);

						if(profileList[newkey].fragment) $("#yourProfile-fragment").html(HTML_true);
						else $("#yourProfile-fragment").html(HTML_false);

						$("#yourProfile-findReplace").text(profileList[newkey].findReplace.length);


						$("#newProfile-format").text(newProfile.format);

						if(newProfile.defaultItemStyle=="None") $("#newProfile-defaultItemStyle").html('<span class="text-muted">None</span>');
						else $("#newProfile-defaultItemStyle").text(newProfile.defaultItemStyle);

						if(newProfile.indent_chars=="" || newProfile.defaultItemStyle!="Bullet") $("#newProfile-indent_chars").html('<span class="text-muted">None</span>');
						else $("#newProfile-indent_chars").text(newProfile.indent_chars);

						if(newProfile.prefix_indent_chars=="\t")$("#newProfile-prefix_indent_chars").text("Tab");
						else if(newProfile.prefix_indent_chars=="  ")$("#newProfile-prefix_indent_chars").text("Space");
						else $("#newProfile-prefix_indent_chars").html('<span class="text-muted">None</span>');

						if(newProfile.item_sep == "\n\n") $("#newProfile-item_sep").html(HTML_true);
						else $("#newProfile-item_sep").html(HTML_false);

						if(newProfile.applyWFERules) $("#newProfile-applyWFERules").html(HTML_true);
						else $("#newProfile-applyWFERules").html(HTML_false);

						if(newProfile.outputNotes) $("#newProfile-outputNotes").html(HTML_true);
						else $("#newProfile-outputNotes").html(HTML_false);

						if(newProfile.ignore_tags) $("#newProfile-ignore_tags").html(HTML_true);
						else $("#newProfile-ignore_tags").html(HTML_false);

						if(newProfile.escapeCharacter) $("#newProfile-escapeCharacter").html(HTML_true);
						else $("#newProfile-escapeCharacter").html(HTML_false);

						if(newProfile.fragment) $("#newProfile-fragment").html(HTML_true);
						else $("#newProfile-fragment").html(HTML_false);

						$("#newProfile-findReplace").text(newProfile.findReplace.length);
					}

					function addProfileToProfileList(newProfileList){
						var newkeys = Object.keys(newProfileList);
						newkeys.forEach(function(newkey){
							var keys = Object.keys(profileList);
							if(keys.includes(newkey)){
								conflictProfileList.push([newkey, newProfileList[newkey]])
							}
							else
								profileList[newkey]=copy(newProfileList[newkey]);
								updateProfileChoice();
								chrome.storage.sync.set({'profileList' : profileList}, function() {});
						});
						if(conflictProfileList.length != 0) openSolverConflictProfile(...conflictProfileList[0]);
						console.log("conflictProfileList", conflictProfileList);
					}

					function extensionFileName(format){
						switch(format){
							case "html" : return ".html";
							case "opml" : return ".opml";
							case "markdown" : return ".md";
							case "rtf" : return ".rtf";
							case "latex" : return ".tex";
							case "beamer" : return ".tex";
							default : return ".txt";
						}
					}

					function Profile(format, defaultItemStyle, indent_chars, prefix_indent_chars, item_sep, applyWFERules, outputNotes, ignore_tags, escapeCharacter, findReplace, fragment){
						this.format = format,
						this.defaultItemStyle = defaultItemStyle,
						this.indent_chars = indent_chars,
						this.prefix_indent_chars = prefix_indent_chars,
						this.item_sep = item_sep,
						this.applyWFERules = applyWFERules,
						this.outputNotes = outputNotes,
						this.ignore_tags = ignore_tags,
						this.escapeCharacter = escapeCharacter,
						this.findReplace = copy(findReplace),
						this.fragment = fragment
					};

					//update the list in the popup with the different preset of options
					function updateProfileChoice(){
						var documentProfileChoice =	document.getElementById("profileList");
						for (var name in profileList){
				    	if (profileList.hasOwnProperty(name) && !document.getElementById("profileList"+name)) {
								var option = document.createElement("option");
								option.setAttribute("value", name);
								option.setAttribute("id", "profileList"+name);
								option.text = name;
								documentProfileChoice.add(option);
				    	}
						}
						for (var i=documentProfileChoice.options.length-1; i>=0; i--){
							var option = documentProfileChoice.options[i];
							var name = option.value;
				    	if (!profileList.hasOwnProperty(name) && document.getElementById("profileList"+name)) {
								documentProfileChoice.removeChild(option);
				    	}
						}
					}

					function updadeForm(){
						curent_profile = copy(profileList[document.getElementById('profileList').value]);

						document.getElementById(curent_profile.format).checked = true;
						if($("#opml").is(':checked')){
							$("input[type=radio][name=defaultItemStyle]").prop("disabled", true);
							$("#None").prop("checked", true);
							$("#divBulletCaracter").hide();
							$("[name=TxtDefaultItemStyle]").css('color', 'grey');
						}
						else{
							$("input[type=radio][name=defaultItemStyle]").prop("disabled", false);
							$("[name=TxtDefaultItemStyle]").css('color', '');
						}

						document.getElementById(curent_profile.defaultItemStyle).checked = true
						if($("#Bullet").is(':checked'))
							$("#divBulletCaracter").show();
						else
							$("#divBulletCaracter").hide();


						document.getElementById("wfeRules").checked = curent_profile.applyWFERules;
						document.getElementById("outputNotes").checked = curent_profile.outputNotes;
						document.getElementById("stripTags").checked =	curent_profile.ignore_tags;
						document.getElementById("escapeCharacter").checked = curent_profile.escapeCharacter;
						document.getElementById("fragment").checked = curent_profile.fragment;
						document.getElementById("insertLine").checked = (curent_profile.item_sep == "\n\n");
						switch (curent_profile.prefix_indent_chars) {
							case "\t":
								document.getElementById('tab').checked = true;
								break;
							case "  ":
								document.getElementById('space').checked = true;
								break;
							case "":
								document.getElementById('withoutIndent').checked = true;
								break;
						}
						document.getElementById("indentOther").value = curent_profile.indent_chars;

						document.getElementById('findReplace').getElementsByTagName('tbody')[0].innerHTML = "";
						curent_profile.findReplace.forEach(function(e, id){
							addLineOfTableRindReplace(id, e.txtFind, e.txtReplace, e.isRegex, e.isMatchCase);
						});
					}
					//open a form to create or update a preset of options
					function newProfile(){
						$('#modalNewProfile').modal("show");
					}

					//save the form for create or update a preset of options
					function saveProfile(profileName){
						if(profileName != ""){
							changeFormat();
							var idnull=curent_profile.findReplace.indexOf(null);
							while(idnull!=-1){
								curent_profile.findReplace.splice(idnull,1);
								idnull=curent_profile.findReplace.indexOf(null);
							};
							profileList[profileName] = copy(curent_profile);
							updateProfileChoice();
							document.getElementById('profileList').value = profileName;
							chrome.storage.sync.set({'profileList' : profileList}, function() {
								console.log("profileList saved ");
							});
						}
					}

					//delete a preset of option
					function removeProfile(profileName){
						if(nameProfile!="list"){
							delete profileList[profileName];
							updateProfileChoice();
							chrome.storage.sync.set({'profileList' : profileList}, function() {
								console.log("profileList saved ");
							});
							document.getElementById("profileList").value = "list";
							updadeForm();
							curent_profile = copy(profileList["list"]);
						}
					}


					function FindReplace(txtFind, txtReplace, isRegex, isMatchCase){
						this.txtReplace = txtReplace;
						this.txtFind = txtFind;
						this.isRegex = isRegex;
						this.isMatchCase = isMatchCase;
					}

					//create a new rule for Find and Replace
					function addFindReplace(){
						if(document.getElementById("find").value!=""){
							var idFindReplace = curent_profile.findReplace.length;
							var txtFind = document.getElementById("find").value;
							var txtReplace = document.getElementById("replace").value;
							var isRegex = document.getElementById("regex").checked;
							var isMatchCase = document.getElementById("matchCase").checked;

							curent_profile.findReplace.push(new FindReplace(txtFind, txtReplace, isRegex, document.getElementById("matchCase").checked));

							addLineOfTableRindReplace(idFindReplace, txtFind, txtReplace, isRegex, isMatchCase);

							document.getElementById("find").value = "";
							document.getElementById("replace").value = "";
							sizeOfExportArea();

						}
					}

					//add the new rule in the table of the popup
					function addLineOfTableRindReplace(idFindReplace, txtFind, txtReplace, isRegex, isMatchCase){
						var tableRef = document.getElementById('findReplace').getElementsByTagName('tbody')[0];
						var newRow   = tableRef.insertRow(tableRef.rows.length);
						newRow.setAttribute("id", "findReplace" + idFindReplace);

						var newCell  = document.createElement('th');
						newCell.setAttribute("scope","row");
						var newText  = document.createTextNode(idFindReplace + 1);
						newCell.appendChild(newText);
						newRow.appendChild(newCell);

						newCell  = newRow.insertCell(1);
						newText  = document.createTextNode(txtFind);
						newCell.appendChild(newText);

						newCell  = newRow.insertCell(2);
						newText  = document.createTextNode(txtReplace);
						newCell.appendChild(newText);

						newCell  = newRow.insertCell(3);
						newText = document.createElement('i');
						if(isRegex)
							newText.setAttribute("class", "glyphicon glyphicon-ok");
						else
							newText.setAttribute("class", "glyphicon glyphicon-remove");
						newCell.appendChild(newText);

						newCell  = newRow.insertCell(4);
						newText = document.createElement('i');
						if(isMatchCase)
							newText.setAttribute("class", "glyphicon glyphicon-ok");
						else
							newText.setAttribute("class", "glyphicon glyphicon-remove");
						newCell.appendChild(newText);

						newCell  = newRow.insertCell(5);
						var but = document.createElement("button");
						var span = document.createElement("span");
						newText = document.createElement('i');
						newText.setAttribute("class", "glyphicon glyphicon-trash");
						but.setAttribute("type", "button");
						but.setAttribute("id", "ButtonfindReplace" + (idFindReplace));
						but.setAttribute("class", "btn btn-warning btn-rounded btn-sm");

						newCell.appendChild(but);
						but.appendChild(span);
						span.appendChild(newText);

						document.getElementById("ButtonfindReplace" + idFindReplace).addEventListener("click", function() {
							deleteFindReplace(idFindReplace);
						}, false);
					}

					//delete a rule of find and replace
					function deleteFindReplace(index){
						curent_profile.findReplace[index]=null;
						document.getElementById("findReplace" + index).remove();
						console.log("curent_profile.findReplace", curent_profile.findReplace);
						sizeOfExportArea();
					}

					// change curent_profile with the value enter in the form
					function changeFormat() {
						var text;

						var formatOptions = document.getElementsByName('formatOptions');
						for ( var i = 0; i < formatOptions.length; i++) {
				    	if(formatOptions[i].checked) {
								curent_profile.format = formatOptions[i].value;
				        break;
				    	}
						}

						var defaultItemStyle = document.getElementsByName('defaultItemStyle');
						for ( var i = 0; i < defaultItemStyle.length; i++) {
							if(defaultItemStyle[i].checked) {
								curent_profile.defaultItemStyle = defaultItemStyle[i].value;
								break;
							}
						}

						var indentOptions = document.getElementsByName('indentOptions');
						for ( var i = 0; i < indentOptions.length; i++) {
							if(indentOptions[i].checked) {
								switch (indentOptions[i].value) {
									case "tab":
										curent_profile.prefix_indent_chars = "\t";
										break;
									case "space":
										curent_profile.prefix_indent_chars = "  ";
										break;
									case "withoutIndent":
										curent_profile.prefix_indent_chars = "";
										break;
								}
								break;
							}
						}

						curent_profile.indent_chars = document.getElementById("indentOther").value;

						if(document.getElementById("insertLine").checked)
							curent_profile.item_sep = "\n\n";
						else
							curent_profile.item_sep = "\n";


						curent_profile.applyWFERules = document.getElementById("wfeRules").checked;
						curent_profile.outputNotes = document.getElementById("outputNotes").checked;
						curent_profile.ignore_tags = document.getElementById("stripTags").checked;
						curent_profile.escapeCharacter = document.getElementById("escapeCharacter").checked;
						curent_profile.fragment = document.getElementById("fragment").checked;
					};

					//export the nodes in the textArea in the popup
					function exportText(){

						console.log("##################### Export the page with profile", curent_profile);
						var $textArea = $('#textArea');
						text = exportLib(copy(g_nodes), curent_profile, g_email);
						$textArea.val(text);
						$("#fileName").text(g_title+extensionFileName(curent_profile.format));
						$("#title").text(g_title);
						$("#url").attr("href",g_url).text(g_url);
						chrome.storage.sync.set({'profileName' : document.getElementById('profileList').value}, function() {
							console.log("profileName init");
						});
						if(refreshOptions["autoCopy"]){
							copyToClipboard(text);
						}
						if(refreshOptions["autoDownload"]){
							download($("#fileName").text(), $("#textArea").val());
						}
					};

					function copyToClipboard(text){
				    var $temp = $("<textarea>");
				    $("body").append($temp);
				    $temp.val(text).select();
				    document.execCommand("copy");
				    $temp.remove();
					}

					function sizeOfExportArea(){
						if(window.innerWidth >= 992){

							var textAreaSize = $("#panelForm").height() - $("#panelTextArea").outerHeight(true) + $("#panelTextArea").height() - $("#footerTextArea").outerHeight(true) - $("#divTextArea").outerHeight(true) + $("#divTextArea").height() - $("#textArea").outerHeight(true) + $("#textArea").height();
							if(textAreaSize > 200)
								$("#textArea").height(textAreaSize);
							else
								$("#textArea").height(200);

							$("#textArea").css("resize", "none");
						}
						else{
							$("#textArea").height(200);
							$("#textArea").css("resize", "vertical");
						}
					}
					//add event Listener for the button in the popup
					function setEventListers() {

						$("#refresh").click(function() {
							changeFormat();
							loading(function(callback){
								exportText();
								return callback();
							});
						});

						$("#update").click(function() {
							changeFormat();
							loading(function(callback){
								chrome.tabs.sendMessage(currentTabId, {
									request: 'getTopic'
								}, function(response) {
										g_nodes = response.content;
										g_title = response.title;
									 	g_url = response.url;
										g_email= response.email;
										exportText();
										return callback();
								});
							});
						});



						$('input[type=radio][name=defaultItemStyle]').change("change", function() {
							if($("#Bullet").is(':checked'))
								$("#divBulletCaracter").show();
							else
								$("#divBulletCaracter").hide();
						});

						$('input[type=radio][name=formatOptions]').change("change", function() {
							if($("#opml").is(':checked')){
								$("input[type=radio][name=defaultItemStyle]").prop("disabled", true);
								$("#None").prop("checked", true);
								$("#divBulletCaracter").hide();
								$("[name=TxtDefaultItemStyle]").css('color', 'grey');
							}
							else{
								$("input[type=radio][name=defaultItemStyle]").prop("disabled", false);
								$("[name=TxtDefaultItemStyle]").css('color', '');
							}
						});

						$("#addFindReplace").click(function() {
							addFindReplace();
						});

						$("#newProfile").click(function() {
							newProfile();
						});

						$("#saveProfile").click(function() {
							loading(function(callback){
								saveProfile(document.getElementById('profileList').value);
								exportText();
								return callback();
							});
						});

						$("#saveNewProfile").click(function() {
							if(document.getElementById('inputNewProfile').value != ""){
								$('#modalNewProfile').modal('hide');
								loading(function(callback){
									saveProfile(document.getElementById('inputNewProfile').value);
									exportText();
									return callback();
								});
							}
						});

						$("#deleteProfile").click(function(){
							var nameProfile = document.getElementById("profileList").value;
							if(nameProfile!="list"){
								$("#nameDeleteProfile").text(nameProfile);
								$("#modalDeleteProfile").modal("show");
							}
						});

						$("#yesDeleteProfile").click(function(){
							removeProfile(document.getElementById("profileList").value);
							$("#modalDeleteProfile").modal("hide");
						});

						document.getElementById("profileList").onchange=function(){
							curent_profile = copy(profileList[document.getElementById('profileList').value]);
							loading(function(callback){
								exportText();
								return callback();
							});
							updadeForm();
						};

						$("#copy").click(function() {
							copyToClipboard($('#textArea').val());
							$("#textArea").select();
						});

						$("#download").click(function() {
							if($("#fileName").text() != ""){
								download($("#fileName").text(), $("#textArea").val());
							}
						});

						$("#downloadProfiles").click(function() {
							download("profiles.json",JSON.stringify(profileList));
						});

						$('#importProfile').click(function(){
							$('#importFile').click();
						});


						$('#newProfileReplace').click(function(){
							profileList[$('#renameNewProfile').val()] = copy(conflictProfileList[0][1]);
							updateProfileChoice();
							chrome.storage.sync.set({'profileList' : profileList}, function() {});
							conflictProfileList.shift();
							if($('#applyForAllNewProfile').prop('checked')){
								conflictProfileList.forEach(function(e){
									profileList[e[0]] = copy(e[1]);
									updateProfileChoice();
									chrome.storage.sync.set({'profileList' : profileList}, function() {});
								});
								conflictProfileList = [];
								$('#myModal').modal('hide');
							}
							else{
								if(conflictProfileList.length != 0) openSolverConflictProfile(...conflictProfileList[0]);
								else $('#myModal').modal('hide');
							}
						});

						$('#newProfileAutoRename').click(function(){
							var i = 1;
							var newkey = $('#renameNewProfile').val();
							var keys = Object.keys(profileList);
							if(keys.includes(newkey)){
								while(keys.includes(newkey + " " + i)){
									i++;
								}
								profileList[newkey + " " + i] = copy(conflictProfileList[0][1]);
								updateProfileChoice();
								chrome.storage.sync.set({'profileList' : profileList}, function() {});
								conflictProfileList.shift();
							}
							else {
								profileList[newkey] = copy(conflictProfileList[0][1]);
								updateProfileChoice();
								chrome.storage.sync.set({'profileList' : profileList}, function() {});
								conflictProfileList.shift();
							}
							if($('#applyForAllNewProfile').prop('checked')){
								conflictProfileList.forEach(function(e){
									var i = 1;
									var newkey = e[0];
									var keys = Object.keys(profileList);
									if(keys.includes(newkey)){
										while(keys.includes(newkey + " " + i)){
											i++;
										}
										profileList[newkey + " " + i] = copy(e[1]);
										updateProfileChoice();
										chrome.storage.sync.set({'profileList' : profileList}, function() {});
									}
									else {
										profileList[newkey] = copy(e[1]);
										updateProfileChoice();
										chrome.storage.sync.set({'profileList' : profileList}, function() {});
									}
								});
								conflictProfileList = [];
								$('#myModal').modal('hide');
							}
							else{
								if(conflictProfileList.length != 0) openSolverConflictProfile(...conflictProfileList[0]);
								else $('#myModal').modal('hide');
							}

						});

						$('#newProfileIgnore').click(function(){
							conflictProfileList.shift();
							if($('#applyForAllNewProfile').prop('checked')){
								conflictProfileList = [];
								$('#myModal').modal('hide');
							}
							else{
								if(conflictProfileList.length != 0) openSolverConflictProfile(...conflictProfileList[0]);
								else $('#myModal').modal('hide');
							}
						});
						$('#newProfileCancel').click(function(){
							$('#myModal').modal('hide');
							conflictProfileList = [];

						});
						$("#closeModal").click(function(){
							conflictProfileList = [];
						});


						$("#importFile").change(function(e) {
							var file = document.getElementById('importFile').files[0];

							var fr = new FileReader();

							fr.onload = function(e) {
								var result = JSON.parse(e.target.result);
								addProfileToProfileList(result);
							}
							fr.readAsText(file);
							$("#importFile").val('');
						});

						$("#renameNewProfile").change(function(e) {
							if($("#renameNewProfile").val() != $("#newNameProfile").text()){
								$("#applyForAllNewProfile").prop("checked", false);
								$("#applyForAllNewProfile").prop("disabled", true);
								$("#labelApplyForAllNewProfile").css('color', 'grey');
								$("#newProfileReplace").text("Rename");
							}
							else{
								$("#applyForAllNewProfile").prop("disabled", false);
								$("#labelApplyForAllNewProfile").css('color', '');
								$("#newProfileReplace").text("Replace");
							}
						});

						$('#hideForm').click(function(){
							$('#form').slideToggle("slow", function(){
								if($('#form').is(":visible")){
									$('#hideForm').html('<i class="glyphicon glyphicon-minus"></i');
								}
								else{
									$('#hideForm').html('<i class="glyphicon glyphicon-plus"></i');
								}
								sizeOfExportArea();
							});
						});

						$('#hideProfileList').click(function(){
							$('#divProfileList').slideToggle("slow", function(){
								if($('#divProfileList').is(":visible")){
									$('#hideProfileList').html('<i class="glyphicon glyphicon-minus"></i');
								}
								else{
									$('#hideProfileList').html('<i class="glyphicon glyphicon-plus"></i');
								}
								sizeOfExportArea();
							});
						});

						$(window).resize(function() {

				      windowSize.height = window.innerHeight;
				      windowSize.width = window.innerWidth;
				      chrome.storage.local.set({'windowSize' : windowSize}, function() {
				        console.log("save new windowSize");
				      });

							if(window.innerWidth>=992 && previusWindowWidth<992)
  							sizeOfExportArea();
							else if (window.innerWidth<992 && previusWindowWidth>=992)
  							sizeOfExportArea();
							previusWindowWidth=window.innerWidth;
						});

						$("#reset").click(function() {
							$("#modalReset").modal("show");
						})

						$("#yesReset").click(function() {
							chrome.storage.sync.clear(function (){});
							profileList=null;
							profileName_LastConnexion = null;
							initProfileList();
							$("#modalReset").modal("hide");
						});
					}

					function initProfileList(){
						if(profileList == null){
							profileList = {
								"list" : new Profile("text", "None", "", "\t", "\n", false, false, true, false, [], false),
								"HTML doc" : new Profile("html", "HeadingParents", "", "\t", "\n", true, false, true, true, [], false),
								"RTF doc" : new Profile("rtf", "HeadingParents", "", "\t", "\n", true, false, true, true, [], false),
								"LaTeX Report" : new Profile("latex", "None", "", "\t", "\n", true, false, true, true, [], false),
								"OPML" : new Profile("opml", "None", "", "\t", "\n", true, false, true, true, [], false),
								"LaTeX Beamer" : new Profile("beamer", "None", "", "\t", "\n", true, false, true, true, [], false)
							};
							chrome.storage.sync.set({'profileList' : profileList}, function() {
								console.log("profileList init");
							});
						};
						if(profileName_LastConnexion == null || !profileList.hasOwnProperty(profileName_LastConnexion)){
							profileName_LastConnexion="list";
							chrome.storage.sync.set({'profileName' : profileName_LastConnexion}, function() {
								console.log("profileName init");
							});
						};
						updateProfileChoice();
						document.getElementById("profileList").value = profileName_LastConnexion;
						updadeForm();
						curent_profile = copy(profileList[document.getElementById('profileList').value]);
					}

					var profileList = storageS.profileList;
					var profileName_LastConnexion = storageS.profileName;
					var curent_profile = null;
					var conflictProfileList=[];

					var textAreaStyle;
					if(storageL.textAreaStyle){
						textAreaStyle = storageL.textAreaStyle;
					}
					else {
						textAreaStyle={
							"font-family" : "Arial",
							"font-size" : 14
						};
						chrome.storage.local.set({'textAreaStyle' : textAreaStyle}, function() {
							console.log("textAreaStyle init");
						});
					}
			    $('#textArea').css("font-family", textAreaStyle["font-family"]);
			    $('#textArea').css('font-size', textAreaStyle["font-size"]+"px");

					var refreshOptions;
					if(storageL.refreshOptions){
						refreshOptions = storageL.refreshOptions;
					}
					else {
						refreshOptions={
							"autoCopy" : false,
							"autoDownload" : false
						};
						chrome.storage.local.set({'refreshOptions' : refreshOptions}, function() {
							console.log("refreshOptions init");
						});
					}

					var windowSize;
					if(storageL.windowSize){
						windowSize = storageL.windowSize;
					}
					else {
			      var tmp_width = Math.max(window.screen.availWidth*0.75, 500);
			      var tmp_height = Math.max(window.screen.availHeight*0.75, 600);
			      windowSize={
			        option : "relativeBrowser",
			        width : tmp_width,
			        height : tmp_height
			      };
						chrome.storage.local.set({'windowSize' : windowSize}, function() {
							console.log("windowSize init");
						});
					}

					initProfileList();

					var g_nodes = response.content;
					var g_title = response.title;
					var g_url = response.url;
					var g_email= response.email;

					exportText();
					setEventListers();
					sizeOfExportArea();
					var previusWindowWidth = window.innerWidth;
					return callback();
				});
			});
		})
	}

	function loading(func){
		var $loading = $("#loading");
		var $content = $("#content");
		var $divTextArea = $("#divTextArea");
		$divTextArea.height($divTextArea.height());
		$content.hide();
    $loading.css({
        'margin-left' : - $loading.width()/2 + "px",
        'margin-top' : - $loading.height()/2 + "px"
    });
		$loading.show("fast",function(){
			func(function(){
				$loading.hide();
				$content.show();
				$("#textArea").select();
				$divTextArea.height("auto");
			});
		});
	}

	return{
		main : function(currentTabId) {
			loading(function(callback){
				return load(currentTabId, callback);
			});
		}
	}
}());
