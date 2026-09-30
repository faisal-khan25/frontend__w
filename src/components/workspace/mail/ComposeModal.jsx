import { useState } from "react";
import toast from "react-hot-toast";
import { Paperclip, X } from "lucide-react";
import WorkspaceModal from "../common/WorkspaceModal";
import PeoplePicker from "../common/PeoplePicker";
import RichTextEditor from "../common/RichTextEditor";
import { mailApi } from "../../../lib/mailApi";
import { formatFileSize } from "../../../utils/date";


export default function ComposeModal({ mode = "new", sourceMessage, currentUserId, draft, onClose, onSent }) {
  const [to, setTo] = useState(draft?.to || prefillTo(mode, sourceMessage));
  const [cc, setCc] = useState(draft?.cc || prefillCc(mode, sourceMessage, currentUserId));
  const [bcc, setBcc] = useState(draft?.bcc || []);
  const [showCc, setShowCc] = useState((draft?.cc || []).length > 0);
  const [showBcc, setShowBcc] = useState((draft?.bcc || []).length > 0);
  const [subject, setSubject] = useState(draft?.subject ?? prefillSubject(mode, sourceMessage));
  const [body, setBody] = useState(draft?.bodyText ?? prefillBody(mode, sourceMessage));
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  function buildPayload(isDraft) {
    const mapRecipients = (list) =>
      list.map((p) => (p.id === p.email ? p.email : p.id));
    return {
      to: mapRecipients(to),
      cc: mapRecipients(cc),
      bcc: mapRecipients(bcc),
      subject,
      bodyText: body,
      isDraft,
    };
  }

  async function handleSend() {
    
    const isReplyMode = mode === "reply" || mode === "replyAll";
    if (!draft && !isReplyMode && to.length === 0) {
      toast.error("Add at least one recipient");
      return;
    }
    setSending(true);
    try {
      let result;
      if (mode === "reply" || mode === "replyAll") {
        result = await mailApi.replyMessage(
          sourceMessage.id,
          { bodyText: body, isReplyAll: mode === "replyAll", bcc: buildPayload(false).bcc },
          files
        );
      } else if (mode === "forward") {
        result = await mailApi.forwardMessage(sourceMessage.id, buildPayload(false), files);
      } else if (draft) {
        result = await mailApi.updateDraft(draft.id, { ...buildPayload(false) });
      } else {
        result = await mailApi.composeMessage(buildPayload(false), files);
      }
    
      if (result?.autoFlaggedSpam) {
        toast("Sent, but flagged as likely spam for the recipient(s).", { icon: "⚠️" });
      } else {
        toast.success("Message sent");
      }
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't send message");
    } finally {
      setSending(false);
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true);
    try {
      if (draft) {
        await mailApi.updateDraft(draft.id, buildPayload(true));
      } else {
        await mailApi.composeMessage(buildPayload(true), files);
      }
      toast.success("Draft saved");
      onSent?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  const title = { new: "New message", reply: "Reply", replyAll: "Reply all", forward: "Forward" }[mode] || "New message";
  const disabled = sending || savingDraft;

  return (
    <WorkspaceModal
      title={title}
      onClose={onClose}
      size="lg"
      bodyClassName="space-y-3"
      footer={
        <>
          <button className="btn-ghost btn-sm" onClick={onClose} disabled={disabled}>Discard</button>
          <button className="btn-outline btn-sm" onClick={handleSaveDraft} disabled={disabled}>
            {savingDraft ? "Saving…" : "Save draft"}
          </button>
          <button className="btn-primary btn-sm" onClick={handleSend} disabled={disabled}>
            {sending ? "Sending…" : "Send"}
          </button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted w-10 shrink-0">To</span>
        <div className="flex-1">
          <PeoplePicker value={to} onChange={setTo} placeholder="Recipients" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!showCc && (
            <button type="button" className="text-xs text-primary-600 font-medium" onClick={() => setShowCc(true)}>
              Cc
            </button>
          )}
          {!showBcc && (
            <button type="button" className="text-xs text-primary-600 font-medium" onClick={() => setShowBcc(true)}>
              Bcc
            </button>
          )}
        </div>
      </div>

      {showCc && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted w-10 shrink-0">Cc</span>
          <div className="flex-1">
            <PeoplePicker value={cc} onChange={setCc} placeholder="Carbon copy" />
          </div>
        </div>
      )}

      {showBcc && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted w-10 shrink-0">Bcc</span>
          <div className="flex-1">
            <PeoplePicker value={bcc} onChange={setBcc} placeholder="Blind carbon copy" />
          </div>
        </div>
      )}

      <input
        className="input-field"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <RichTextEditor value={body} onChange={setBody} minHeight="220px" placeholder="Write your message…" />

      <div className="flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium cursor-pointer">
          <Paperclip size={16} />
          Attach files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((f, i) => (
            <li key={i} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2 text-xs">
              <span className="truncate text-ink">{f.name} · {formatFileSize(f.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove attachment"
              >
                <X size={14} className="text-faint hover:text-coral" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </WorkspaceModal>
  );
}

function prefillTo(mode, msg) {
  if (!msg) return [];
  if (mode === "reply" || mode === "replyAll") return msg.from ? [msg.from] : [];
  return [];
}

function prefillCc(mode, msg, currentUserId) {
  if (mode !== "replyAll" || !msg) return [];
  const others = [...(msg.to || []), ...(msg.cc || [])].filter(
    (p) => p.id !== currentUserId && p.id !== msg.from?.id
  );
  const seen = new Set();
  return others.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
}

function prefillSubject(mode, msg) {
  if (!msg) return "";
  if (mode === "reply" || mode === "replyAll") return msg.subject?.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`;
  if (mode === "forward") return msg.subject?.startsWith("Fwd:") ? msg.subject : `Fwd: ${msg.subject}`;
  return "";
}

function prefillBody(mode, msg) {
  if (!msg || mode === "new") return "";
  const quoted = (msg.bodyText || "").replace(/</g, "&lt;");
  return `<br/><br/><blockquote style="border-left:2px solid #E1E9F4;padding-left:12px;color:#5B6B85;">${quoted}</blockquote>`;
}