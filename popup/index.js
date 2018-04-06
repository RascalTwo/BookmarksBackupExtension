const browser = (window.browser || window.chrome);


//#region Import

/**
 * Add JSON bookmark to the provided node.
 * 
 * @param {Object} node Bookmark node to add JSON to.
 * @param {Object} json JSON data for bookmark and children to add.
 */
function addBookmarksTo(node, json){
	// Root elements usually have no title, so this removes
	// a level of indentation.
	if (json.title === ''){
		if (!json.children) return;
		json.children.forEach(child => addBookmarksTo(node, child));
		return;
	}

	if (json.type === 'bookmark') return browser.bookmarks.create({
		parentId: node.id,
		title: json.title,
		url: json.url
	});

	return browser.bookmarks.create({
		parentId: node.id,
		title: json.title
	}).then(folder => {
		if (!json.children) return;
		json.children.forEach(child => addBookmarksTo(folder, child));
	});
}


// Get the file from the file-input, read it, and add the bookmarks.
document.getElementById('file-input').addEventListener('change', function(event){
	event.stopPropagation();

	return readAsText(this.files[0]).then(async response => {
		const json = JSON.parse(response.target.result);
		const folder = await browser.bookmarks.create({
			title: 'Imported Bookmarks'
		});
		return addBookmarksTo(folder, json[0]);
	}).then(() => spawnMessage('Successfully imported bookmarks')).catch(spawnMessage);
});


/**
 * Read text from File.
 * 
 * @param {File} file File to read text from.
 * 
 * @returns {Promise<Event>} The resulting event.
 */
function readAsText(file){
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = resolve;
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

//#endregion

//#region Export


// Export the selected bookmarks.
document.getElementById('export-button').addEventListener('click', function(event){
	event.stopPropagation();

	return browser.bookmarks.getTree().then(tree => {
		const excludedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:not(:checked)')).map(checkbox => checkbox.parentNode.id);

		filterChildren(tree[0], excludedIds);

		return browser.downloads.download({
			filename: 'bookmarks.json',
			url: URL.createObjectURL(new Blob([JSON.stringify(tree, null, '  ')], {
				type: 'application/json'
			}))
		});
	}).then(() => spawnMessage('Successfully exported')).catch(spawnMessage);
});


/**
 * Filter out children from the provided node.
 * 
 * @param {Object} node Node to filter children of.
 * @param {*} ids IDs of nodes to exclude.
 */
function filterChildren(node, ids){
	if (!node.children) return;
	node.children = node.children.filter(child => !ids.includes(child.id));
	node.children.forEach(child => filterChildren(child, ids));
}


/**
 * Update all checkboxes of element.
 * 
 * @param {Element} element Element to handle checkboxes of.
 * @param {Boolean} value Value of checkboxes.
 */
function handleCheckbox(element, value){
	element.getElementsByTagName('input')[0].checked = value;

	const ul = element.getElementsByTagName('ul')[0];
	if (!ul) return;

	Array.from(ul.children).forEach(child => handleCheckbox(child, value));
}


//Handle expanding and collapsing the bookmark menu.
document.getElementById('menu').addEventListener('click', function(event){
	event.stopPropagation();
	const clicked = event.target;

	if (clicked.tagName === 'INPUT') return handleCheckbox(clicked.parentNode, clicked.checked ? true : false);

	// Return if element is a bookmark and not a folder.
	const ul = clicked.getElementsByTagName('ul')[0];
	if (!ul) return;


	const children = Array.from(ul.children);
	const isExpanded = clicked.getAttribute('data-expanded');

	clicked.getElementsByTagName('img')[0].src = 'folder-' + (isExpanded ? 'red' : 'blue') + '.svg';

	const change = isExpanded ? 'add' : 'remove';
	children.forEach(child => child.classList[change]('hidden'));

	isExpanded ? clicked.removeAttribute('data-expanded') : clicked.setAttribute('data-expanded', 'true');
});


/**
 * Recursively generate a tree for the provided node.
 * 
 * @param {Object} node Node to generate HTML tree for.
 * 
 * @returns {Element} HTML element tree.
 */
function generateTree(node){
	if (node.type === 'separator') return null;

	const li = document.createElement('li');
	li.id = node.id;
	li.className = 'clickable hidden';

	const checkbox = document.createElement('input');
	checkbox.type = 'checkbox';
	checkbox.checked = true;

	const image = document.createElement('img');
	
	if (node.type === 'bookmark'){
		image.src = "bookmark.svg";

		const anchor = document.createElement('a');
		anchor.target = '_blank';
		anchor.textContent = node.title;
		anchor.href = node.url;

		li.appendChild(checkbox);
		li.appendChild(image);
		li.appendChild(anchor);
		return li;
	}

	image.src = "folder-red.svg";

	const ul = document.createElement('ul');
	const fragment = node.children.map(child => generateTree(child)).filter(li => li).reduce((fragment, li) => {
		fragment.appendChild(li);
		return fragment;
	}, document.createDocumentFragment());
	ul.appendChild(fragment);

	li.appendChild(checkbox);
	li.appendChild(image);
	li.appendChild(document.createTextNode(node.title));
	li.appendChild(ul);
	return li;
}
//#endregion

//#region Misc

//#region Message

/**
 * Spawn a message.
 * 
 * @param {any} message Message or Error to spawn.
 */
function spawnMessage(message){
	if (message instanceof Error) message = message.name + ': ' + message.message + '\n' + message.stack;
	else if (Array.isArray(message)) message = message.map(entity => entity.toString()).join('\n');
	else if (typeof message === 'object') message = JSON.stringify(message);

	const box = document.getElementById('message-box');
	box.textContent = message;
	box.classList.remove('hidden');
}


// Make the message box disapear.
document.getElementById('message-box').addEventListener('click', function(event){
	event.stopPropagation();
	this.classList.add('hidden');
});

//#endregion

['import', 'export'].forEach(prefix => document.getElementById(`${prefix}-tab-button`).addEventListener('click', toggleTab));

/**
 * Switch which tab is active.
 */
function toggleTab(event){
	event.stopPropagation();

	const target = this.id.split('-')[0];
	const otherTarget = target === 'import' ? 'export' : 'import';

	document.getElementById(`${otherTarget}-form`).classList.add('hidden');
	document.getElementById(`${target}-form`).classList.remove('hidden');

	document.getElementById(`${otherTarget}-tab-button`).classList.remove('active-tab');
	this.classList.add('active-tab');
}


// Get the inital bookmark tree and populate the export menu.
browser.bookmarks.getTree().then(tree => {
	const li = generateTree(tree[0]);
	li.classList.remove('hidden');
	li.childNodes[2].textContent = 'All';
	document.getElementById('menu').appendChild(li);
}).catch(spawnMessage);

//#endregion