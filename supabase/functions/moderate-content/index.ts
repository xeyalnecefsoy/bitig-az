import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SYSTEM_PROMPT = `
You are a content moderation AI for an Azerbaijani reading and social platform. Your job is to analyze user-generated text and determine if it violates community guidelines.
Violations include:
- Profanity, insults, hate speech, or harassment (in Azerbaijani, English, Russian, or Turkish).
- Spam, unsolicited advertising, or malicious links.
- Sexually explicit or violently graphic content.
- Gibberish or bot-generated text.

Respond ONLY with a valid JSON in the following format. 
IMPORTANT: The "reason" field MUST BE written entirely in the Azerbaijani language, regardless of the language of the analyzed text.

{
  "status": "approved" | "flagged",
  "reason": "Qısa izahat (MÜTLƏQ AZƏRBAYCAN DİLİNDƏ OLMALIDIR) və ya təsdiqlənibsə null",
  "confidence": 0-100
}
`.trim();

serve(async (req) => {
  try {
    const payload = await req.json();
    
    // Supabase webhook payload structure
    const table = payload.table; // 'posts' or 'comments'
    const record = payload.record;
    
    if (!record || !record.id || !record.content) {
      return new Response("Invalid payload", { status: 400 });
    }

    if (!DEEPSEEK_API_KEY) {
      console.error("Missing DEEPSEEK_API_KEY");
      
      // If we don't have the API key, default to approved so user experience isn't blocked,
      // but log an error.
      await supabase.from(table).update({ status: 'approved' }).eq('id', record.id);
      await supabase.from('ai_moderation_logs').insert({
        entity_id: record.id,
        entity_type: table === 'posts' ? 'post' : 'comment',
        action: 'error',
        reason: 'Missing API Key in environment'
      });
      
      return new Response("Configuration error", { status: 500 });
    }

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Text to analyze:\n"${record.content}"` }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", errorText);
      throw new Error(`DeepSeek API failed: ${response.status}`);
    }

    const aiData = await response.json();
    let moderationResult;
    try {
      moderationResult = JSON.parse(aiData.choices[0].message.content);
    } catch (e) {
      console.error("Failed to parse AI response:", aiData);
      throw new Error("Invalid response format from AI");
    }

    const finalStatus = moderationResult.status === 'flagged' ? 'flagged' : 'approved';
    const reason = moderationResult.reason || null;
    const confidence = moderationResult.confidence || 0;

    // Update the record in the database
    const { error: updateError } = await supabase
      .from(table)
      .update({ status: finalStatus })
      .eq('id', record.id);

    if (updateError) {
      console.error(`Failed to update ${table} record: ${record.id}`, updateError);
      throw updateError;
    }

    // Log the action
    const { error: logError } = await supabase
      .from('ai_moderation_logs')
      .insert({
        entity_id: record.id,
        entity_type: table === 'posts' ? 'post' : 'comment',
        action: finalStatus,
        reason: reason,
        confidence: confidence
      });

    if (logError) {
      console.error("Failed to insert moderation log:", logError);
    }

    return new Response(JSON.stringify({ success: true, status: finalStatus }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
