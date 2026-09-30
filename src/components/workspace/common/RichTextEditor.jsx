import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List } from "lucide-react";

export default function RichTextEditor({ value, onChange, minHeight = "160px", placeholder }) {
  const editorRef = useRef(null);
  const isUpdating = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      isUpdating.current = true;
      el.innerHTML = value || "";
      isUpdating.current = false;
    }
  }, [value]);

  function exec(cmd, val) {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    onChange(editorRef.current?.innerHTML || "");
  }

  function handleInput() {
    if (!isUpdating.current) {
      onChange(editorRef.current?.innerHTML || "");
    }
  }

  return (
    <div className="rounded-xl border border-line overflow-hidden focus-within:ring-2 focus-within:ring-primary-200 focus-within:border-primary">
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-line bg-canvas">
        <ToolBtn onClick={() => exec("bold")} title="Bold"><Bold size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec("italic")} title="Italic"><Italic size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec("underline")} title="Underline"><Underline size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec("insertUnorderedList")} title="Bullet list"><List size={14} /></ToolBtn>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="px-3 py-2.5 text-sm text-ink outline-none workspace-rte empty:before:content-[attr(data-placeholder)] empty:before:text-faint"
        style={{ minHeight }}
      />
    </div>
  );
}

function ToolBtn({ onClick, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      className="p-1.5 rounded text-muted hover:bg-primary-50 hover:text-ink transition-colors"
    >
      {children}
    </button>
  );
}
