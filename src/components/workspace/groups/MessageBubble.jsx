import { AlertCircle, Clock, Trash2 } from "lucide-react";
import MessageAttachment from "../chat/MessageAttachment";
import { groupApi } from "../../../lib/groupApi";

function timeOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function SenderAvatar({ sender }) {
  if (sender?.profileImage) {
    return (
      <img
        src={sender.profileImage}
        alt=""
        className="h-8 w-8 rounded-full object-cover shrink-0"
      />
    );
  }
  const initial = (sender?.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div
      className="h-8 w-8 rounded-full bg-primary-100 text-primary-700 shrink-0 flex items-center justify-center text-xs font-bold"
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

export default function MessageBubble({ message, isMine, showHeader, canDelete, onDelete, onRetryAttachment }) {
  if (message.messageType === "SYSTEM") {
    return (
      <div className="flex justify-center my-3">
        <span className="rounded-pill bg-canvas border border-line px-3 py-1 text-[11px] text-muted text-center max-w-md">
          {message.message}
        </span>
      </div>
    );
  }

  const failed = message._status === "failed";
  const sending = message._status === "sending";

  return (
    <div
      className={`group flex gap-2.5 ${isMine ? "flex-row-reverse" : "flex-row"} ${
        showHeader ? "mt-3" : "mt-0.5"
      }`}
    >
      <div className="w-8 shrink-0">
        {showHeader && !isMine && <SenderAvatar sender={message.sender} />}
      </div>

      <div className={`flex flex-col max-w-[min(70%,32rem)] ${isMine ? "items-end" : "items-start"}`}>
        {showHeader && (
          <div
            className={`flex items-baseline gap-2 mb-1 ${
              isMine ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span className="text-xs font-bold text-ink">
              {isMine ? "You" : message.sender?.name || "Unknown"}
            </span>
            <span className="text-[11px] text-faint">{timeOnly(message.createdAt)}</span>
          </div>
        )}

        <div className={`flex items-center gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
          {message.attachment || message._localFile ? (
            <MessageAttachment
              attachment={
                message.attachment
                  ? {
                      id: message.id,
                      fileName: message.attachment.name,
                      mimeType: message.attachment.mimeType,
                      size: message.attachment.size,
                    }
                  : null
              }
              isImage={message.attachment ? message.attachment.isImage : message.messageType === "IMAGE"}
              pending={sending || failed}
              localPreviewUrl={message._localPreviewUrl}
              progress={message._progress}
              failed={failed}
              onRetry={() => onRetryAttachment?.(message)}
              download={() => groupApi.downloadAttachment(message.groupId, message.id)}
            />
          ) : (
            <div
              className={`rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap ${
                message.isDeleted
                  ? "bg-canvas border border-line text-faint italic"
                  : isMine
                  ? "bg-primary text-white"
                  : "bg-canvas border border-line text-ink"
              } ${failed ? "opacity-60 ring-1 ring-coral" : ""} ${sending ? "opacity-70" : ""}`}
              title={new Date(message.createdAt).toLocaleString()}
            >
              {message.isDeleted ? "This message was deleted" : message.message}
            </div>
          )}

          {canDelete && !message.isDeleted && !sending && (
            <button
              onClick={() => onDelete(message)}
              aria-label="Delete message"
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded-lg text-faint hover:text-coral hover:bg-coral-bg transition-opacity"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {message.attachment && message.message && !message.isDeleted && (
          <div
            className={`mt-1 max-w-[min(70%,32rem)] rounded-2xl px-3.5 py-1.5 text-sm break-words whitespace-pre-wrap ${
              isMine ? "bg-primary text-white" : "bg-canvas border border-line text-ink"
            }`}
          >
            {message.message}
          </div>
        )}

        {isMine && sending && (
          <span className="flex items-center gap-1 text-[10px] text-faint mt-0.5">
            <Clock size={10} /> Sending…
          </span>
        )}
        {isMine && failed && (
          <span className="flex items-center gap-1 text-[10px] text-coral mt-0.5">
            <AlertCircle size={10} /> Not sent
          </span>
        )}

        {!showHeader && (
          <span className="text-[10px] text-faint mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {timeOnly(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}
