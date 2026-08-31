import { snippetsEqual, type Snippet } from "./format";

export type StackMode = "append" | "replace";

export interface AddOptions {
  mode: StackMode;
  sessionTimeoutMs: number;
}

export class ContextStack {
  private items: Snippet[] = [];
  private lastTouchedAt = 0;

  constructor(private readonly now: () => number = Date.now) {}

  get length(): number {
    return this.items.length;
  }

  snapshot(): Snippet[] {
    return this.items.slice();
  }

  clear(): void {
    this.items = [];
    this.lastTouchedAt = 0;
  }

  undo(): Snippet | undefined {
    const removed = this.items.pop();
    this.lastTouchedAt = this.items.length === 0 ? 0 : this.now();
    return removed;
  }

  add(snippets: Snippet[], opts: AddOptions): Snippet[] {
    if (snippets.length === 0) {
      return this.snapshot();
    }

    const now = this.now();
    const expired =
      opts.mode === "append" &&
      opts.sessionTimeoutMs > 0 &&
      this.lastTouchedAt > 0 &&
      now - this.lastTouchedAt > opts.sessionTimeoutMs;

    if (opts.mode === "replace" || expired) {
      this.items = [];
    }

    for (const snippet of snippets) {
      const last = this.items[this.items.length - 1];
      if (last && snippetsEqual(last, snippet)) {
        continue;
      }
      this.items.push(snippet);
    }

    this.lastTouchedAt = now;
    return this.snapshot();
  }
}
