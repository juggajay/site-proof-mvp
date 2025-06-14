// supabase/functions/watermark-photo/index.ts
// Photo Watermarking Edge Function

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WatermarkRequest {
  file_data: string; // base64 encoded
  filename: string;
  project_id: string;
  entry_type: 'diary' | 'manpower' | 'equipment' | 'delivery' | 'event';
  entry_id: string;
  project_name: string;
  user_name: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { file_data, filename, project_id, entry_type, entry_id, project_name, user_name, gps_coordinates }: WatermarkRequest = await req.json()

    // Get current date/time
    const now = new Date()
    const date = now.toLocaleDateString('en-AU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
    const time = now.toLocaleTimeString('en-AU', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })

    // Create watermark text
    const watermarkLines = [
      project_name,
      `${date} ${time}`,
      user_name
    ]

    if (gps_coordinates) {
      watermarkLines.push(`GPS: ${gps_coordinates.latitude.toFixed(6)}, ${gps_coordinates.longitude.toFixed(6)}`)
    }

    // Convert base64 to Uint8Array
    const imageData = Uint8Array.from(atob(file_data), c => c.charCodeAt(0))

    // Create watermarked image using Canvas API
    const watermarkedImage = await addWatermarkToImage(imageData, watermarkLines)

    // Generate unique filenames
    const timestamp = now.getTime()
    const originalFilename = `original_${timestamp}_${filename}`
    const watermarkedFilename = `watermarked_${timestamp}_${filename}`

    // Storage paths
    const originalPath = `${project_id}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/originals/${originalFilename}`
    const watermarkedPath = `${project_id}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/watermarked/${watermarkedFilename}`

    // Upload original image
    const { error: originalUploadError } = await supabase.storage
      .from('site-photos')
      .upload(originalPath, imageData, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (originalUploadError) {
      throw new Error(`Failed to upload original image: ${originalUploadError.message}`)
    }

    // Upload watermarked image
    const { error: watermarkedUploadError } = await supabase.storage
      .from('site-photos')
      .upload(watermarkedPath, watermarkedImage, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (watermarkedUploadError) {
      throw new Error(`Failed to upload watermarked image: ${watermarkedUploadError.message}`)
    }

    // Get the current user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Create attachment record
    const watermarkData = {
      project_name,
      date,
      time,
      gps_coordinates: gps_coordinates ? `${gps_coordinates.latitude.toFixed(6)}, ${gps_coordinates.longitude.toFixed(6)}` : undefined,
      user_name,
    }

    const attachmentData = {
      [`${entry_type}_entry_id`]: entry_type === 'diary' ? null : entry_id,
      diary_entry_id: entry_type === 'diary' ? entry_id : null,
      original_filename: filename,
      watermarked_filename: watermarkedFilename,
      file_size: watermarkedImage.byteLength,
      mime_type: 'image/jpeg',
      watermark_data: watermarkData,
      gps_latitude: gps_coordinates?.latitude,
      gps_longitude: gps_coordinates?.longitude,
      original_path: originalPath,
      watermarked_path: watermarkedPath,
      uploaded_by: user.id,
    }

    const { data: attachment, error: attachmentError } = await supabase
      .from('site_diary_attachments')
      .insert(attachmentData)
      .select()
      .single()

    if (attachmentError) {
      throw new Error(`Failed to create attachment record: ${attachmentError.message}`)
    }

    // Get public URLs
    const { data: originalUrl } = supabase.storage
      .from('site-photos')
      .getPublicUrl(originalPath)

    const { data: watermarkedUrl } = supabase.storage
      .from('site-photos')
      .getPublicUrl(watermarkedPath)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          attachment_id: attachment.id,
          original_url: originalUrl.publicUrl,
          watermarked_url: watermarkedUrl.publicUrl,
          watermark_data: watermarkData,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in watermark-photo function:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function addWatermarkToImage(imageData: Uint8Array, watermarkLines: string[]): Promise<Uint8Array> {
  // Create a canvas for image manipulation
  const canvas = new OffscreenCanvas(1920, 1080) // Default size, will be adjusted
  const ctx = canvas.getContext('2d')!

  // Load the image
  const blob = new Blob([imageData], { type: 'image/jpeg' })
  const imageBitmap = await createImageBitmap(blob)

  // Resize canvas to match image
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  // Draw the original image
  ctx.drawImage(imageBitmap, 0, 0)

  // Calculate watermark position and size
  const fontSize = Math.max(16, Math.min(canvas.width * 0.02, 24))
  const padding = fontSize * 0.8
  const lineHeight = fontSize * 1.2

  // Set text properties
  ctx.font = `bold ${fontSize}px Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  // Calculate watermark dimensions
  const maxLineWidth = Math.max(...watermarkLines.map(line => ctx.measureText(line).width))
  const watermarkWidth = maxLineWidth + (padding * 2)
  const watermarkHeight = (lineHeight * watermarkLines.length) + (padding * 2)

  // Position watermark in bottom-right corner
  const watermarkX = canvas.width - watermarkWidth - 20
  const watermarkY = canvas.height - watermarkHeight - 20

  // Draw semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight)

  // Draw border
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)' // Gold border
  ctx.lineWidth = 2
  ctx.strokeRect(watermarkX, watermarkY, watermarkWidth, watermarkHeight)

  // Draw text lines
  ctx.fillStyle = '#FFFFFF'
  watermarkLines.forEach((line, index) => {
    const textX = watermarkX + padding
    const textY = watermarkY + padding + (index * lineHeight)
    ctx.fillText(line, textX, textY)
  })

  // Convert canvas to blob
  const blob2 = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 })
  const arrayBuffer = await blob2.arrayBuffer()
  return new Uint8Array(arrayBuffer)
}

// Deno Deploy configuration
export { serve }