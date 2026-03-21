import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getGeminiApiKey } from '../_shared/get-gemini-key.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateAdRequest {
  prompt: string;
  stylePrompt?: string;
  styleName?: string;
  aspectRatio: string;
  productDescription?: string;
  productUrl?: string;
  brandColors?: string[];
  brandFonts?: string[];
  projectId?: string;
  clientId?: string;
  referenceImages?: string[];
  primaryReferenceImage?: string;
  characterImageUrl?: string;
  idempotency_key?: string;
  offerDescription?: string;
  includeDisclaimer?: boolean;
  disclaimerText?: string;
  strictBrandAdherence?: boolean;
  adImageUrls?: string[];
}

// Chunked base64 conversion to prevent stack overflow on large images
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // 32KB chunks
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Map aspect ratio to dimensions
function getImageDimensions(aspectRatio: string): { width: number; height: number } {
  switch (aspectRatio) {
    case '1:1':
      return { width: 1024, height: 1024 };
    case '4:5':
      return { width: 1024, height: 1280 };
    case '9:16':
      return { width: 768, height: 1365 };
    case '16:9':
      return { width: 1365, height: 768 };
    default:
      return { width: 1024, height: 1024 };
  }
}

function buildAdPrompt(params: GenerateAdRequest): string {
  const { prompt, stylePrompt, productDescription, productUrl, brandColors, brandFonts, aspectRatio, offerDescription, referenceImages, primaryReferenceImage, includeDisclaimer, disclaimerText, strictBrandAdherence } = params;
  
  const dimensions = getImageDimensions(aspectRatio);
  const hasReferenceImages = referenceImages && referenceImages.length > 0;
  const hasBrandColors = brandColors && brandColors.length > 0;

  // Color logic: brand colors are OPTIONAL — only used when explicitly provided
  // If no brand colors, derive colors from the reference image being cloned
  const colorInstruction = hasBrandColors
    ? strictBrandAdherence
      ? `STRICT BRAND ADHERENCE: You MUST use ONLY these exact brand colors throughout the entire design — no deviations, no similar shades, no artistic liberties: ${brandColors.join(', ')}`
      : `Use these brand colors as accent colors while keeping the overall look consistent with the reference layout: ${brandColors.join(', ')}.`
    : hasReferenceImages
      ? `CRITICAL: Extract and replicate the EXACT color palette from the PRIMARY reference image. Match the same hues, gradients, tones, and overlay opacities precisely. Do NOT introduce new colors.`
      : '';

  const fontInstruction = brandFonts && brandFonts.length > 0
    ? strictBrandAdherence
      ? `STRICT FONT ADHERENCE: You MUST use ONLY these brand fonts for all text — no substitutes: ${brandFonts.join(', ')}`
      : `Preferred brand fonts: ${brandFonts.join(', ')}`
    : '';
  
  const productContext = productDescription
    ? `Product/Service: ${productDescription}`
    : productUrl
    ? `Product from: ${productUrl}`
    : '';

  const offerContext = offerDescription
    ? `Offer/Value Proposition: ${offerDescription}`
    : '';

  const primaryRefNote = primaryReferenceImage
    ? `\n\nPRIMARY REFERENCE: The FIRST image provided is your PRIMARY template. You MUST replicate THIS specific image's layout, composition, colors (unless brand colors are specified), and visual style. Other reference images are supplementary context only — focus on cloning the PRIMARY reference.`
    : '';

  const referenceInstruction = hasReferenceImages
    ? `CRITICAL — PIXEL-PERFECT REPLICATION FROM REFERENCE:
You are given reference advertisement images. Your job is to CLONE the PRIMARY reference image as closely as possible — treat it as an EXACT TEMPLATE.${primaryRefNote}

MANDATORY REPLICATION RULES:
1. LAYOUT: Copy the exact same layout grid, element placement, margins, padding, and spatial arrangement. If the reference has text at the top with an image below, yours must too — in the same proportions.
2. COMPOSITION: Match the reference's composition pixel-for-pixel. Same visual hierarchy, same focal point placement, same balance of elements.
3. COLORS & GRADIENTS: ${hasBrandColors ? 'Use the specified brand colors while maintaining the reference layout and composition.' : 'Extract and replicate the EXACT color palette from the reference — same hues, same gradients, same overlay opacities. Match dark/light areas precisely.'}
4. TYPOGRAPHY STYLE: Replicate the same font weight, size ratios (headline vs body), text alignment, letter-spacing, and text effects (shadows, outlines, glows).
5. VISUAL EFFECTS: Copy all overlays, shadows, glows, borders, rounded corners, badge/sticker placements, and decorative elements from the reference.
6. BACKGROUND & IMAGERY: Recreate the same type of background (solid, gradient, photo, texture) and the same style of product/hero imagery arrangement.
7. ONLY CHANGE THE COPY: Replace ONLY the text content (headlines, body copy, CTA text) with the new product's messaging. Everything else — structure, colors, imagery style, effects — must remain virtually identical to the reference.

The output should look like a direct adaptation of the PRIMARY reference ad — someone viewing both side-by-side should see the SAME design template with different product content.`
    : '';

  const disclaimerInstruction = includeDisclaimer && disclaimerText
    ? `MANDATORY DISCLAIMER: You MUST include the following disclaimer text clearly legible at the bottom of the ad in a small but readable font size: "${disclaimerText}"`
    : '';

  // 9:16 safe zone instruction for IG Stories/Reels
  const safeZoneInstruction = aspectRatio === '9:16'
    ? `INSTAGRAM STORIES/REELS SAFE ZONE: This ad is for Instagram Stories/Reels. Do NOT place important content (text, CTAs, key visuals) in the top 14% or bottom 20% of the image — those areas are covered by UI elements (profile info, swipe-up, buttons). Keep all critical content within the central 66% vertical safe zone.`
    : '';

  if (prompt && !stylePrompt) {
    return `${prompt}

${productContext}
${offerContext}
${colorInstruction}
${fontInstruction}
${referenceInstruction}
${disclaimerInstruction}
${safeZoneInstruction}

Image dimensions: ${dimensions.width}x${dimensions.height}. Ultra high resolution, professional quality.

DO NOT include:
- Watermarks
- Logos or brand marks of any kind`.trim();
  }

  const aspectInstruction = `Image dimensions: ${dimensions.width}x${dimensions.height} (${aspectRatio} aspect ratio)`;

  const builtPrompt = `
Create a high-converting advertisement image.

${stylePrompt || ''}

${productContext}

${offerContext}

${colorInstruction}

${fontInstruction}

${referenceInstruction}

${disclaimerInstruction}

${safeZoneInstruction}

${aspectInstruction}

REQUIREMENTS:
- Professional advertisement quality
- Eye-catching visual design
- Clear focal point
- Balanced composition
- Modern, polished aesthetic
- Suitable for digital advertising platforms
- Ultra high resolution
- If reference images are provided, you MUST clone their exact layout, composition, colors, typography style, effects, and design — only swap the text/copy for the new product. The output must look like the same template was used.

DO NOT include:
- Watermarks
- Logos or brand marks of any kind
- Stock photo artifacts
- Low quality or blurry elements
`.trim();

  return builtPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: GenerateAdRequest = await req.json();
    const { 
      styleName, 
      aspectRatio, 
      projectId, 
      clientId,
      referenceImages = [],
      idempotency_key,
    } = body;

    // Get API key from agency settings, then env var fallback
    const geminiApiKey = await getGeminiApiKey(undefined);
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured. Add it in Agency Settings.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating ad with params:', { styleName, aspectRatio, projectId });

    // Build the prompt
    const prompt = buildAdPrompt(body);
    console.log('Generated prompt:', prompt.slice(0, 300) + '...');

    // Build parts array with prompt and optional reference images
    const parts: any[] = [{ text: prompt }];

    // Helper to add image to parts
    async function addImageToParts(imageUrl: string, label: string) {
      try {
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBuffer = await imageResponse.arrayBuffer();
          // Use chunked conversion to prevent stack overflow
          const base64Image = arrayBufferToBase64(imageBuffer);
          const contentType = imageResponse.headers.get('content-type') || 'image/png';
          
          parts.push({
            inlineData: {
              mimeType: contentType,
              data: base64Image
            }
          });
          console.log(`Added ${label}:`, imageUrl.slice(0, 60));
          return true;
        }
      } catch (err) {
        console.warn(`Failed to fetch ${label}:`, imageUrl, err);
      }
      return false;
    }

    // PRIORITY 1: Add PRIMARY reference image first — this is the one to clone
    const primaryRef = body.primaryReferenceImage;
    if (primaryRef) {
      await addImageToParts(primaryRef, 'PRIMARY reference (clone this)');
    }

    // PRIORITY 2: Add character/avatar image for identity consistency
    const characterImageUrl = body.characterImageUrl;
    if (characterImageUrl) {
      await addImageToParts(characterImageUrl, 'character reference');
    }

    // PRIORITY 3: Add remaining reference images as supplementary context (skip primary to avoid duplication)
    const maxAdditionalRefs = (primaryRef ? 3 : 4) - (characterImageUrl ? 1 : 0);
    for (const imageUrl of referenceImages.slice(0, maxAdditionalRefs + 1)) {
      if (imageUrl === primaryRef || imageUrl === characterImageUrl) continue;
      await addImageToParts(imageUrl, 'supplementary reference');
    }

    // PRIORITY 3: Add user-uploaded ad images
    const adImageUrls = body.adImageUrls || [];
    for (const imageUrl of adImageUrls.slice(0, 2)) {
      await addImageToParts(imageUrl, 'ad asset image');
    }

    // Call Gemini with retry
    const geminiResponse = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      },
      { service: 'gemini-image', requestType: 'generate-static-ad', estimatedCost: COST_ESTIMATES['gemini-image'] }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to generate image', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    // Extract image from response
    const candidates = geminiData.candidates || [];
    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No image generated', response: geminiData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageParts = candidates[0]?.content?.parts || [];
    const imagePart = imageParts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart?.inlineData?.data) {
      return new Response(
        JSON.stringify({ error: 'No image data in response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base64Image = imagePart.inlineData.data;
    const mimeType = imagePart.inlineData.mimeType || 'image/png';

    // Upload to Supabase Storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to bytes
    const imageBytes = Uint8Array.from(atob(base64Image), c => c.charCodeAt(0));

    // Generate file path
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().slice(0, 8);
    const extension = mimeType.split('/')[1] || 'png';
    const filePath = `generated-ads/${clientId}/${projectId}/${timestamp}-${uuid}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, imageBytes, {
        contentType: mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload image', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    // Save asset record to database
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        client_id: clientId,
        type: 'image',
        public_url: publicUrl,
        storage_path: filePath,
        status: 'completed',
        name: `${styleName} - ${aspectRatio}`,
        metadata: {
          styleName,
          aspectRatio,
          prompt: prompt.slice(0, 500),
          generatedAt: new Date().toISOString(),
          ...(idempotency_key ? { idempotency_key } : {}),
        },
      })
      .select()
      .single();

    if (assetError) {
      console.error('Asset insert error:', assetError);
    }

    console.log('Ad generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: publicUrl,
        storagePath: filePath,
        assetId: asset?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate ad error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
