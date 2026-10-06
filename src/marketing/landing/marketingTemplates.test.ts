import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILTIN_CATALOG_MANIFEST } from '../../domain/catalog/builtinCatalogManifest';
import { APARTMENT_TEMPLATE_IDS } from '../../domain/apartmentTemplates';
import { apartmentStillPath } from '../../domain/apartmentTemplates/apartmentStills';
import { findMarketingTemplate, MARKETING_TEMPLATES, registerHrefForTemplate, TEMPLATE_QUERY_PARAM } from './marketingTemplates';

describe('marketing templates', () => {
  it('lists catalog templates plus the four apartment templates', () => {
    const catalogIds = BUILTIN_CATALOG_MANIFEST.templates.map((template) => template.id).sort();
    const marketedCatalog = MARKETING_TEMPLATES.filter((t) => t.kind !== 'apartment').map((t) => t.id).sort();
    expect(marketedCatalog).toEqual(catalogIds);
    const apartments = MARKETING_TEMPLATES.filter((t) => t.kind === 'apartment').map((t) => t.id).sort();
    expect(apartments).toEqual([...APARTMENT_TEMPLATE_IDS].sort());
  });
  it('points every card at a shipped thumbnail', () => {
    for (const template of MARKETING_TEMPLATES) {
      expect(existsSync(join(process.cwd(), 'public', template.image))).toBe(true);
    }
  });
  it('shows each apartment through its showcase-tour still', () => {
    for (const template of MARKETING_TEMPLATES.filter((t) => t.kind === 'apartment')) {
      expect(template.image).toBe(apartmentStillPath(template.id));
      expect(template.image).toMatch(/^catalog\/templates\/apartment-[a-z0-9]+-v1\.png$/);
    }
  });
  it('builds register links that round-trip the template id', () => {
    const href = registerHrefForTemplate('template:core:l-kitchen:v1');
    const params = new URLSearchParams(href.split('?')[1]);
    expect(href.startsWith('/register?')).toBe(true);
    expect(findMarketingTemplate(params.get(TEMPLATE_QUERY_PARAM))?.name).toBe('L Kitchen');
    const apt = registerHrefForTemplate('template:apartment:studio:v1');
    expect(findMarketingTemplate(new URLSearchParams(apt.split('?')[1]).get(TEMPLATE_QUERY_PARAM))?.name).toBe('Studio');
  });
  it('ignores unknown or missing ids', () => {
    expect(findMarketingTemplate('template:core:nope:v1')).toBeNull();
    expect(findMarketingTemplate(null)).toBeNull();
  });
});
