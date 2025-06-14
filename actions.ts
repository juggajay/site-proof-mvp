// actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from './lib/supabase/server';
import { z } from 'zod';
import { Lot, ConformanceRecord } from './types';

// --- Create Project Action ---
const projectSchema = z.object({
    name: z.string().min(2), projectNumber: z.string().min(1), location: z.string().min(2),
});

export async function createProjectAction(formData: FormData) {
    console.log('🚀 Starting project creation...');
    
    try {
        const supabase = createClient();
        
        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        console.log('👤 Auth check:', { user: !!user, error: authError });
        
        if (authError) throw new Error(`Authentication error: ${authError.message}`);
        if (!user) throw new Error('Authentication required');
        
        // Get user profile
        console.log('🔍 Loading user profile for:', user.id);
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.id)
            .single();
            
        console.log('👤 Profile check:', { profile, error: profileError });
        
        if (profileError) {
            console.error('❌ Profile query failed:', profileError);
            throw new Error(`Profile error: ${profileError.message}`);
        }
        if (!profile?.organization_id) throw new Error('User profile or organization not found');
        
        // Validate form data
        const validatedData = projectSchema.safeParse({
            name: formData.get('name'),
            projectNumber: formData.get('projectNumber'),
            location: formData.get('location'),
        });
        
        console.log('📝 Form validation:', { success: validatedData.success, data: validatedData.success ? validatedData.data : validatedData.error });
        
        if (!validatedData.success) {
            throw new Error(`Invalid form data: ${validatedData.error.errors.map(e => e.message).join(', ')}`);
        }
        
        // Prepare project data
        const projectData = {
            name: validatedData.data.name,
            project_number: validatedData.data.projectNumber,
            location: validatedData.data.location,
            organization_id: profile.organization_id,
        };
        
        console.log('📝 Creating project with data:', projectData);
        
        // Insert project
        const { data: project, error: insertError } = await supabase
            .from('projects')
            .insert([projectData])
            .select()
            .single();
            
        console.log('✅ Project creation result:', { project, error: insertError });
        
        if (insertError) {
            throw new Error(`Database error: ${insertError.message}`);
        }
        
        revalidatePath('/dashboard');
        console.log('🎉 Project created successfully:', project);
        
        return { success: true, project };
        
    } catch (error) {
        console.error('❌ Project creation failed:', error);
        throw error;
    }
}

// --- Create Lot Action ---
const lotSchema = z.object({
    lotNumber: z.string().min(1), description: z.string().min(2),
    itpId: z.string().uuid(), projectId: z.string().uuid(),
});
export async function createLotAction(formData: FormData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required');
    const validatedData = lotSchema.safeParse({
        lotNumber: formData.get('lotNumber'), description: formData.get('description'),
        itpId: formData.get('itpId'), projectId: formData.get('projectId'),
    });
    if (!validatedData.success) throw new Error('Invalid lot data');
    const { data: lotData, error } = await supabase.from('lots').insert({
        lot_number: validatedData.data.lotNumber, description: validatedData.data.description,
        project_id: validatedData.data.projectId, itp_id: validatedData.data.itpId,
    }).select().single<Lot>();
    if (error) throw new Error(error.message);
    revalidatePath(`/project/${validatedData.data.projectId}`);
    return { success: true, newLot: lotData };
}

// --- Save Inspection Answers Action ---
const answerSchema = z.object({
  itp_item_id: z.string().uuid(),
  pass_fail_value: z.enum(['PASS', 'FAIL', 'N/A']).optional(),
  text_value: z.string().optional(),
  numeric_value: z.number().optional(),
  comment: z.string().optional(),
});

const saveAnswersSchema = z.object({
  lot_id: z.string().uuid(),
  answers: z.array(answerSchema),
});

export async function saveInspectionAnswersAction(formData: FormData) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Parse form data
    const lot_id = formData.get('lot_id') as string;
    const rawAnswers = formData.get('answers') as string;
    
    if (!lot_id || !rawAnswers) {
      return { success: false, error: 'Missing required data' };
    }

    // Parse and validate answers
    const answersData = JSON.parse(rawAnswers);
    const validatedData = saveAnswersSchema.parse({
      lot_id,
      answers: answersData
    });

    // Filter out answers that have actual values
    const validAnswers = validatedData.answers.filter(answer =>
      answer.pass_fail_value ||
      answer.text_value?.trim() ||
      answer.numeric_value !== undefined ||
      answer.comment?.trim()
    );

    if (validAnswers.length === 0) {
      return { success: false, error: 'No valid answers to save' };
    }

    // Save each answer to conformance_records table
    const conformanceRecords = validAnswers.map(answer => ({
      lot_id: validatedData.lot_id,
      itp_item_id: answer.itp_item_id,
      completed_by: user.id,
      pass_fail_value: answer.pass_fail_value || null,
      text_value: answer.text_value?.trim() || null,
      numeric_value: answer.numeric_value || null,
      comment: answer.comment?.trim() || null,
      updated_at: new Date().toISOString(),
    }));

    // Use upsert to handle both new and updated records
    const { error: upsertError } = await supabase
      .from('conformance_records')
      .upsert(conformanceRecords, {
        onConflict: 'lot_id,itp_item_id',
        ignoreDuplicates: false
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return { success: false, error: 'Failed to save inspection data' };
    }

    // Update lot status to 'in_progress' if not already completed
    const { error: lotUpdateError } = await supabase
      .from('lots')
      .update({
        status: 'IN_PROGRESS',
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.lot_id)
      .neq('status', 'COMPLETED'); // Don't overwrite completed status

    if (lotUpdateError) {
      console.error('Lot update error:', lotUpdateError);
      // Don't fail the entire operation for this
    }

    // Revalidate the page to show updated data
    revalidatePath(`/project/*/lot/${validatedData.lot_id}`);
    
    return {
      success: true,
      message: 'Inspection progress saved successfully',
      saved_count: conformanceRecords.length
    };

  } catch (error) {
    console.error('Save inspection answers error:', error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Invalid data format' };
    }
    
    return { success: false, error: 'Failed to save inspection progress' };
  }
}

// --- Save Site Diary Action ---
const saveSiteDiarySchema = z.object({
  lotId: z.string().uuid(),
  reportDate: z.string(), // YYYY-MM-DD format
  generalComments: z.string().min(1, "General comments are required"),
  weather: z.string().min(1, "Weather condition is required"),
});

export async function saveSiteDiaryAction(formData: FormData) {
  console.log('=== SAVE DIARY DEBUG START ===');
  console.log('FormData received:', Object.fromEntries(formData));
  
  try {
    // Get current user
    const supabase = createClient();
    console.log('Getting user authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      throw new Error('Authentication required');
    }
    console.log('User authenticated:', user.id);

    // Validate form data
    console.log('Validating form data...');
    const rawData = {
      lotId: formData.get('lotId'),
      reportDate: formData.get('reportDate'),
      generalComments: formData.get('generalComments'),
      weather: formData.get('weather'),
    };
    console.log('Raw form data:', rawData);
    
    const validatedData = saveSiteDiarySchema.parse(rawData);
    console.log('Validated data:', validatedData);

    // Check if daily_lot_reports table exists and structure
    console.log('Testing database connection...');
    const { data: testQuery, error: testError } = await supabase
      .from('daily_lot_reports')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('Database table test failed:', testError);
      throw new Error(`Database table error: ${testError.message}`);
    }
    console.log('Database table accessible, sample data:', testQuery);

    // Upsert daily report (create or update)
    console.log('Attempting to upsert daily report...');
    const upsertData = {
      lot_id: validatedData.lotId,
      report_date: validatedData.reportDate,
      general_comments: validatedData.generalComments,
      weather: validatedData.weather,
      updated_at: new Date().toISOString(),
    };
    console.log('Upsert data:', upsertData);
    
    const { data: dailyReport, error } = await supabase
      .from('daily_lot_reports')
      .upsert(
        upsertData,
        {
          onConflict: 'lot_id,report_date',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (error) {
      console.error('Database upsert error:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    console.log('Upsert successful, daily report:', dailyReport);

    // Revalidate the page to show updated data
    console.log('Revalidating path...');
    revalidatePath(`/project/*/lot/${validatedData.lotId}`);
    
    const result = {
      success: true,
      dailyReportId: dailyReport.id,
      message: 'Site diary saved successfully'
    };
    console.log('=== SAVE DIARY SUCCESS ===', result);
    return result;

  } catch (error) {
    console.error('=== SAVE DIARY ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(error instanceof Error ? error.message : 'Failed to save site diary');
  }
}

// --- Get Diary Photo Upload URL Action (Future-proofing) ---
export async function getDiaryPhotoUploadUrlAction(dailyReportId: string) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Generate unique filename
    const fileName = `diary-photos/${dailyReportId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    
    // Create signed upload URL (expires in 1 hour)
    const { data, error } = await supabase.storage
      .from('daily-reports')
      .createSignedUploadUrl(fileName);

    if (error) {
      throw new Error(`Storage error: ${error.message}`);
    }

    return {
      success: true,
      uploadUrl: data.signedUrl,
      filePath: fileName,
    };

  } catch (error) {
    console.error('Get upload URL error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get upload URL');
  }
}