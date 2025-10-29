import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    const renderStartTime = Date.now();
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');
    ps(document.body, markup, {
        error: console.error,
        done: (stream) => {
            dispatchGoogleAppEvent(renderStartTime);
        }
    });
}

/**
 * Dispatch app event to Google Mobile Ads SDK.
 * https://developers.google.com/ad-manager/mobile-ads-sdk/ios/banner#app_events
 */
function dispatchGoogleAppEvent(startTime) {
    try {
        const renderTime = Date.now() - startTime;
        admob.events.dispatchAppEvent("prebid_render_time", renderTime);
    } catch (e) {
    }
}

