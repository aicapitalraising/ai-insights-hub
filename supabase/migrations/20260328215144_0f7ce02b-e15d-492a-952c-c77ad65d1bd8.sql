
-- Update Bold Statement to become the consolidated "Capital Raising" style
UPDATE public.ad_styles
SET
  name = 'Capital Raising',
  description = 'Comprehensive capital raising ad style for accredited investors. Supports bold statement, lifestyle luxury, data-driven metrics, urgency/scarcity, and social proof approaches. Dark cinematic backgrounds with gold typography, investment return highlights, trust indicators, and professional institutional aesthetic.',
  prompt_template = 'Create a high-converting capital raising investment ad for accredited investors. Use a dark cinematic background (deep green, navy, or charcoal). Feature bold gold return percentages, IRR, or yield metrics as hero elements. Use uppercase serif typography (Playfair Display style). Include one or more of: aspirational lifestyle/real estate imagery with gradient overlays, structured data callouts (IRR, cash flow, AUM, preferred returns), urgency elements (limited spots, closing soon, red CTA buttons), or social proof (track record stats, testimonial quotes, trust badges, zero missed payments). Include accredited investor qualifier text. Maintain institutional trust aesthetic with gold accent colors for key numbers. Ensure compliance disclaimer space.',
  display_order = 0
WHERE id = '48469826-abc0-4d71-8812-a84e873f45a8';

-- Merge all reference images into the Capital Raising style
UPDATE public.ad_styles
SET reference_images = ARRAY[
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1770390937636.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772130763039.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772131425784-ap1r5tir4.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772131426961-ha9whnj8q.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772131428692-6gnqhfank.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772131429956-xeqqprmie.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209503320-pff7hgat7.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209506366-ictk47fam.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209509725-qyyr3fscv.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209515158-5juaimhqe.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209522203-cofytq7sh.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209614265-966btzrfc.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209615259-zvr85qh8c.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772209615913-sod0m97m4.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216476349-elamf7.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216478608-87ly4o.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216479847-d6cfg.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216481324-kkfl1a.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216482813-yfqvbm.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216484135-4rru8.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772216908657-ypc4hr.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217646711-ya0gft.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217648601-1lc36e.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217649931-9lrdjk.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217651134-hie8z.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217652429-m5fklk.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217653735-qbkr.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217654988-gay9c.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217656278-cv3rhu.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217657535-kfw5yw.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772217658863-7vh4p.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772218808953-9o8gd6.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772218811170-n7zgeq.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772218813094-y7bcyj.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1772218814636-e8f8vw.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773104517299-847dqj.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773104520007-eb3zo7.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773104521082-kv6dct.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773105255938-5ky25o.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773105258091-0tot9o.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773105259005-qjkky7.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773106841461-fle7p.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773106843831-oyaw2.png',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773107389691-fenzpb.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773107391133-e3ss.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773107391687-hwrpee.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773108527441-dv0xwd.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773108529513-6yjxuq.jpg',
  'https://futcgfhpiaoingxebfud.supabase.co/storage/v1/object/public/assets/style-references/capital-raising/1773108530597-1njf9l.png'
]
WHERE id = '48469826-abc0-4d71-8812-a84e873f45a8';

-- Delete the other 4 styles that are now consolidated
DELETE FROM public.ad_styles
WHERE id IN (
  '69c4ab03-f315-4923-9e0f-4105017c7095',
  '184aafcb-c595-444c-b9cb-b50d62cf22a7',
  '7e16174f-3eb9-4bde-bcf2-eaa634edc395',
  'bcf8778c-e9f3-40a0-947f-737666feda9d'
);
