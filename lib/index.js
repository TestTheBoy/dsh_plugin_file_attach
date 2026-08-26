//#region lib/types/index.js
/**
* dsh-client-ui-file-attach — host half.
*
* Two host-side contributions make "attached files join the session context":
*
* 1. `/attach-files` command: the browser half syncs the current attachment
*    list (id, name, content) here on every add/remove. `recordInput: false`
*    keeps file contents out of the session log. The list is authoritative
*    from the browser and replaces the previous set wholesale.
*
* 2. `agent/pre-step` injection: for every accepted direct user message while
*    the session has attached files, a frozen context message carrying the
*    file contents is appended right after it — the model sees the files in
*    its context window on every turn, without polluting chat history.
*
* The store is intentionally in-memory and per-session: composer attachments
* are browser-owned drafts (like unsent images), so they live only while the
* browser session and this host process do.
*/
import { createUserMessage, freezeMessage } from "@deepseek-ai/dsh-llm";
//#endregion

//#region limits
/** Hard cap on simultaneously attached files (mirrors the browser-side chip limit). */
const MAX_FILES = 10;
/** Per-file content cap kept in the host store (bytes). */
const MAX_FILE_BYTES = 256 * 1024;
/** Total content budget for one session's attachments (bytes). */
const MAX_TOTAL_BYTES = 1024 * 1024;
//#endregion

//#region store
/** sessionId -> attachment list [{ id, name, content }]. */
const attachStore = /* @__PURE__ */ new Map();
//#endregion

//#region helpers
/** Validate the browser-synced list, throwing a command error on violation. */
function normalizeFiles(value) {
	if (!Array.isArray(value)) throw new Error("attach-files: expected a JSON array");
	if (value.length > MAX_FILES) throw new Error(`attach-files: at most ${MAX_FILES} files can be attached`);
	const files = [];
	let total = 0;
	for (const item of value) {
		if (typeof item !== "object" || item === null) throw new Error("attach-files: each entry must be an object");
		const { id, name, content } = item;
		if (typeof id !== "string" || typeof name !== "string" || typeof content !== "string") throw new Error("attach-files: each entry needs string id, name, content");
		if (content.length > MAX_FILE_BYTES) throw new Error(`attach-files: "${name}" exceeds the ${MAX_FILE_BYTES}-byte per-file cap`);
		total += content.length;
		if (total > MAX_TOTAL_BYTES) throw new Error("attach-files: total content exceeds the 1 MiB context budget");
		files.push({ id, name, content });
	}
	return files;
}

/** Render one attachment as a model-visible block. */
function renderFile(file) {
	return `【文件：${file.name}】\n\`\`\`\n${file.content}\n\`\`\``;
}

/** Append the attached-file context message after every direct user message. */
function injectFiles(messages, files) {
	const text = `以下是用户附加到本会话的文件内容，请结合它们回答：\n\n${files.map(renderFile).join("\n\n")}`;
	const context = freezeMessage(createUserMessage({
		source: {
			kind: "file-attach",
			form: "files",
			version: 1,
			files: files.map((file) => ({ id: file.id, name: file.name }))
		},
		content: [{
			type: "text",
			text
		}]
	}));
	const output = [];
	for (const message of messages) {
		output.push(message);
		if (message.source.kind === "user" && message.source.form === void 0) output.push(context);
	}
	return output;
}
//#endregion

//#region apply
/** Required services: the human-command registry. */
const inject = ["commands"];
/** Host plugin body. */
function apply(ctx) {
	ctx.commands.register({
		name: "attach-files",
		description: "Set the files attached to this session's context",
		input: { hint: 'JSON array [{id,name,content}]' },
		recordInput: false,
		handler: ({ agent, rawInput }) => {
			const files = normalizeFiles(JSON.parse(rawInput));
			attachStore.set(agent.id, files);
			return { kind: "success", text: `attached ${files.length} file(s) to the session context` };
		}
	});
	ctx.on("agent/pre-step", async ({ agent }, next) => {
		const decision = await next();
		if (decision.kind === "reject") return decision;
		const files = attachStore.get(agent.id);
		if (files === void 0 || files.length === 0) return decision;
		return {
			kind: "enter",
			messages: injectFiles(decision.messages, files)
		};
	}, { prepend: true });
}
//#endregion

export { apply, inject };
