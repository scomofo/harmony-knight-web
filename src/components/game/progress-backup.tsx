import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MAX_BACKUP_BYTES,
  makeProgressBackup,
  readProgressBackup,
  restoreProgressBackup,
  backupSummary,
  type ProgressBackup,
} from "@/lib/game/progress-backup";
import { setMasterGain, stopTones } from "@/lib/game/audio";

export function downloadBackup(text: string, name = "harmony-knight-progress") {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function ProgressBackupPanel() {
  const [pending, setPending] = useState<ProgressBackup | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const request = useRef(0);
  const summary = pending ? backupSummary(pending) : null;
  return (
    <section className="space-y-4 rounded border border-[var(--color-border)] p-4">
      <h2 className="text-xl">Back up your progress</h2>
      <p className="text-sm text-[var(--color-muted)]">
        Keep a copy of your lessons, practice history, settings, drafts and saved music. Importing
        replaces the progress in this browser.
      </p>
      <Button
        variant="outline"
        onClick={() => {
          try {
            downloadBackup(makeProgressBackup());
            setMessage("Backup download started.");
          } catch (e) {
            setMessage(e instanceof Error ? e.message : "Could not create a backup.");
          }
        }}
      >
        Export progress
      </Button>
      <label className="block text-sm">
        Choose a backup to import
        <input
          aria-label="Import progress file"
          type="file"
          accept=".json,application/json"
          className="mt-2 block max-w-full"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            const token = ++request.current;
            setPending(null);
            setMessage("");
            if (!file) return;
            setBusy(true);
            try {
              if (file.size > MAX_BACKUP_BYTES)
                throw new Error("Choose a Harmony Knight backup smaller than 2 MB.");
              const backup = readProgressBackup(await file.text());
              if (request.current === token) setPending(backup);
            } catch (e) {
              if (request.current === token)
                setMessage(e instanceof Error ? e.message : "Could not read the backup.");
            } finally {
              if (request.current === token) setBusy(false);
            }
          }}
        />
      </label>
      {busy ? <p role="status">Checking the backup…</p> : null}
      {pending && summary ? (
        <div className="space-y-3 rounded border border-[var(--color-harmony)] p-4">
          <p>
            Backup from {new Date(pending.exportedAt).toLocaleString()}: {summary.lessons} completed
            lessons, {summary.pieces} saved pieces and {summary.points} harmony points.
          </p>
          <p className="text-sm">
            Confirm to replace current progress. A backup of the current progress will download
            first.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                try {
                  downloadBackup(makeProgressBackup(), "harmony-knight-before-import");
                  restoreProgressBackup(pending);
                  stopTones();
                  setMasterGain(
                    pending.data.settings.muted ? 0 : pending.data.settings.masterVolume,
                  );
                  setPending(null);
                  setMessage("Progress restored. Continue from the learning path.");
                } catch (e) {
                  setMessage(
                    e instanceof Error
                      ? e.message
                      : "Could not restore progress. Current progress is unchanged.",
                  );
                }
              }}
            >
              Replace current progress
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                ++request.current;
                setPending(null);
                setMessage("Import cancelled. Current progress is unchanged.");
              }}
            >
              Cancel import
            </Button>
          </div>
        </div>
      ) : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </section>
  );
}
