import { renderAmpOrMobileAd } from 'src/mobileAndAmpRender';
import * as postscribeRender from 'src/postscribeRender'
import * as utils from 'src/utils';
import { expect } from 'chai';
import { writeAdHtml } from 'src/postscribeRender';


describe("renderingManager", function () {
  describe("mobile creative", function () {
    let sandbox;
    let writeHtmlSpy;
    let sendRequestStub;
    let requestCallbacks;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      requestCallbacks = [];
      writeHtmlSpy = sandbox.spy(postscribeRender, "writeAdHtml");
      sendRequestStub = sandbox.stub(utils, "sendRequest").callsFake((url, callback) => {
        requestCallbacks.push(callback);
      });
      sandbox.spy(utils, "triggerPixel");
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("should render mobile app creative", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
        wurl: "https://test.prebidcache.wurl",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative with missing cache wurl", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative using default cacheHost and cachePath", function () {
      let ucTagData = {
        uuid: "123",
        size: "300x250",
      };
      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://prebid.adnxs.com/pbc/v1/cache?uuid=123"
      );
    });

  //   it('should catch errors from creative', function (done) {
  //     window.addEventListener('error', e => {
  //       done(e.error);
  //     });

  //     const consoleErrorSpy = sinon.spy(console, 'error');

  //     let ucTagData = {
  //       cacheHost: 'example.com',
  //       cachePath: '/path',
  //       uuid: '123',
  //       size: '300x250'
  //     };

  //     renderAmpOrMobileAd(ucTagData, true);

  //     let response = {
  //       width: 300,
  //       height: 250,
  //       crid: 123,
  //       adm: '<script src="notExistingScript.js"></script>'
  //     };
  //     requestCallbacks[0](JSON.stringify(response));

  //     setTimeout(() => {
  //       expect(consoleErrorSpy.callCount).to.equal(1);
  //       done();
  //     }, 10);
  //   });
  });

  describe("amp creative", function () {
    let sandbox;
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let ucTagData;
    let response;
    let requestCallbacks;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      requestCallbacks = [];
      writeHtmlSpy = sandbox.spy(postscribeRender, "writeAdHtml");
      sendRequestSpy = sandbox.stub(utils, "sendRequest").callsFake((url, callback) => {
        requestCallbacks.push(callback);
      });
      triggerPixelSpy = sandbox.spy(utils, "triggerPixel");
      ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };
      response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup${AUCTION_PRICE}",
        wurl: "https://test.prebidcache.wurl",
      };
    });



    afterEach(function () {
      sandbox.restore();
    });

    it('should send embed-resize message', () => {
      sandbox.spy(window.parent, 'postMessage');
      ucTagData.size = '400x500'
      renderAmpOrMobileAd(ucTagData);
      requestCallbacks[0](JSON.stringify(response));
      sinon.assert.calledWith(window.parent.postMessage, {
        sentinel: "amp",
        type: "embed-size",
        width: 400,
        height: 500,
      });
    });

    it("should render amp creative", function () {
      ucTagData.hbPb = "10.00";
      renderAmpOrMobileAd(ucTagData);


      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup10.00"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with response.price over hbPb", function () {
      renderAmpOrMobileAd(ucTagData);
      response.price = 12.5;
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup12.5"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with with empty value when neither price nor hbPb exist", function () {
      renderAmpOrMobileAd(ucTagData);
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });
  });
});

describe('writeAdHtml', () => {

  afterEach(() => {
    window.testScriptExecuted = undefined;
  });

  it('removes DOCTYPE from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<!DOCTYPE html><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('removes lowercase doctype from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<!doctype html><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('should execute script tag inserted into the body', () => {
    const markup = '<script>window.testScriptExecuted=true;</script>'
    writeAdHtml(markup);
    expect(window.testScriptExecuted).to.equal(true);
  });

  it('should handle single quotes with inner double quotes', () => {
    const input = `<img title='uh "oh" > this should all be inside the title attribute'>`;
    console.log('Input: ', input);

    writeAdHtml(input);

    const img = document.querySelector('img:last-of-type');
    if (img) {
      console.log('Output:', img.outerHTML);
      console.log('Title: ', img.getAttribute('title'));

      const expected = 'uh "oh" > this should all be inside the title attribute';
      expect(img.getAttribute('title')).to.equal(expected);
    }
  });

  it('should handle JSON in data attributes with single quotes', () => {
    const input = `<div data-json='{"key": "value"}'>Test</div>`;
    console.log('Input: ', input);

    writeAdHtml(input);

    const div = document.querySelector('div[data-json]:last-of-type');
    if (div) {
      console.log('Output:', div.outerHTML);
      console.log('Data:  ', div.getAttribute('data-json'));

      const dataJson = div.getAttribute('data-json');
      expect(dataJson).to.equal('{"key": "value"}');

      const parsed = JSON.parse(dataJson);
      expect(parsed.key).to.equal('value');
    }
  });

  // postscribe queues streams and blocks on pending external scripts, so
  // output from a previous writeAdHtml call may be written asynchronously
  function waitFor(condition, description) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      (function poll() {
        const result = condition();
        if (result) {
          resolve(result);
        } else if (Date.now() - started > 5000) {
          reject(new Error(`Timed out waiting for ${description}`));
        } else {
          setTimeout(poll, 10);
        }
      })();
    });
  }

  function waitForScript(marker) {
    return waitFor(
      () => document.querySelector(`script[data-puc-test="${marker}"]`),
      `script[data-puc-test="${marker}"]`
    );
  }

  it('should not leave &amp; in a script src URL', () => {
    const input = '<script data-puc-test="raw-amp" src="/base/test/fake-tracker?anId=8095&pubId=215421&bi=abc123"></script>';

    writeAdHtml(input);

    return waitForScript('raw-amp').then((script) => {
      expect(script.getAttribute('src')).to.contain('anId=8095&pubId=215421&bi=abc123');
      expect(script.getAttribute('src')).to.not.contain('&amp;');
    });
  });

  it('should decode &amp; already present in the adm script src', () => {
    const input = '<script data-puc-test="encoded-amp" src="/base/test/fake-tracker?a=1&amp;b=2"></script>';

    writeAdHtml(input);

    return waitForScript('encoded-amp').then((script) => {
      expect(script.getAttribute('src')).to.contain('a=1&b=2');
      expect(script.getAttribute('src')).to.not.contain('&amp;');
    });
  });

  it('should not decode legacy semicolon-less entities in script src', () => {
    const input = '<script data-puc-test="legacy-entities" src="/base/test/fake-tracker?x=1&notify=true&copy=2"></script>';

    writeAdHtml(input);

    return waitForScript('legacy-entities').then((script) => {
      const src = script.getAttribute('src');
      expect(src).to.contain('&notify=true');
      expect(src).to.contain('&copy=2');
      expect(src).to.not.contain('¬'); // ¬ from &not
      expect(src).to.not.contain('©'); // © from &copy
    });
  });

  it('should preserve the leading creative comment', () => {
    const ps = sinon.stub();
    const comment = '<!--Creative 123 served by Prebid.js Header Bidding-->';

    writeAdHtml(`${comment}<div>ad</div>`, ps);

    const written = ps.args[0][1];
    expect(written.indexOf(comment)).to.equal(0);
    expect(written).to.contain('<div>ad</div>');
  });

  it('should not corrupt inline script content containing && and <', () => {
    const input = '<script>window.testInlineResult = (1 < 2) && "a&b";</script>';

    writeAdHtml(input);

    return waitFor(() => window.testInlineResult, 'inline script execution').then((result) => {
      expect(result).to.equal('a&b');
      window.testInlineResult = undefined;
    });
  });

  it('should preserve text content with entities and ampersands', () => {
    const input = '<div data-puc-test="text-content">Tom & Jerry &amp; friends</div>';

    writeAdHtml(input);

    return waitFor(
      () => document.querySelector('div[data-puc-test="text-content"]'),
      'text content div'
    ).then((div) => {
      expect(div.textContent).to.equal('Tom & Jerry & friends');
    });
  });
})
