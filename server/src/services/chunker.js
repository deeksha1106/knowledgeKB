/**
 * Text Chunking Service
 * Splits documents into overlapping chunks for better context preservation
 */

const DEFAULT_CHUNK_SIZE = 1000;    // ~500 tokens approx
const DEFAULT_OVERLAP = 200;        // ~100 tokens overlap

/**
 * Split text into overlapping chunks
 * @param {string} text - Full document text
 * @param {number} chunkSize - Maximum characters per chunk
 * @param {number} overlap - Number of overlapping characters
 * @returns {Array<{content: string, startOffset: number, endOffset: number}>}
 */
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE, overlap = DEFAULT_OVERLAP) {
    const chunks = [];

    // Clean and normalize text
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (cleanedText.length <= chunkSize) {
        return [{
            content: cleanedText,
            startOffset: 0,
            endOffset: cleanedText.length
        }];
    }

    let startOffset = 0;

    while (startOffset < cleanedText.length) {
        let endOffset = Math.min(startOffset + chunkSize, cleanedText.length);

        // Try to break at paragraph or sentence boundary
        if (endOffset < cleanedText.length) {
            // Look for paragraph break
            const paragraphBreak = cleanedText.lastIndexOf('\n\n', endOffset);
            if (paragraphBreak > startOffset + chunkSize / 2) {
                endOffset = paragraphBreak;
            } else {
                // Look for sentence break
                const sentenceBreak = findSentenceBreak(cleanedText, startOffset + chunkSize / 2, endOffset);
                if (sentenceBreak > startOffset) {
                    endOffset = sentenceBreak;
                }
            }
        }

        const content = cleanedText.slice(startOffset, endOffset).trim();

        if (content.length > 0) {
            chunks.push({
                content,
                startOffset,
                endOffset
            });
        }

        // Move start for next chunk with overlap
        startOffset = endOffset - overlap;

        // Avoid infinite loop
        if (startOffset >= cleanedText.length - 1) break;
    }

    return chunks;
}

/**
 * Find a good sentence break point
 */
function findSentenceBreak(text, minOffset, maxOffset) {
    const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
    let bestBreak = -1;

    for (const ender of sentenceEnders) {
        const pos = text.lastIndexOf(ender, maxOffset);
        if (pos > minOffset && pos > bestBreak) {
            bestBreak = pos + ender.length - 1;
        }
    }

    return bestBreak;
}

/**
 * Estimate token count (rough approximation)
 */
export function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
