/**
 * The library's stylesheet. Everything is scoped under `.mwpet` and themed with CSS custom
 * properties, so you can restyle the chat without fighting specificity:
 *
 * ```css
 * .mwpet { --mwpet-accent: hotpink; --mwpet-radius: 6px; }
 * ```
 */
export const css = /* css */ `
.mwpet {
  --mwpet-surface: #ffffff;
  --mwpet-text: #1f2633;
  --mwpet-muted: #6a7384;
  --mwpet-border: #d5dbe5;
  --mwpet-soft: #f1f4f9;
  --mwpet-field: #ffffff;
  --mwpet-accent: #6a7fd8;
  --mwpet-accent-text: #ffffff;
  --mwpet-online: #2fb37a;
  --mwpet-radius: 14px;
  --mwpet-font: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --mwpet-shadow: 0 14px 40px rgba(0, 0, 0, 0.18);
  position: fixed;
  top: 0;
  left: 0;
  will-change: transform;
  font-family: var(--mwpet-font);
  color: var(--mwpet-text);
  -webkit-tap-highlight-color: transparent;
}
.mwpet[data-theme='dark'] {
  --mwpet-surface: #1c212c;
  --mwpet-text: #e6e9ef;
  --mwpet-muted: #8c95a6;
  --mwpet-border: #2e3546;
  --mwpet-soft: #2c3344;
  --mwpet-field: #232937;
  --mwpet-accent: #5b6fcc;
}
@media (prefers-color-scheme: dark) {
  .mwpet[data-theme='auto'] {
    --mwpet-surface: #1c212c;
    --mwpet-text: #e6e9ef;
    --mwpet-muted: #8c95a6;
    --mwpet-border: #2e3546;
    --mwpet-soft: #2c3344;
    --mwpet-field: #232937;
    --mwpet-accent: #5b6fcc;
  }
}
.mwpet *, .mwpet *::before, .mwpet *::after { box-sizing: border-box; }
.mwpet[data-state='hidden'] { display: none; }
.mwpet[data-state='hiding'], .mwpet[data-state='showing'] { pointer-events: none; }

.mwpet-body {
  width: 100%;
  height: 100%;
  border-radius: 24px;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
}
.mwpet[data-draggable='true'] .mwpet-body { cursor: grab; touch-action: none; }
.mwpet[data-draggable='true'] .mwpet-body:active { cursor: grabbing; }
.mwpet-body:focus-visible { box-shadow: 0 0 0 3px var(--mwpet-accent); }
.mwpet-body svg { display: block; overflow: visible; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.12)); }

/* ---------- speech bubble ---------- */
.mwpet-speech {
  position: absolute;
  bottom: calc(100% - var(--mwpet-head, 60px));
  left: 50%;
  max-width: 260px;
  padding: 8px 12px;
  border: 1px solid var(--mwpet-border);
  border-radius: 12px;
  background: var(--mwpet-surface);
  color: var(--mwpet-text);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  width: max-content;
  transform: translateX(-50%);
  pointer-events: none;
  animation: mwpet-pop 0.25s cubic-bezier(0.3, 1.6, 0.6, 1);
}
.mwpet-speech::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -8px;
  border: 8px solid transparent;
  border-top-color: var(--mwpet-surface);
}
.mwpet-speech[hidden] { display: none; }
@keyframes mwpet-pop { from { opacity: 0; transform: translate(-50%, 6px) scale(0.6); } }

/* ---------- chat balloon ---------- */
.mwpet-chat {
  position: absolute;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--mwpet-border);
  border-radius: var(--mwpet-radius);
  background: var(--mwpet-surface);
  color: var(--mwpet-text);
  box-shadow: var(--mwpet-shadow);
  font-size: 14px;
  animation: mwpet-chat-pop 0.22s cubic-bezier(0.3, 1.5, 0.6, 1);
}
.mwpet-chat[hidden] { display: none; }
.mwpet-chat[data-side='right'] { left: calc(100% - 22px * var(--mwpet-size, 1)); }
.mwpet-chat[data-side='left'] { right: calc(100% - 22px * var(--mwpet-size, 1)); }
.mwpet-chat[data-align='bottom'] { bottom: calc(40px * var(--mwpet-size, 1)); }
.mwpet-chat[data-align='top'] { top: calc(70px * var(--mwpet-size, 1)); }
/* tail pointing at the pet */
.mwpet-chat::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--mwpet-surface);
  border: 1px solid var(--mwpet-border);
  border-top: 0;
  border-right: 0;
}
.mwpet-chat[data-side='right']::before { left: -7px; transform: rotate(45deg); }
.mwpet-chat[data-side='left']::before { right: -7px; transform: rotate(-135deg); }
.mwpet-chat[data-align='bottom']::before { bottom: 80px; }
.mwpet-chat[data-align='top']::before { top: 40px; }
@keyframes mwpet-chat-pop { from { opacity: 0; transform: scale(0.9); } }

.mwpet-chat-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px 10px 14px;
  border-bottom: 1px solid var(--mwpet-border);
}
.mwpet-chat-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--mwpet-online); flex: none; }
.mwpet-chat-title { font-weight: 700; }
.mwpet-chat-status { color: var(--mwpet-muted); font-size: 12px; }
.mwpet-chat-clear {
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid var(--mwpet-border);
  border-radius: 6px;
  background: none;
  color: var(--mwpet-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.mwpet-chat-clear[hidden] { display: none; }
.mwpet-chat-close {
  margin-left: auto;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--mwpet-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.mwpet-chat-clear:not([hidden]) + .mwpet-chat-close { margin-left: 0; }
.mwpet-chat-clear:hover, .mwpet-chat-close:hover { background: var(--mwpet-soft); color: var(--mwpet-text); }

.mwpet-chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mwpet-chat-empty { margin: auto; color: var(--mwpet-muted); text-align: center; }
.mwpet-msg {
  max-width: 85%;
  padding: 8px 11px;
  border-radius: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.mwpet-msg[data-role='user'] {
  align-self: flex-end;
  background: var(--mwpet-accent);
  color: var(--mwpet-accent-text);
  border-bottom-right-radius: 4px;
}
.mwpet-msg[data-role='assistant'] {
  align-self: flex-start;
  background: var(--mwpet-soft);
  border-bottom-left-radius: 4px;
}
.mwpet-msg[data-streaming]::after {
  content: '▍';
  margin-left: 1px;
  color: var(--mwpet-online);
  animation: mwpet-caret 0.9s steps(1) infinite;
}
@keyframes mwpet-caret { 50% { opacity: 0; } }
.mwpet-typing { display: flex; gap: 4px; padding: 11px 12px; }
.mwpet-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--mwpet-muted);
  animation: mwpet-typing 1s infinite ease-in-out;
}
.mwpet-typing span:nth-child(2) { animation-delay: 0.15s; }
.mwpet-typing span:nth-child(3) { animation-delay: 0.3s; }
@keyframes mwpet-typing { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-4px); opacity: 1; } }

.mwpet-chat-suggest { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 12px 10px; }
.mwpet-chat-suggest[hidden] { display: none; }
.mwpet-chat-suggest button {
  padding: 5px 10px;
  border: 1px solid var(--mwpet-border);
  border-radius: 999px;
  background: var(--mwpet-field);
  color: var(--mwpet-text);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}
.mwpet-chat-suggest button:hover { border-color: var(--mwpet-accent); }

.mwpet-chat-form { display: flex; gap: 6px; padding: 10px; border-top: 1px solid var(--mwpet-border); }
.mwpet-chat-input {
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--mwpet-border);
  border-radius: 8px;
  background: var(--mwpet-field);
  color: var(--mwpet-text);
  font: inherit;
  outline: none;
}
.mwpet-chat-input:focus { border-color: var(--mwpet-accent); }
.mwpet-chat-send {
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--mwpet-accent);
  color: var(--mwpet-accent-text);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.mwpet-chat-send:disabled { opacity: 0.45; cursor: default; }
.mwpet-chat-send[data-stop] { background: var(--mwpet-soft); border-color: var(--mwpet-border); color: var(--mwpet-text); }
.mwpet-chat button:focus-visible { outline: 2px solid var(--mwpet-accent); outline-offset: 2px; }

/* corner resize grips: invisible until the pointer is right on a corner */
.mwpet-grip { position: absolute; width: 22px; height: 22px; z-index: 1; touch-action: none; }
.mwpet-grip[data-corner='nw'] { top: -7px; left: -7px; cursor: nwse-resize; }
.mwpet-grip[data-corner='se'] { bottom: -7px; right: -7px; cursor: nwse-resize; }
.mwpet-grip[data-corner='ne'] { top: -7px; right: -7px; cursor: nesw-resize; }
.mwpet-grip[data-corner='sw'] { bottom: -7px; left: -7px; cursor: nesw-resize; }
.mwpet-grip::after {
  content: '';
  position: absolute;
  inset: 7px;
  border: 2px solid var(--mwpet-muted);
  opacity: 0;
  transition: opacity 0.15s;
}
.mwpet-grip[data-corner='nw']::after { border-right: 0; border-bottom: 0; border-top-left-radius: 10px; }
.mwpet-grip[data-corner='ne']::after { border-left: 0; border-bottom: 0; border-top-right-radius: 10px; }
.mwpet-grip[data-corner='sw']::after { border-right: 0; border-top: 0; border-bottom-left-radius: 10px; }
.mwpet-grip[data-corner='se']::after { border-left: 0; border-top: 0; border-bottom-right-radius: 10px; }
.mwpet-grip:hover::after, .mwpet-grip:active::after { opacity: 0.9; }

.mwpet-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .mwpet-speech, .mwpet-chat, .mwpet-typing span, .mwpet-msg[data-streaming]::after { animation: none; }
}
`

const STYLE_ID = 'mwpet-styles'

/** Add the stylesheet to the document once (no-op if it's already there). */
export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return
  const style = doc.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  doc.head.appendChild(style)
}
