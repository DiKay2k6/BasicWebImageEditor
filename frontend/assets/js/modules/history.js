// ==========================================
// UNDO / REDO HISTORY MANAGEMENT
// ==========================================

import {
    undoStack,
    redoStack,
    replaceEditorState,
    serializeEditorState
} from './state.js';

let pendingStateStr = null;

function setHistoryButtonState(btn, isEnabled) {
    if (!btn) return;
    btn.disabled = !isEnabled;
    if (isEnabled) {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.classList.add('hover:text-white', 'hover:bg-gray-800');
    } else {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.classList.remove('hover:text-white', 'hover:bg-gray-800');
    }
}

export function updateUndoRedoUI() {
    setHistoryButtonState(document.getElementById('btn-undo'), undoStack.length > 0);
    setHistoryButtonState(document.getElementById('btn-redo'), redoStack.length > 0);
}

export function saveState() {
    const currentStateStr = serializeEditorState();
    undoStack.push(currentStateStr);
    redoStack.length = 0;
    updateUndoRedoUI();
}

export function captureStateBeforeChange() {
    if (!pendingStateStr) {
        pendingStateStr = serializeEditorState();
    }
}

export function commitStateChange() {
    if (pendingStateStr) {
        const currentStateStr = serializeEditorState();
        if (pendingStateStr !== currentStateStr) {
            undoStack.push(pendingStateStr);
            redoStack.length = 0;
            updateUndoRedoUI();
        }
        pendingStateStr = null;
    }
}

export function initHistory({ onStateRestored }) {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    function restoreStateFromJson(stateStr) {
        const parsed = JSON.parse(stateStr);
        replaceEditorState(parsed.filters, parsed.transforms);
        if (onStateRestored) {
            onStateRestored();
        }
    }

    if (btnUndo) {
        btnUndo.addEventListener('click', () => {
            if (undoStack.length > 0) {
                redoStack.push(serializeEditorState());
                const prevStateStr = undoStack.pop();
                restoreStateFromJson(prevStateStr);
                updateUndoRedoUI();
            }
        });
    }

    if (btnRedo) {
        btnRedo.addEventListener('click', () => {
            if (redoStack.length > 0) {
                undoStack.push(serializeEditorState());
                const nextStateStr = redoStack.pop();
                restoreStateFromJson(nextStateStr);
                updateUndoRedoUI();
            }
        });
    }

    updateUndoRedoUI();
}
