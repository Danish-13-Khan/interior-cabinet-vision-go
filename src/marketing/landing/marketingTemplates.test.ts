import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BUILTIN_CATALOG_MANIFEST } from '../../domain/catalog/builtinCatalogManifest';
import { APARTMENT_TEMPLATE_IDS } from '../../domain/apartmentTemplates';
import { CARD_MEDIA, cardMediaForTemplate, TEMPLATE_CARD_IDS, type TemplateCardId } from '../../domain/templateCardMedia';
import { findMarketingTemplate, MARKETING_TEMPLATES, registerHrefForTemplate, TEMPLATE_QUERY_PARAM } from './marketingTemplates';

describe('marketing templates', () => {
  it('lists catalog templates plus the four apartment templates', () => {
    const catalogIds = BUILTIN_CATALOG_MANIFEST.templates.map((template) => template.id).sort();
    const marketedCatalog = MARKETING_TEMPLATES.filter((t) => t.kind !== 'apartment').map((t) => t.id).sort();
    expect(marketedCatalog).toEqual(catalogIds);
    const apartments = MARKETING_TEMPLATES.filter((t) => t.kind === 'apartment').map((t) => t.id).sort();
    expect(apartments).toEqual([...APARTMENT_TEMPLATE_IDS].sort());
  });

  it('requires all ten template cards in CARD_MEDIA with files on disk', () => {
    expect(TEMPLATE_CARD_IDS).toHaveLength(10);
    for (const id of TEMPLATE_CARD_IDS) {
      expect(CARD_MEDIA[id as TemplateCardId], id).toBeDefined();
    }
    for (const template of MARKETING_TEMPLATES) {
      const id = template.id as TemplateCardId;
      const media = cardMediaForTemplate(id);
      expect(template.image).toBe(media.poster.w800);
      expect(existsSync(join(process.cwd(), 'public', media.poster.w800))).toBe(true);
      expect(existsSync(join(process.cwd(), 'public', media.poster.w1600))).toBe(true);
      if (media.plan) {
        expect(template.planImage).toBe(media.plan.w800);
        expect(existsSync(join(process.cwd(), 'public', media.plan.w800))).toBe(true);
        expect(existsSync(join(process.cwd(), 'public', media.plan.w1600))).toBe(true);
      }
    }
  });

  it('uses v2 card media paths for apartments', () => {
    for (const template of MARKETING_TEMPLATES.filter((t) => t.kind === 'apartment')) {
      expect(template.image).toMatch(/^catalog\/templates\/apartment-[a-z0-9]+-v2\.webp$/);
      expect(template.planImage).toMatch(/^catalog\/templates\/apartment-[a-z0-9]+-plan-v2\.webp$/);
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
