/**
 * Same cleanup the browser applies before showing a project summary.
 * Kept here so baked HTML matches that display. Authored HTML is preserved.
 */

function cleanLegacyContent(content) {
    if (!content) return '';

    if (content.includes('<') && content.includes('>')) {
        let cleanHtml = content
            .replace(/<div[^>]*class="ql-[^"]*"[^>]*>/gi, '')
            .replace(/<span[^>]*class="ql-[^"]*"[^>]*>/gi, '')
            .trim();

        if (!cleanHtml.includes('<p>') && !cleanHtml.includes('<h') && !cleanHtml.includes('<ul>') && !cleanHtml.includes('<ol>')) {
            const sections = cleanHtml.split(/\n\s*\n/);
            cleanHtml = sections.map(section => {
                const trimmed = section.trim();
                if (trimmed) return '<p>' + trimmed + '</p>';
                return '';
            }).join('');
        }

        cleanHtml = cleanHtml.replace(
            /<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi,
            function (match, codeAttrs, codeContent) {
                const preservedContent = codeContent.replace(/\n/g, '<br>');
                return '<pre><code' + codeAttrs + '>' + preservedContent + '</code></pre>';
            }
        );

        cleanHtml = cleanHtml.replace(
            /<code([^>]*class="[^"]*language-[^"]*"[^>]*)>([\s\S]*?)<\/code>/gi,
            function (match, codeAttrs, codeContent) {
                if (codeAttrs.includes('language-')) {
                    const preservedContent = codeContent.replace(/\n/g, '<br>');
                    return '<pre><code' + codeAttrs + '>' + preservedContent + '</code></pre>';
                }
                return match;
            }
        );

        return cleanHtml;
    }

    let cleanText = content
        .replace(/<div[^>]*class="ql-[^"]*"[^>]*>/gi, '')
        .replace(/<span[^>]*class="ql-[^"]*"[^>]*>/gi, '')
        .trim();

    if (cleanText) {
        const sections = cleanText.split(/\n\s*\n/);
        cleanText = sections.map(section => {
            const trimmed = section.trim();
            if (!trimmed) return '';
            if (/^(Background|Objectives|Key Features|Technical Approach|Outcomes|Challenges|Solution|Results|Summary)/i.test(trimmed)) {
                return '<h3>' + trimmed + '</h3>';
            }
            if (/^\d+\.\s/.test(trimmed) || /^[•\-\*]\s/.test(trimmed)) {
                return '<ul><li>' + trimmed.replace(/^[\d•\-\*\.\s]+/, '') + '</li></ul>';
            }
            return '<p>' + trimmed + '</p>';
        }).join('');
    }

    return cleanText;
}

module.exports = { cleanLegacyContent };
