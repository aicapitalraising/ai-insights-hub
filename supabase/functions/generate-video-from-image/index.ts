import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

/** Create a Supabase client pointing at the PRODUCTION database */
function getProductionSupabase() {
  const url = Deno.env.get('ORIGINAL_SUPABASE_URL') || Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('ORIGINAL_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl, prompt, aspectRatio, duration, projectId, clientId, styleName } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'imageUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Video generation request:', { prompt: prompt?.slice(0, 100), aspectRatio, duration });

    // Fetch the source image and convert to base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch source image' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = arrayBufferToBase64(imageBuffer);
    const imageMimeType = imageResponse.headers.get('content-type') || 'image/png';

    const videoPrompt = prompt || 'Create a subtle, professional animation from this advertisement image. Add gentle motion like parallax, zoom, or floating elements. Keep text readable and maintain ad quality.';

    // Use Lovable AI Gateway to generate video from image
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-pro-image-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Generate a short animated video from this static advertisement image. ${videoPrompt}. Duration should be ${duration || '5'} seconds. Maintain professional ad quality with smooth, eye-catching motion.`,
              },
              {
                type: 'image_url',
                image_url: { url: `data:${imageMimeType};base64,${base64Image}` },
              },
            ],
          },
        ],
        modalities: ['video', 'text'],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate video', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('AI response keys:', Object.keys(aiData));

    // Try to extract video data from various response formats
    const choice = aiData.choices?.[0]?.message;
    let videoBase64: string | null = null;
    let videoMimeType = 'video/mp4';

    // Check for video in images array (Gemini format)
    if (choice?.images?.[0]?.image_url?.url) {
      const dataUrl = choice.images[0].image_url.url;
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        videoMimeType = match[1];
        videoBase64 = match[2];
      }
    }

    // Check for video in content parts
    if (!videoBase64 && choice?.content) {
      try {
        const contentParts = typeof choice.content === 'string' ? JSON.parse(choice.content) : choice.content;
        if (Array.isArray(contentParts)) {
          for (const part of contentParts) {
            if (part.type === 'video' && part.data) {
              videoBase64 = part.data;
              videoMimeType = part.mimeType || 'video/mp4';
              break;
            }
          }
        }
      } catch {
        // content is plain text, no video
      }
    }

    if (!videoBase64) {
      console.error('No video in AI response:', JSON.stringify(aiData).slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'Video generation is not yet supported by the current AI model. Try again later or use a different approach.' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload to PRODUCTION storage
    const supabase = getProductionSupabase();

    const videoBytes = Uint8Array.from(atob(videoBase64), c => c.charCodeAt(0));
    const timestamp = Date.now();
    const uuid = crypto.randomUUID().slice(0, 8);
    const extension = videoMimeType.includes('mp4') ? 'mp4' : 'webm';
    const filePath = `generated-ads/${clientId}/${projectId}/video-${timestamp}-${uuid}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, videoBytes, { contentType: videoMimeType, upsert: false });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload video', details: uploadError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(filePath);

    // Save asset record
    const { data: asset } = await supabase
      .from('assets')
      .insert({
        project_id: projectId,
        client_id: clientId,
        type: 'video',
        public_url: publicUrl,
        storage_path: filePath,
        status: 'completed',
        name: `Animated - ${styleName || 'Ad'} (${aspectRatio || '1:1'})`,
        metadata: {
          sourceImageUrl: imageUrl,
          prompt: videoPrompt.slice(0, 500),
          duration: duration || '5',
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    console.log('Video generated successfully:', publicUrl);

    return new Response(
      JSON.stringify({ success: true, videoUrl: publicUrl, assetId: asset?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Generate video error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
