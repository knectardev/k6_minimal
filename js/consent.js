// Cookie consent (Silktide) + Google Consent Mode v2 + GTM
// Must load in <head> before any other Google tags.

(function () {
  function getStoredConsent(category) {
    return localStorage.getItem('silktideCookieChoice_' + category) === 'true';
  }

  function updateGoogleConsent(analyticsGranted, adsGranted) {
    if (typeof gtag !== 'function') return;
    gtag('consent', 'update', {
      analytics_storage: analyticsGranted ? 'granted' : 'denied',
      ad_storage: adsGranted ? 'granted' : 'denied',
      ad_user_data: adsGranted ? 'granted' : 'denied',
      ad_personalization: adsGranted ? 'granted' : 'denied',
    });
    gtag('set', 'ads_data_redaction', !adsGranted);
  }

  // --- Silktide Cookie Consent Banner (free: https://silktide.com/consent-manager/) ---
  (function () {
    const head = document.head;

    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.id = 'silktide-consent-manager-css';
    cssLink.href = '/cookies-banner/silktide-consent-manager.css';
    head.appendChild(cssLink);

    const bannerScript = document.createElement('script');
    bannerScript.src = '/cookies-banner/silktide-consent-manager.js';
    head.appendChild(bannerScript);

    bannerScript.onload = function () {
      const configScript = document.createElement('script');
      configScript.innerHTML = `
        silktideCookieBannerManager.updateCookieBannerConfig({
          background: { showBackground: true },
          cookieIcon: { position: "bottomRight" },
          cookieTypes: [
            {
              id: "necessary",
              name: "Necessary",
              description: "<p>These cookies are necessary for the website to function properly and cannot be switched off. They help with things like logging in and setting your privacy preferences.</p>",
              required: true
            },
            {
              id: "analytical",
              name: "Analytical",
              description: "<p>These cookies help us improve the site by tracking which pages are most popular and how visitors move around the site.</p>",
              required: false,
              onAccept: function() {
                window.updateGoogleConsent(true, localStorage.getItem('silktideCookieChoice_advertising') === 'true');
                if (typeof dataLayer !== 'undefined') {
                  dataLayer.push({ event: 'consent_accepted_analytics' });
                }
              },
              onReject: function() {
                window.updateGoogleConsent(false, localStorage.getItem('silktideCookieChoice_advertising') === 'true');
              }
            },
            {
              id: "advertising",
              name: "Advertising",
              description: "<p>These cookies are used to deliver advertising that is more relevant to you and your interests.</p>",
              required: false,
              onAccept: function() {
                window.updateGoogleConsent(localStorage.getItem('silktideCookieChoice_analytical') === 'true', true);
                if (typeof dataLayer !== 'undefined') {
                  dataLayer.push({ event: 'consent_accepted_advertising' });
                }
              },
              onReject: function() {
                window.updateGoogleConsent(localStorage.getItem('silktideCookieChoice_analytical') === 'true', false);
              }
            }
          ],
          text: {
            banner: {
              description: "<p>We use cookies on our site to enhance your user experience, provide personalized content, and analyze our traffic. <a href=\\"/privacy-policy.html\\" target=\\"_blank\\">Cookie Policy</a>.</p>",
              acceptAllButtonText: "Accept all",
              acceptAllButtonAccessibleLabel: "Accept all cookies",
              rejectNonEssentialButtonText: "Reject non-essential",
              rejectNonEssentialButtonAccessibleLabel: "Reject non-essential",
              preferencesButtonText: "Preferences",
              preferencesButtonAccessibleLabel: "Toggle preferences"
            },
            preferences: {
              title: "Customize your cookie preferences",
              description: "<p>We respect your right to privacy. You can choose not to allow some types of cookies. Your cookie preferences will apply across our website.</p>",
              creditLinkText: "Get this banner for free",
              creditLinkAccessibleLabel: "Get this banner for free"
            }
          }
        });
      `;
      head.appendChild(configScript);
    };
  })();

  // --- Google Consent Mode v2 (must run before GTM) ---
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    dataLayer.push(arguments);
  }
  window.gtag = gtag;

  const analyticsGranted = getStoredConsent('analytical');
  const adsGranted = getStoredConsent('advertising');

  gtag('consent', 'default', {
    analytics_storage: analyticsGranted ? 'granted' : 'denied',
    ad_storage: adsGranted ? 'granted' : 'denied',
    ad_user_data: adsGranted ? 'granted' : 'denied',
    ad_personalization: adsGranted ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500,
    ads_data_redaction: !adsGranted,
    url_passthrough: true,
  });

  // --- Google Tag Manager ---
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-MQ8X9HLL');

  // Expose helper for inline config callbacks injected above
  window.updateGoogleConsent = updateGoogleConsent;
})();
