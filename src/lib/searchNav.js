const DOC_MIME_TYPE = "application/vnd.workspace.document";
const SHEET_MIME_TYPE = "application/vnd.workspace.spreadsheet";
const PRESENTATION_MIME_TYPE = "application/vnd.workspace.presentation";

export function getSearchResultPath(item) {
  switch (item.module) {
    case "chat":
      return `/workspace/chat?conversation=${item.meta?.conversationId || item.id}`;

    case "mail":
      return `/workspace/mail?open=${item.id}`;

    case "calendar":
      return `/workspace/calendar?event=${item.id}`;

    case "meetings":
      return item.meta?.status === "ACTIVE"
        ? `/workspace/meet/${item.meta.roomId || item.id}`
        : `/workspace/chat?conversation=${item.meta?.conversationId}`;

    case "drive": {
      const { mimeType, parentId } = item.meta || {};
      if (item.type === "folder") return `/workspace/drive?parentId=${item.id}`;
      if (mimeType === DOC_MIME_TYPE) return `/workspace/docs/${item.id}`;
      if (mimeType === SHEET_MIME_TYPE) return `/workspace/sheets/${item.id}`;
      if (mimeType === PRESENTATION_MIME_TYPE) return `/workspace/slides/${item.id}`;
      return `/workspace/drive?${parentId ? `parentId=${parentId}&` : ""}open=${item.id}`;
    }

    default:
      return null;
  }
}

export default getSearchResultPath;