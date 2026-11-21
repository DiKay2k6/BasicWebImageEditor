// ==========================================
// UNDO / REDO HISTORY MANAGEMENT
// ==========================================

import {
    undoStack,
    redoStack,
    replaceEditorState,
    serializeEditorState
} from './state.js';

const MAX_HISTORY_ENTRIES = 50;

let pendingStateStr = null;
let restoreState = null;

function setHistoryButtonState(btn, isEnabled) {
    if (!btn) return;
    btn.disabled = !isEnabled;
    btn.classList.toggle('opacity-50', !isEnabled);
    btn.classList.toggle('cursor-not-allowed', !isEnabled);
    btn.classList.toggle('hover:text-white', isEnabled);
    btn.classList.toggle('hover:bg-gray-800', isEnabled);
}

export function updateUndoRedoUI() {
    setHistoryButtonState(document.getElementById('btn-undo'), undoStack.length > 0);
    setHistoryButtonState(document.getElementById('btn-redo'), redoStack.length > 0);
}

function pushUndoEntry(stateStr) {
    undoStack.push(stateStr);
    if (undoStack.length > MAX_HISTORY_ENTRIES) undoStack.shift();
    redoStack.length = 0;
    updateUndoRedoUI();
}

/** Lưu trạng thái hiện tại trước một thay đổi tức thời (click nút). */
export function saveState() {
    pendingStateStr = null;
    pushUndoEntry(serializeEditorState());
}

/** Ghi nhớ trạng thái trước khi bắt đầu kéo slider (chỉ lấy lần đầu của một lần kéo). */
export function captureStateBeforeChange() {
    if (!pendingStateStr) {
        pendingStateStr = serializeEditorState();
    }
}

/** Kết thúc lần kéo slider: chỉ tạo mục Undo nếu giá trị thực sự thay đổi. */
export function commitStateChange() {
    if (!pendingStateStr) return;
    if (pendingStateStr !== serializeEditorState()) {
        pushUndoEntry(pendingStateStr);
    }
    pendingStateStr = null;
}

function moveState(fromStack, toStack) {
    if (fromStack.length === 0) return;
    pendingStateStr = null;
    toStack.push(serializeEditorState());
    const target = JSON.parse(fromStack.pop());
    replaceEditorState(target.filters, target.transforms);
    updateUndoRedoUI();
    if (restoreState) restoreState();
}

export const undo = () => moveState(undoStack, redoStack);
export const redo = () => moveState(redoStack, undoStack);

function isTypingTarget(target) {
    return target instanceof HTMLElement && (
        target.isContentEditable ||
        ['TEXTAREA', 'SELECT'].includes(target.tagName) ||
        (target.tagName === 'INPUT' && !['range', 'checkbox', 'radio', 'button'].includes(target.type))
    );
}

function handleKeyboardShortcut(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || isTypingTarget(event.target)) return;
    const key = event.key.toLowerCase();

    if (key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault();
        redo();
    }
}

export function initHistory({ onStateRestored }) {
    restoreState = onStateRestored;
    document.getElementById('btn-undo')?.addEventListener('click', undo);
    document.getElementById('btn-redo')?.addEventListener('click', redo);
    // Ctrl+Z: Undo · Ctrl+Y / Ctrl+Shift+Z: Redo (bỏ qua khi đang gõ trong ô nhập liệu)
    document.addEventListener('keydown', handleKeyboardShortcut);
    updateUndoRedoUI();
}
