import * as fs from 'fs';
import * as path from 'path';
import { EmojiMap } from '../types'

class IconFetcher {
    private emojiMap: EmojiMap = {
        note: "💡",
        todo: "✅",
        fix: "🔧"
    };

    constructor() { }

    getEmoji(noteCategory: string): string {
        return this.emojiMap[noteCategory] || "💡";
    }
}

const iconFetcherInstance: IconFetcher = new IconFetcher();
export default iconFetcherInstance;
