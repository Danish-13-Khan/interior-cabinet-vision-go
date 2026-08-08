import { useState } from "react";
import type {
  ProjectReviewState,
  ReviewNoteSeverity,
} from "../../domain/projectReview";

type NotesSectionProps = {
  notes: ProjectReviewState["notes"];
  onAddNote: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveNote: (noteId: string, resolved: boolean) => void;
};

export function NotesSection({ notes, onAddNote, onResolveNote }: NotesSectionProps) {
  const [noteMessage, setNoteMessage] = useState("");
  const [noteSeverity, setNoteSeverity] =
    useState<ReviewNoteSeverity>("warning");
  const openNotes = notes.filter((note) => !note.resolved);
  const resolvedNotes = notes.filter((note) => note.resolved);

  return (
    <section className="review-section">
      <h3>Issue flags / review notes</h3>
      <div className="review-form-row">
        <input
          type="text"
          value={noteMessage}
          placeholder="Add a review note or issue flag"
          onChange={(event) => setNoteMessage(event.currentTarget.value)}
        />
        <select
          value={noteSeverity}
          onChange={(event) =>
            setNoteSeverity(event.currentTarget.value as ReviewNoteSeverity)
          }
        >
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="error">Error</option>
          <option value="blocker">Blocker</option>
        </select>
        <button
          type="button"
          className="tb-btn"
          onClick={() => {
            if (!noteMessage.trim()) return;
            onAddNote(noteMessage.trim(), noteSeverity);
            setNoteMessage("");
          }}
        >
          Add Note
        </button>
      </div>
      <div className="review-note-list">
        {openNotes.length === 0 ? (
          <p className="helper-note">No open review notes.</p>
        ) : (
          openNotes.map((note) => (
            <div key={note.id} className={`review-note severity-${note.severity}`}>
              <div>
                <strong>{note.severity}</strong>
                <span>{note.message}</span>
                <small>
                  {note.source} · {new Date(note.createdAt).toLocaleString()}
                </small>
              </div>
              <button
                type="button"
                className="tb-btn"
                onClick={() => onResolveNote(note.id, true)}
              >
                Resolve
              </button>
            </div>
          ))
        )}
      </div>
      {resolvedNotes.length > 0 ? (
        <details className="review-resolved">
          <summary>{resolvedNotes.length} resolved notes</summary>
          {resolvedNotes.map((note) => (
            <div key={note.id} className="review-note is-resolved">
              <span>{note.message}</span>
              <button
                type="button"
                className="tb-btn"
                onClick={() => onResolveNote(note.id, false)}
              >
                Reopen
              </button>
            </div>
          ))}
        </details>
      ) : null}
    </section>
  );
}
