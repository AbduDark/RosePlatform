import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SEOHead = ({ 
  title, 
  description, 
  keywords, 
  image,
  type = 'website',
  canonical 
}) => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const baseUrl = window.location.origin;
  const currentUrl = `${baseUrl}${location.pathname}`;

  useEffect(() => {
    if (title) {
      document.title = `${title} | Rose Academy`;
    }

    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image || `${baseUrl}/Rose_Logo.svg` },
      { property: 'og:url', content: currentUrl },
      { property: 'og:type', content: type },
      { property: 'og:locale', content: i18n.language === 'ar' ? 'ar_EG' : 'en_US' },
      { property: 'twitter:card', content: 'summary_large_image' },
      { property: 'twitter:title', content: title },
      { property: 'twitter:description', content: description },
      { property: 'twitter:image', content: image || `${baseUrl}/Rose_Logo.svg` },
      { property: 'twitter:url', content: currentUrl },
    ];

    metaTags.forEach(({ name, property, content }) => {
      if (content) {
        const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
        let element = document.querySelector(selector);
        
        if (!element) {
          element = document.createElement('meta');
          if (name) element.setAttribute('name', name);
          if (property) element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        
        element.setAttribute('content', content);
      }
    });

    // Update canonical link
    const canonicalUrl = canonical || currentUrl;
    let linkElement = document.querySelector('link[rel="canonical"]');
    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.setAttribute('rel', 'canonical');
      document.head.appendChild(linkElement);
    }
    linkElement.setAttribute('href', canonicalUrl);

    // Update HTML lang and dir attributes
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  }, [title, description, keywords, image, type, canonical, currentUrl, baseUrl, i18n.language]);

  return null;
};

export default SEOHead;
