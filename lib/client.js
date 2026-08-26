window.__ModuleLoader__.load({
	id: "dsh-client-ui-file-attach",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region FileAttach.module.css
		const css = ".dshFa_wrap{align-items:center;gap:6px;display:inline-flex;position:relative}.dshFa_add{min-width:0;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:24px;align-items:center;gap:4px;padding:0 8px;font-size:13px;font-weight:500;line-height:20px;display:inline-flex}.dshFa_add:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dshFa_add:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3)}.dshFa_add:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}.dshFa_strip{box-sizing:border-box;width:calc(100% - 4 * var(--dsh-composer-dock-inset));max-width:calc(var(--dsh-composer-card-max-width) - 4 * var(--dsh-composer-dock-inset));--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);align-items:center;gap:6px;margin:0 auto;padding:2px 0 4px;display:flex;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:var(--dsh-scrollbar-thumb) transparent}.dshFa_strip::-webkit-scrollbar{height:6px}.dshFa_strip::-webkit-scrollbar-thumb{background:var(--dsh-scrollbar-thumb);border-radius:999px}.dshFa_strip::-webkit-scrollbar-thumb:hover{background:var(--dsh-scrollbar-thumb-hover)}.dshFa_strip::-webkit-scrollbar-track{background:0 0}.dshFa_file{background:var(--dsw-alias-interactive-bg-hover);max-width:320px;height:24px;color:var(--dsw-alias-label-secondary);border-radius:999px;align-items:center;gap:4px;padding:0 10px 0 2px;font-size:12px;font-weight:500;line-height:24px;flex:0 0 auto;display:inline-flex}.dshFa_fileX{cursor:pointer;width:20px;height:20px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;font-size:12px;line-height:1;display:inline-flex}.dshFa_fileX:hover{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}.dshFa_fileName{min-width:0;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}";
		const tagId = "dsh-client-ui-file-attach/FileAttach.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-client-ui-file-attach";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var FileAttach_module_css_default = {
			"add": "dshFa_add",
			"file": "dshFa_file",
			"fileName": "dshFa_fileName",
			"fileX": "dshFa_fileX",
			"strip": "dshFa_strip",
			"wrap": "dshFa_wrap"
		};
		//#endregion
		//#region limits
		/** Hard cap on simultaneously attached files (mirrors the host cap). */
		const MAX_FILES = 10;
		/** Per-file content cap synced to the host (bytes). */
		const MAX_FILE_BYTES = 256 * 1024;
		//#endregion
		//#region shared per-session store
		/** sessionId -> { files: [{id,name,content}], listeners: Set<fn> } — shared by the add chip and the chips strip. */
		const sessionStates = /* @__PURE__ */ new Map();
		function ensureSessionState(sessionId) {
			let state = sessionStates.get(sessionId);
			if (state === void 0) {
				state = { files: [], listeners: new Set() };
				sessionStates.set(sessionId, state);
			}
			return state;
		}
		/**
		* Read + write the per-session attachment list; the setter notifies every
		* subscriber (the chip and the strip share one list per session).
		*/
		function useSessionFiles(sessionId) {
			const [files, setFiles] = react.useState(() => sessionId === void 0 ? [] : ensureSessionState(sessionId).files);
			react.useEffect(() => {
				if (sessionId === void 0) return;
				const state = ensureSessionState(sessionId);
				const listener = () => setFiles(state.files);
				state.listeners.add(listener);
				return () => {
					state.listeners.delete(listener);
				};
			}, [sessionId]);
			return [files, react.useCallback((next) => {
				if (sessionId === void 0) return;
				const state = ensureSessionState(sessionId);
				state.files = next;
				setFiles(next);
				for (const listener of [...state.listeners]) listener();
			}, [sessionId])];
		}
		function newFileId() {
			return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `file-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		}
		//#endregion
		//#region locales
		/** `fileAttach` namespace dictionaries. */
		const NS = "fileAttach";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"attach.label": "添加文件",
			"attach.title": "选择本地文件：内容将加入会话上下文，图片作为附件发送",
			"attach.added": "已添加 {count} 个文件到上下文",
			"attach.removed": "已移除 {name}",
			"attach.limit": "最多添加 {count} 个文件",
			"attach.tooLarge": "{name} 超过 {size}，未添加",
			"attach.binary": "{name} 不是可读文本文件，未添加",
			"attach.imageAdded": "已添加 {count} 张图片附件",
			"attach.imageUnsupported": "{name} 不是支持的图片格式，未添加",
			"attach.imageBusy": "输入框正忙，图片暂未添加",
			"attach.syncFailed": "附件同步失败：{message}",
			"attach.removeAria": "移除文件 {name}"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"attach.label": "Add files",
			"attach.title": "Pick local files: their content joins the session context; images attach as message blocks",
			"attach.added": "Added {count} file(s) to the context",
			"attach.removed": "Removed {name}",
			"attach.limit": "At most {count} files can be attached",
			"attach.tooLarge": "{name} exceeds {size}, not added",
			"attach.binary": "{name} is not a readable text file, not added",
			"attach.imageAdded": "Added {count} image attachment(s)",
			"attach.imageUnsupported": "{name} is not a supported image format, not added",
			"attach.imageBusy": "The composer is busy; the image was not added",
			"attach.syncFailed": "Failed to sync attachments: {message}",
			"attach.removeAria": "Remove file {name}"
		};
		//#endregion
		//#region helpers
		function sizeText(bytes) {
			if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
			if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
			return `${bytes} B`;
		}
		/** Build the host-sync payload (content trimmed to the host's inline budget). */
		function syncPayload(files) {
			return files.map((file) => ({
				id: file.id,
				name: file.name,
				content: file.content.length > MAX_FILE_BYTES ? file.content.slice(0, MAX_FILE_BYTES) : file.content
			}));
		}
		//#endregion
		//#region AddFileButton
		/**
		* Composer tool-row chip (conversation.input.left seat): opens the file
		* picker. Text/code files are read and staged as session attachments;
		* images ride the built-in draft-image pipeline.
		*/
		function AddFileButton({ conversation, syncAttachments, useInput, inputActions, useSession, sessionId, t }) {
			const inputRef = react.useRef(null);
			const chipRef = react.useRef(null);
			const input = useInput((s) => s);
			const removed = useSession((s) => s.removed) ?? false;
			const busy = input?.phase === "adjudicating" || input?.phase === "submitting";
			const locked = removed || input === void 0 || inputActions === void 0 || conversation === void 0 || syncAttachments === void 0 || sessionId === void 0;
			const [files, setFiles] = useSessionFiles(sessionId);
			const [toast, setToast] = react.useState(null);
			const toastSeq = react.useRef(0);
			const showToast = react.useCallback((text) => {
				toastSeq.current += 1;
				setToast({ seq: toastSeq.current, text });
			}, []);
			const dismissToast = react.useCallback(() => {
				setToast(null);
			}, []);
			/* Keep the host store in sync with the shared list (also clears on unmount). */
			react.useEffect(() => {
				if (sessionId === void 0 || syncAttachments === void 0) return;
				let live = true;
				syncAttachments(sessionId, syncPayload(files)).then((result) => {
					if (!live || result.ok) return;
					showToast(t("attach.syncFailed", { message: result.error?.message ?? "unknown" }));
				}, (error) => {
					if (live) showToast(t("attach.syncFailed", { message: error instanceof Error ? error.message : String(error) }));
				});
				return () => {
					live = false;
				};
			}, [files, sessionId, syncAttachments, showToast, t]);
			const handleFiles = async (picked) => {
				const nextFiles = [...files];
				let added = 0;
				let addedImages = 0;
				const issues = [];
				for (const file of picked) {
					if (file.type.startsWith("image/")) {
						try {
							const created = conversation.createDraftImages([file]);
							if (!inputActions.addImages(created.map((attachment) => attachment.id))) {
								conversation.releaseDraftImages(created);
								issues.push(t("attach.imageBusy"));
							} else {
								addedImages += 1;
							}
						} catch {
							issues.push(t("attach.imageUnsupported", { name: file.name }));
						}
						continue;
					}
					if (nextFiles.length >= MAX_FILES) {
						issues.push(t("attach.limit", { count: MAX_FILES }));
						break;
					}
					if (file.size > MAX_FILE_BYTES) {
						issues.push(t("attach.tooLarge", { name: file.name, size: sizeText(MAX_FILE_BYTES) }));
						continue;
					}
					let text;
					try {
						const bytes = new Uint8Array(await file.arrayBuffer());
						if (bytes.subarray(0, Math.min(bytes.length, 8192)).includes(0)) {
							issues.push(t("attach.binary", { name: file.name }));
							continue;
						}
						text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
					} catch {
						issues.push(t("attach.binary", { name: file.name }));
						continue;
					}
					if (text.includes("\uFFFD")) {
						issues.push(t("attach.binary", { name: file.name }));
						continue;
					}
					nextFiles.push({ id: newFileId(), name: file.name, content: text });
					added += 1;
				}
				if (nextFiles.length !== files.length) setFiles(nextFiles);
				const parts = [];
				if (added > 0) parts.push(t("attach.added", { count: added }));
				if (addedImages > 0) parts.push(t("attach.imageAdded", { count: addedImages }));
				if (parts.length > 0) showToast(parts.join("，"));
				else if (issues.length > 0) showToast(issues[0]);
			};
			const onPick = (event) => {
				const picked = Array.from(event.target.files ?? []).filter((file) => file !== null);
				event.target.value = "";
				if (picked.length > 0) void handleFiles(picked);
			};
			return react_jsx_runtime.jsxs("span", {
				className: FileAttach_module_css_default.wrap,
				children: [
					react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
						label: t("attach.title"),
						side: "top",
						delayMs: 500,
						children: react_jsx_runtime.jsx("button", {
							ref: chipRef,
							type: "button",
							className: FileAttach_module_css_default.add,
							"aria-label": t("attach.label"),
							disabled: locked || busy,
							onClick: () => {
								inputRef.current?.click();
							},
							children: react_jsx_runtime.jsxs(react_jsx_runtime.Fragment, {
								children: [
									react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.IconPaperclipOutline16, { size: 14 }),
									react_jsx_runtime.jsx("span", { children: t("attach.label") })
								]
							})
						})
					}),
					react_jsx_runtime.jsx("input", {
						ref: inputRef,
						type: "file",
						multiple: true,
						hidden: true,
						onChange: onPick
					}),
					toast !== null && react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Toast, {
						text: toast.text,
						icon: react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {}),
						anchor: chipRef.current,
						onDone: dismissToast
					}, toast.seq)
				]
			});
		}
		//#endregion
		//#region FileChipsStrip
		/**
		* Floating chips strip above the composer card (conversation.input.dock
		* seat): one pill per attached file, ✕ on the left removes it, wrapping
		* left-to-right within the input column. Renders nothing when empty and
		* never touches the composer card's own layout.
		*/
		function FileChipsStrip({ sessionId, t }) {
			const [files, setFiles] = useSessionFiles(sessionId);
			const removeFile = react.useCallback((id) => {
				if (sessionId === void 0) return;
				const state = ensureSessionState(sessionId);
				const next = state.files.filter((file) => file.id !== id);
				if (next.length === state.files.length) return;
				setFiles(next);
			}, [sessionId, setFiles]);
			if (files.length === 0) return null;
			return react_jsx_runtime.jsx("div", {
				className: FileAttach_module_css_default.strip,
				"data-file-attach-strip": "",
				children: files.map((file) => react_jsx_runtime.jsxs("span", {
					className: FileAttach_module_css_default.file,
					title: file.name,
					children: [
						react_jsx_runtime.jsx("button", {
							type: "button",
							className: FileAttach_module_css_default.fileX,
							"aria-label": t("attach.removeAria", { name: file.name }),
							onClick: () => {
								removeFile(file.id);
							},
							children: "\u2715"
						}),
						react_jsx_runtime.jsx("span", {
							className: FileAttach_module_css_default.fileName,
							children: file.name
						})
					]
				}, file.id))
			});
		}
		//#endregion
		//#region index
		/** Required services: slot registry, conversation attachment face, locale, Remote command channel. */
		const inject = ["slots", "conversation", "locale", "remote", "remote.commands"];
		/** Register the composer add-file chip and the attached-files strip. */
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-file-attach: dictionaries");
			const syncAttachments = (sessionId, files) => ctx.remote.commands.execute(sessionId, `/attach-files ${JSON.stringify(files)}`, []);
			ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
				name: "conversation.input.left",
				id: "file-attach",
				order: 100,
				locale: NS,
				inject: () => ({ conversation: ctx.conversation, syncAttachments })
			}, AddFileButton));
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "file-attach",
				order: 100,
				locale: NS
			}, FileChipsStrip));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
