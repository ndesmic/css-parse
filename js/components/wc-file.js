customElements.define("wc-file",
	class extends HTMLElement {
		static get observedAttributes(){
			return [];
		}
		constructor(){
			super();
			this.bind(this);
			this.ready = new Promise((res) => this.makeReady = res);
		}
		bind(element){
			element.attachEvents = element.attachEvents.bind(element);
			element.cacheDom = element.cacheDom.bind(element);
			element.render = element.render.bind(element);
			element.pick = element.pick.bind(element);
			element.verify = element.verify.bind(element);
			element.openRecent = element.openRecent.bind(element);
			element.open = element.open.bind(element);
		}
		render(){
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<div>Choose a File:</div>
				<button id="pick">Select</button>
				<button id="recent">Recent</button>
				<div id="preview"></div>
			`;
		}
		async connectedCallback(){
			this.idbKey = this.getAttribute("key");
			this.idb = await (() =>
				new Promise((resolve, reject) => {
					const request = indexedDB.open("wc-workspace", 1);
					request.onerror = () => reject(request.error);
					request.onupgradeneeded = e => {
						if(!e.target.result.objectStoreNames.contains("handles")){
							e.target.result.createObjectStore("handles");
						}
					}
					request.onsuccess = () => resolve(request.result);
				}))();
			this.filehandle = await (() => 
				new Promise((resolve, reject) => {
					const transaction = this.idb.transaction("handles", "readonly");
					const request = transaction.objectStore("handles").get(this.idbKey);
					request.onsuccess = e => resolve(e.target.result);
					request.onerror = () => reject(request.error);
				}))();
			this.render();
			this.cacheDom();
			this.attachEvents();
			this.makeReady();
		}
		cacheDom(){
			this.dom = {
				pick: this.shadowRoot.querySelector("#pick"),
				preview: this.shadowRoot.querySelector("#preview"),
				recent: this.shadowRoot.querySelector("#recent")
			};
		}
		attachEvents(){
			this.dom.pick.addEventListener("click", this.pick);
			this.dom.recent.addEventListener("click", this.openRecent);
		}
		async pick(){
			this.filehandle = await chooseFileSystemEntries();
			await (() => new Promise((resolve, reject) => {
				const transaction = this.idb.transaction("handles", "readwrite");
				const request = transaction.objectStore("handles").put(this.filehandle, this.idbKey);
				request.onsuccess = e => resolve(e.target.result);
				request.onerror = () => reject(request.error);
			}))();
			this.open();
		}
		async openRecent(){
			if (await this.verify()) {
				this.open();
			}
		}
		async open(){
			const file = await this.filehandle.getFile();
			const text = await file.text();
			this.dom.preview.textContent = text;
		}
		async verify(){
			if(!this.filehandle) return false;
			if(await this.filehandle.queryPermission({ writable: true }) === "granted") return true;
			if(await this.filehandle.requestPermission({ writable: true }) === "granted") return true;
			return false;
		}
		getHandle(){
			return this.ready().then(() => this.filehandle);
		}
		fireEvent(eventName, bubbles = true, cancelable = true){
			const event = document.createEvent("HTMLEvents");
			event.initEvent(eventName, bubbles, cancelable);
			return this.dispatchEvent(event);
		}
		attributeChangedCallback(name, oldValue, newValue){
			this[name] = newValue;
		}
	}
);
