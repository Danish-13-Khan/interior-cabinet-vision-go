import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILTIN_CATALOG_MANIFEST } from '../../domain/catalog/builtinCatalogManifest';
import { findMarketingTemplate, MARKETING_TEMPLATES, registerHrefForTemplate, TEMPLATE_QUERY_PARAM } from './marketingTemplates';

describe('marketing templates', () => {
  it('lists exactly the catalog templates', () => {
    const catalogIds = BUILTIN_CATALOG_MANIFEST.templates.map((template) => template.id).sort();
    expect(MARKETING_TEMPLATES.map((template) => template.id).sort()).toEqual(catalogIds);
  });
  it('points every card at a shipped thumbnail', () => {
    for (const template of MARKETING_TEMPLATES) {
      expect(existsSync(join(process.cwd(), 'public', template.image))).toBe(true);
    }
  });
  it('builds register links that round-trip the template id', () => {
    const href = registerHrefForTemplate('template:core:l-kitchen:v1');
    const params = new URLSearchParams(href.split('?')[1]);
    expect(href.startsWith('/register?')).toBe(true);
    expect(findMarketingTemplate(params.get(TEMPLATE_QUERY_PARAM))?.name).toBe('L Kitchen');
  });
  it('ignores unknown or missing ids', () => {
    expect(findMarketingTemplate('template:core:nope:v1')).toBeNull();
    expect(findMarketingTemplate(null)).toBeNull();
  });
});
