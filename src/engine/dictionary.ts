/**
 * Dictionary: an uppercase Set for O(1) word validation plus a Trie (used by the
 * move generator for left/right extension). Framework-agnostic; the word list is
 * injected so this module has no I/O dependency (the UI fetches the asset and
 * calls `buildDictionary`).
 */

export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  terminal = false;
}

export class Dictionary {
  private words: Set<string>;
  readonly root: TrieNode;

  constructor(words: Iterable<string>) {
    this.words = new Set();
    this.root = new TrieNode();
    for (const raw of words) {
      const w = raw.trim().toUpperCase();
      if (!w) continue;
      this.words.add(w);
      this.insert(w);
    }
  }

  private insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (!next) {
        next = new TrieNode();
        node.children.set(ch, next);
      }
      node = next;
    }
    node.terminal = true;
  }

  /** O(1) validity check. */
  has(word: string): boolean {
    return this.words.has(word.toUpperCase());
  }

  get size(): number {
    return this.words.size;
  }

  /** Node reached by following `prefix`, or null if no such path exists. */
  nodeFor(prefix: string): TrieNode | null {
    let node = this.root;
    for (const ch of prefix.toUpperCase()) {
      const next = node.children.get(ch);
      if (!next) return null;
      node = next;
    }
    return node;
  }

  /** Whether any word starts with `prefix`. */
  hasPrefix(prefix: string): boolean {
    return this.nodeFor(prefix) !== null;
  }
}

export function buildDictionary(words: Iterable<string>): Dictionary {
  return new Dictionary(words);
}

/** Parse a raw word-list text file (one word per line) into a Dictionary. */
export function dictionaryFromText(text: string): Dictionary {
  return new Dictionary(text.split(/\r?\n/));
}
