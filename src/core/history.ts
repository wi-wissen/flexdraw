// Snapshot-based undo/redo over immutable scenes. Default depth 100 (requirement: >= 50).
import type { Scene } from './types'

export class History {
  private past: Scene[] = []
  private future: Scene[] = []
  constructor(
    private present: Scene,
    private limit = 100,
  ) {}

  get current(): Scene {
    return this.present
  }
  get canUndo(): boolean {
    return this.past.length > 0
  }
  get canRedo(): boolean {
    return this.future.length > 0
  }

  /** Records a new scene. Pushing the identical scene object is a no-op. */
  push(next: Scene): Scene {
    if (next === this.present) return this.present
    this.past.push(this.present)
    if (this.past.length > this.limit) this.past.shift()
    this.future = []
    this.present = next
    return next
  }

  undo(): Scene {
    const prev = this.past.pop()
    if (prev) {
      this.future.push(this.present)
      this.present = prev
    }
    return this.present
  }

  redo(): Scene {
    const next = this.future.pop()
    if (next) {
      this.past.push(this.present)
      this.present = next
    }
    return this.present
  }

  /** Replaces everything, e.g. for "New" or loading a file as a fresh start. */
  reset(scene: Scene): void {
    this.past = []
    this.future = []
    this.present = scene
  }
}
