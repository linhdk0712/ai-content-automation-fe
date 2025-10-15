import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  noIndex?: boolean
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'AI Content Automation',
  description = 'AI-powered content automation platform for creating, managing, and publishing content across multiple channels.',
  keywords = 'AI, content automation, content creation, social media, publishing',
  image = '/og-image.png',
  url,
  type = 'website',
  noIndex = false,
}) => {
  const fullTitle = title === 'AI Content Automation' ? title : `${title} | AI Content Automation`
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="AI Content Automation" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL for SPA */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'AI Content Automation',
          description: description,
          url: currentUrl,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web Browser',
          offers: {
            '@type': 'Offer',
            category: 'SaaS'
          }
        })}
      </script>
    </Helmet>
  )
}

export default SEOHead