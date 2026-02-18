/**
 * JSON-LD structured data helpers for SEO.
 *
 * Generates Schema.org markup so search engines understand the site
 * structure and individual experiments.
 */

import { experiments, type Experiment } from './experiments'

const SITE_URL = 'https://experiments.neillkillgore.com'

/** Schema.org CollectionPage for the homepage. */
export function homepageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Experiments - Neill Killgore',
    description:
      'Daily shipped prototypes - interactive tools, creative canvases, and AI utilities built by an autonomous pipeline.',
    url: SITE_URL,
    author: {
      '@type': 'Person',
      name: 'Neill Killgore',
      url: 'https://github.com/neill-k',
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: experiments.length,
      itemListElement: experiments.map((exp, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/e/${exp.slug}`,
        name: exp.title,
      })),
    },
  }
}

/** Schema.org CreativeWork for an individual experiment page. */
export function experimentJsonLd(exp: Experiment) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: exp.title,
    description: exp.description,
    url: `${SITE_URL}/e/${exp.slug}`,
    datePublished: exp.date,
    author: {
      '@type': 'Person',
      name: 'Neill Killgore',
      url: 'https://github.com/neill-k',
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'Experiments',
      url: SITE_URL,
    },
    keywords: exp.tags.join(', '),
  }

  if (exp.lastUpdated && exp.lastUpdated !== exp.date) {
    data.dateModified = exp.lastUpdated
  }

  return data
}
