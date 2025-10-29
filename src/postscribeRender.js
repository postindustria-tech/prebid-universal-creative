import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    dispatchGoogleAppEvent("puc_render_begin");
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');
    ps(document.body, markup, {
        error: console.error,
        done: (stream) => {
            dispatchGoogleAppEvent("puc_render_end");
        }
    });
}

/**
 * Dispatch app event to Google Mobile Ads SDK.
 * https://developers.google.com/ad-manager/mobile-ads-sdk/ios/banner#app_events
 */
function dispatchGoogleAppEvent(value) {
    try {
        admob.events.dispatchAppEvent("prebid", value);
    } catch (e) {
    }
}

