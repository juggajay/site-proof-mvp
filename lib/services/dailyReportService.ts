// lib/services/dailyReportService.ts
import { createClient } from '../supabase/client'
import type {
  Project,
  Lot,
  LotWithProject,
  DailyLotReport,
  DiaryEntry,
  LabourDocket,
  PlantDocket,
  MaterialDocket,
  ComplianceCheck,
  GPSCoordinates,
  CreateDiaryEntryForm,
  CreateLabourDocketForm,
  CreatePlantDocketForm,
  CreateMaterialDocketForm,
  CreateComplianceCheckForm
} from '../../types/database'

class DailyReportService {
  private supabase = createClient()

  /**
   * Get lot with associated project data
   */
  async getLotWithProject(lotId: string): Promise<LotWithProject> {
    console.log('🔍 Fetching lot with project:', lotId)
    
    const { data, error } = await this.supabase
      .from('lots')
      .select(`
        id,
        name,
        description,
        status,
        project_id,
        created_at,
        updated_at,
        projects!inner (
          id,
          name,
          description,
          project_number,
          location,
          status,
          organization_id,
          created_at,
          updated_at
        )
      `)
      .eq('id', lotId)
      .single()

    if (error) {
      console.error('❌ Error fetching lot with project:', error)
      throw new Error(`Failed to fetch lot: ${error.message}`)
    }

    if (!data) {
      throw new Error('Lot not found')
    }

    // Handle the case where projects might be an array
    const lotWithProject = {
      ...data,
      projects: Array.isArray(data.projects) ? data.projects[0] : data.projects
    }

    if (!lotWithProject.projects) {
      throw new Error('Project information not found for this lot')
    }

    console.log('✅ Lot with project fetched successfully')
    return lotWithProject as LotWithProject
  }

  /**
   * Get or create daily report for a specific lot and date
   */
  async getDailyReport(lotId: string, date: string): Promise<DailyLotReport> {
    console.log('📅 Getting daily report for lot:', lotId, 'date:', date)
    
    let { data: report, error } = await this.supabase
      .from('daily_lot_reports')
      .select('*')
      .eq('lot_id', lotId)
      .eq('report_date', date)
      .single()

    if (error && error.code === 'PGRST116') {
      // Report doesn't exist, create it
      console.log('📝 Creating new daily report...')
      
      const { data: newReport, error: createError } = await this.supabase
        .from('daily_lot_reports')
        .insert([{
          lot_id: lotId,
          report_date: date,
          weather: 'sunny',
          general_activities: ''
        }])
        .select()
        .single()

      if (createError) {
        console.error('❌ Error creating daily report:', createError)
        throw new Error(`Failed to create daily report: ${createError.message}`)
      }

      report = newReport
      console.log('✅ New daily report created:', report.id)
    } else if (error) {
      console.error('❌ Error fetching daily report:', error)
      throw new Error(`Failed to fetch daily report: ${error.message}`)
    } else {
      console.log('✅ Existing daily report found:', report.id)
    }

    if (!report) {
      throw new Error('Failed to get or create daily report')
    }

    return report as DailyLotReport
  }

  /**
   * Update daily report general information
   */
  async updateDailyReport(
    reportId: string, 
    updates: Partial<Pick<DailyLotReport, 'weather' | 'general_activities'>>
  ): Promise<void> {
    console.log('💾 Updating daily report:', reportId, updates)
    
    const { error } = await this.supabase
      .from('daily_lot_reports')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (error) {
      console.error('❌ Error updating daily report:', error)
      throw new Error(`Failed to update daily report: ${error.message}`)
    }

    console.log('✅ Daily report updated successfully')
  }

  /**
   * Get all diary entries for a daily report
   */
  async getDiaryEntries(dailyReportId: string): Promise<DiaryEntry[]> {
    console.log('📖 Fetching diary entries for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('diary_entries')
      .select('*')
      .eq('daily_report_id', dailyReportId)
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('❌ Error fetching diary entries:', error)
      throw new Error(`Failed to fetch diary entries: ${error.message}`)
    }

    console.log('✅ Fetched', data?.length || 0, 'diary entries')
    return data as DiaryEntry[]
  }

  /**
   * Create a new diary entry
   */
  async createDiaryEntry(
    dailyReportId: string,
    entryData: CreateDiaryEntryForm,
    gpsCoordinates?: GPSCoordinates
  ): Promise<DiaryEntry> {
    console.log('📝 Creating diary entry for report:', dailyReportId)
    
    // Get current user
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) {
      throw new Error('User not authenticated')
    }

    let photoUrl: string | undefined

    // Upload photo if provided
    if (entryData.photo) {
      photoUrl = await this.uploadPhoto(entryData.photo, 'diary-photos')
    }

    const entryToInsert = {
      daily_report_id: dailyReportId,
      title: entryData.title,
      description: entryData.description,
      photo_url: photoUrl,
      gps_coordinates: gpsCoordinates 
        ? `POINT(${gpsCoordinates.longitude} ${gpsCoordinates.latitude})` 
        : null,
      created_by: session.user.id
    }

    const { data, error } = await this.supabase
      .from('diary_entries')
      .insert([entryToInsert])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating diary entry:', error)
      throw new Error(`Failed to create diary entry: ${error.message}`)
    }

    console.log('✅ Diary entry created successfully:', data.id)
    return data as DiaryEntry
  }

  /**
   * Upload photo to Supabase Storage
   */
  async uploadPhoto(file: File, folder: string = 'diary-photos'): Promise<string> {
    console.log('📸 Uploading photo to folder:', folder)
    
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
    
    const { data, error } = await this.supabase.storage
      .from('diary-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Error uploading photo:', error)
      throw new Error(`Failed to upload photo: ${error.message}`)
    }

    const { data: { publicUrl } } = this.supabase.storage
      .from('diary-photos')
      .getPublicUrl(fileName)

    console.log('✅ Photo uploaded successfully:', publicUrl)
    return publicUrl
  }

  /**
   * Get current GPS coordinates
   */
  async getCurrentLocation(): Promise<GPSCoordinates | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported')
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          console.log('✅ GPS coordinates obtained:', coords)
          resolve(coords)
        },
        (error) => {
          console.error('❌ GPS error:', error)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  /**
   * Get labour dockets for a daily report
   */
  async getLabourDockets(dailyReportId: string): Promise<LabourDocket[]> {
    console.log('👷 Fetching labour dockets for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('labour_dockets')
      .select('*')
      .eq('daily_report_id', dailyReportId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching labour dockets:', error)
      throw new Error(`Failed to fetch labour dockets: ${error.message}`)
    }

    console.log('✅ Fetched', data?.length || 0, 'labour dockets')
    return data as LabourDocket[]
  }

  /**
   * Create labour docket
   */
  async createLabourDocket(
    dailyReportId: string,
    docketData: CreateLabourDocketForm
  ): Promise<LabourDocket> {
    console.log('👷 Creating labour docket for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('labour_dockets')
      .insert([{
        daily_report_id: dailyReportId,
        ...docketData
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating labour docket:', error)
      throw new Error(`Failed to create labour docket: ${error.message}`)
    }

    console.log('✅ Labour docket created successfully:', data.id)
    return data as LabourDocket
  }

  /**
   * Get plant dockets for a daily report
   */
  async getPlantDockets(dailyReportId: string): Promise<PlantDocket[]> {
    console.log('🚜 Fetching plant dockets for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('plant_dockets')
      .select('*')
      .eq('daily_report_id', dailyReportId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching plant dockets:', error)
      throw new Error(`Failed to fetch plant dockets: ${error.message}`)
    }

    console.log('✅ Fetched', data?.length || 0, 'plant dockets')
    return data as PlantDocket[]
  }

  /**
   * Create plant docket
   */
  async createPlantDocket(
    dailyReportId: string,
    docketData: CreatePlantDocketForm
  ): Promise<PlantDocket> {
    console.log('🚜 Creating plant docket for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('plant_dockets')
      .insert([{
        daily_report_id: dailyReportId,
        ...docketData
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating plant docket:', error)
      throw new Error(`Failed to create plant docket: ${error.message}`)
    }

    console.log('✅ Plant docket created successfully:', data.id)
    return data as PlantDocket
  }

  /**
   * Get material dockets for a daily report
   */
  async getMaterialDockets(dailyReportId: string): Promise<MaterialDocket[]> {
    console.log('📦 Fetching material dockets for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('material_dockets')
      .select('*')
      .eq('daily_report_id', dailyReportId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching material dockets:', error)
      throw new Error(`Failed to fetch material dockets: ${error.message}`)
    }

    console.log('✅ Fetched', data?.length || 0, 'material dockets')
    return data as MaterialDocket[]
  }

  /**
   * Create material docket
   */
  async createMaterialDocket(
    dailyReportId: string,
    docketData: CreateMaterialDocketForm
  ): Promise<MaterialDocket> {
    console.log('📦 Creating material docket for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('material_dockets')
      .insert([{
        daily_report_id: dailyReportId,
        ...docketData
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating material docket:', error)
      throw new Error(`Failed to create material docket: ${error.message}`)
    }

    console.log('✅ Material docket created successfully:', data.id)
    return data as MaterialDocket
  }

  /**
   * Get compliance checks for a daily report
   */
  async getComplianceChecks(dailyReportId: string): Promise<ComplianceCheck[]> {
    console.log('✅ Fetching compliance checks for report:', dailyReportId)
    
    const { data, error } = await this.supabase
      .from('daily_compliance_checks')
      .select('*')
      .eq('daily_report_id', dailyReportId)
      .order('checked_at', { ascending: false })

    if (error) {
      console.error('❌ Error fetching compliance checks:', error)
      throw new Error(`Failed to fetch compliance checks: ${error.message}`)
    }

    console.log('✅ Fetched', data?.length || 0, 'compliance checks')
    return data as ComplianceCheck[]
  }

  /**
   * Create compliance check
   */
  async createComplianceCheck(
    dailyReportId: string,
    checkData: CreateComplianceCheckForm
  ): Promise<ComplianceCheck> {
    console.log('✅ Creating compliance check for report:', dailyReportId)
    
    // Get current user
    const { data: { session } } = await this.supabase.auth.getSession()
    if (!session) {
      throw new Error('User not authenticated')
    }

    let photoUrl: string | undefined

    // Upload photo if provided
    if (checkData.photo) {
      photoUrl = await this.uploadPhoto(checkData.photo, 'compliance-photos')
    }

    const { data, error } = await this.supabase
      .from('daily_compliance_checks')
      .insert([{
        daily_report_id: dailyReportId,
        check_type: checkData.check_type,
        item_name: checkData.item_name,
        status: checkData.status,
        comments: checkData.comments,
        photo_url: photoUrl,
        checked_by: session.user.id
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating compliance check:', error)
      throw new Error(`Failed to create compliance check: ${error.message}`)
    }

    console.log('✅ Compliance check created successfully:', data.id)
    return data as ComplianceCheck
  }

  /**
   * Parse GPS coordinates from PostGIS POINT format
   */
  parseGPSCoordinates(gpsString: string | null): GPSCoordinates | null {
    if (!gpsString) return null
    
    // Parse POINT(longitude latitude) format
    const match = gpsString.match(/POINT\(([^)]+)\)/)
    if (!match) return null
    
    const [longitude, latitude] = match[1].split(' ').map(Number)
    return { latitude, longitude }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

// Export singleton instance
export const dailyReportService = new DailyReportService()