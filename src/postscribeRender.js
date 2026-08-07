import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');

    let finalMarkup;

    try {
        finalMarkup = normalizeMarkup(markup);
    } catch (error) {
        console.error("Error normalizing markup:", error.message);
        finalMarkup = markup;
    }

    ps(document.body, finalMarkup, {
        error: console.error,
        beforeWriteToken: decodeEntitiesInMaterializedTokens
    });
}

/**
 * postscribe builds <script> and <style> elements by hand instead of writing
 * them through the browser's HTML parser: see _buildScript/_buildStyle in
 * postscribe's src/write-stream.js, which copy raw tokenizer output via
 * el.setAttribute(name, value) and el.src = tok.src. Entities in their
 * attributes are therefore never decoded — e.g. `src="...a=1&amp;b=2"` would
 * be requested literally, breaking tracker URLs. Decode them here, as a
 * browser would.
 */
function decodeEntitiesInMaterializedTokens(tok) {
    const tagName = tok && tok.tagName && tok.tagName.toLowerCase();
    if ((tagName === 'script' || tagName === 'style') && tok.attrs) {
        Object.keys(tok.attrs).forEach((name) => {
            if (typeof tok.attrs[name] === 'string' && tok.attrs[name].indexOf('&') !== -1) {
                tok.attrs[name] = decodeHtmlAttribute(tok.attrs[name]);
            }
        });
        // postscribe copies attrs.src to tok.src before this hook runs
        if (typeof tok.src === 'string' && tok.src.indexOf('&') !== -1) {
            tok.src = decodeHtmlAttribute(tok.src);
        }
    }
    return tok;
}

/**
 * Decodes HTML entities by round-tripping the value through a real parsed
 * attribute. This matches browser rules for attributes exactly: `&amp;`
 * becomes `&`, but semicolon-less references like `&notify=` stay literal.
 */
function decodeHtmlAttribute(value) {
    const doc = new DOMParser().parseFromString(
        `<i data-v="${value.replace(/"/g, '&quot;')}">`, 'text/html'
    );
    return doc.body.firstChild.getAttribute('data-v');
}

/**
 * Re-serializes the markup through the browser so postscribe receives
 * canonical HTML (double-quoted attributes, escaped entities, balanced tags).
 * postscribe mangles anything else, e.g. double quotes inside single-quoted
 * attribute values (https://github.com/prebid/prebid-universal-creative/pull/358).
 *
 * The unique marker element switches the parser into <body> mode up front, so
 * the whole adm — including leading comments and scripts that would otherwise
 * be scattered into <head> or the document root — is parsed as body content,
 * matching how postscribe writes it into document.body. The marker is then
 * removed and the body serialized.
 */
function normalizeMarkup(markup) {
    const markerId = `PUC_MARKER_${Date.now()}`;
    const doc = new DOMParser().parseFromString(`<div id="${markerId}"></div>${markup}`, 'text/html');
    doc.getElementById(markerId).remove();
    return doc.body.innerHTML.trim();
}
