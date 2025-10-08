import { parse } from 'csv-parse';
import * as bcrypt from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { generateMemorablePassword } from '../utils/passwordGenerator';
import emailService from './emailService';

interface ImportResult {
  success: boolean;
  message: string;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
}

interface ImportError {
  row: number;
  email?: string;
  error: string;
}

interface BaseUserRow {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface ClientRow extends BaseUserRow {
  dob?: string;
  location_state?: string;
  gender_identity?: string;
  ethnic_identity?: string;
  religious_background?: string;
  preferred_language?: string;
  areas_of_concern?: string;
  availability?: string;
  preferred_coach_gender?: string;
  bio?: string;
}

interface CoachRow extends BaseUserRow {
  dob?: string;
  location_state?: string;
  gender_identity?: string;
  ethnic_identity?: string;
  religious_background?: string;
  preferred_language?: string;
  languages_spoken?: string;
  specialties?: string;
  modalities?: string;
  bio?: string;
  hourly_rate?: string;
  availability?: string;
  years_experience?: string;
  education?: string;
  certifications?: string;
  approach_description?: string;
}

interface StaffRow extends BaseUserRow {
  department?: string;
  role_level?: string;
  employee_id?: string;
  hire_date?: string;
  employment_type?: string;
  salary_range?: string;
  supervisor_id?: string;
  bio?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  skills?: string;
  certifications?: string;
}

class CSVImportService {
  async importUsers(csvBuffer: Buffer, userType: 'client' | 'coach' | 'staff' | 'unified', sendEmails: boolean = true): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      const records = await this.parseCSV(csvBuffer);

      if (records.length === 0) {
        result.message = 'No valid records found in CSV file';
        return result;
      }

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // Add 2 to account for header row and 1-based indexing

        try {
          if (userType === 'unified') {
            // For unified CSV, use the role column to determine user type
            const rowUserType = row.role?.toLowerCase();
            if (!rowUserType || !['client', 'coach', 'staff'].includes(rowUserType)) {
              throw new Error(`Invalid or missing role: ${row.role}. Must be 'client', 'coach', or 'staff'`);
            }

            switch (rowUserType) {
              case 'client':
                await this.importClient(row as ClientRow, sendEmails);
                break;
              case 'coach':
                await this.importCoach(row as CoachRow, sendEmails);
                break;
              case 'staff':
                await this.importStaff(row as StaffRow, sendEmails);
                break;
            }
          } else {
            // Original single-type import
            switch (userType) {
              case 'client':
                await this.importClient(row as ClientRow, sendEmails);
                break;
              case 'coach':
                await this.importCoach(row as CoachRow, sendEmails);
                break;
              case 'staff':
                await this.importStaff(row as StaffRow, sendEmails);
                break;
            }
          }
          result.successCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push({
            row: rowNumber,
            email: row.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.successCount > 0;
      result.message = `Import completed: ${result.successCount} successful, ${result.errorCount} failed`;

      return result;
    } catch (error) {
      result.message = error instanceof Error ? error.message : 'Import failed';
      return result;
    }
  }

  private async parseCSV(csvBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];

      parse(csvBuffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        cast: true
      })
      .on('data', (record) => {
        records.push(record);
      })
      .on('error', (err) => {
        reject(err);
      })
      .on('end', () => {
        resolve(records);
      });
    });
  }

  private async importClient(row: ClientRow, sendEmails: boolean): Promise<void> {
    if (!row.email || !row.first_name || !row.last_name) {
      throw new Error('Missing required fields: email, first_name, last_name');
    }

    // Check if client already exists
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', row.email.toLowerCase())
      .single();

    if (existingClient) {
      throw new Error(`Client with email ${row.email} already exists`);
    }

    const tempPassword = generateMemorablePassword();

    // Create client profile directly (following existing auth pattern)
    const clientData: any = {
      email: row.email.toLowerCase(),
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone || null,
      dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : null,
      location_state: row.location_state || null,
      gender_identity: row.gender_identity || null,
      ethnic_identity: row.ethnic_identity || null,
      religious_background: row.religious_background || null,
      preferred_language: row.preferred_language || null,
      preferred_coach_gender: row.preferred_coach_gender || null,
      bio: row.bio || null
    };

    // Parse arrays from CSV
    if (row.areas_of_concern) {
      clientData.areas_of_concern = row.areas_of_concern.split(',').map((s: string) => s.trim());
    }
    if (row.availability) {
      clientData.availability = row.availability.split(',').map((s: string) => s.trim());
    }

    console.log('Creating client with data:', clientData);

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) {
      console.error('Client creation error details:', {
        error: clientError,
        clientData: clientData,
        type: typeof clientError,
        keys: Object.keys(clientError || {})
      });

      const errorMessage = clientError.message ||
                          clientError.code ||
                          clientError.details ||
                          (clientError.hint ? `Database hint: ${clientError.hint}` : '') ||
                          'Unknown database error';

      throw new Error(`Failed to create client: ${errorMessage}`);
    }

    console.log('Client created successfully:', client.id);

    // Send welcome email if enabled
    if (sendEmails) {
      try {
        await emailService.sendEmail({
          to: row.email,
          subject: 'Welcome to ACT Coaching Platform',
          html: `
            <h2>Welcome ${row.first_name}!</h2>
            <p>Your client account has been created successfully.</p>
            <p><strong>Email:</strong> ${row.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please log in and change your password as soon as possible.</p>
            <p>Best regards,<br>ACT Coaching Team</p>
          `
        });
      } catch (emailError) {
        console.warn(`Failed to send welcome email to ${row.email}:`, emailError);
      }
    }
  }

  private async importCoach(row: CoachRow, sendEmails: boolean): Promise<void> {
    if (!row.email || !row.first_name || !row.last_name) {
      throw new Error('Missing required fields: email, first_name, last_name');
    }

    // Check if coach already exists
    const { data: existingCoach } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', row.email.toLowerCase())
      .single();

    if (existingCoach) {
      throw new Error(`Coach with email ${row.email} already exists`);
    }

    const tempPassword = generateMemorablePassword();

    // Create coach profile directly (following existing pattern)
    const coachData: any = {
      email: row.email.toLowerCase(),
      first_name: row.first_name,
      last_name: row.last_name,
      phone: row.phone || null,
      bio: row.bio || null,
      hourly_rate_usd: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
      years_experience: row.years_experience ? parseInt(row.years_experience) : null,
      qualifications: row.education || null,
      is_available: true
    };

    // Parse arrays from CSV
    if (row.languages_spoken) {
      coachData.languages = row.languages_spoken.split(',').map((s: string) => s.trim());
    }
    if (row.specialties) {
      coachData.specialties = row.specialties.split(',').map((s: string) => s.trim());
    }
    if (row.availability) {
      const availabilityMap: { [key: string]: string } = {
        'weekday_mornings': 'weekday_mornings',
        'weekday_afternoons': 'weekday_afternoons',
        'weekday_evenings': 'weekday_evenings',
        'weekends': 'weekends',
        'flexible_anytime': 'flexible_anytime'
      };

      const availabilityOptions = row.availability.split(',')
        .map((s: string) => s.trim().toLowerCase().replace(/\s+/g, '_'))
        .filter((option: string) => availabilityMap[option])
        .map((option: string) => availabilityMap[option]);

      if (availabilityOptions.length > 0) {
        coachData.availability = availabilityOptions;
      }
    }

    console.log('Creating coach with data:', coachData);

    const { data: coach, error: coachError } = await supabase
      .from('coaches')
      .insert(coachData)
      .select()
      .single();

    if (coachError) {
      console.error('Coach creation error details:', {
        error: coachError,
        coachData: coachData,
        type: typeof coachError,
        keys: Object.keys(coachError || {})
      });

      const errorMessage = coachError.message ||
                          coachError.code ||
                          coachError.details ||
                          (coachError.hint ? `Database hint: ${coachError.hint}` : '') ||
                          'Unknown database error';

      throw new Error(`Failed to create coach: ${errorMessage}`);
    }

    console.log('Coach created successfully:', coach.id);

    // Send welcome email if enabled
    if (sendEmails) {
      try {
        await emailService.sendEmail({
          to: row.email,
          subject: 'Welcome to ACT Coaching Platform - Coach Account',
          html: `
            <h2>Welcome ${row.first_name}!</h2>
            <p>Your coach account has been created successfully.</p>
            <p><strong>Email:</strong> ${row.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please log in and change your password as soon as possible.</p>
            <p>Your application status is pending review. You will be notified once approved.</p>
            <p>Best regards,<br>ACT Coaching Team</p>
          `
        });
      } catch (emailError) {
        console.warn(`Failed to send welcome email to ${row.email}:`, emailError);
      }
    }
  }

  private async importStaff(row: StaffRow, sendEmails: boolean): Promise<void> {
    if (!row.email || !row.first_name || !row.last_name) {
      throw new Error('Missing required fields: email, first_name, last_name');
    }

    // Check if staff already exists
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('email', row.email.toLowerCase())
      .single();

    if (existingStaff) {
      throw new Error(`Staff member with email ${row.email} already exists`);
    }

    const tempPassword = generateMemorablePassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create staff profile directly
    const staffData: any = {
      email: row.email.toLowerCase(),
      first_name: row.first_name,
      last_name: row.last_name,
      password_hash: hashedPassword,
      phone: row.phone || null,
      department: row.department || null,
      role_level: row.role_level || 'staff',
      employee_id: row.employee_id || null,
      hire_date: row.hire_date ? new Date(row.hire_date).toISOString().split('T')[0] : null,
      employment_type: row.employment_type || null,
      salary_range: row.salary_range || null,
      supervisor_id: row.supervisor_id || null,
      bio: row.bio || null,
      emergency_contact_name: row.emergency_contact_name || null,
      emergency_contact_phone: row.emergency_contact_phone || null,
      emergency_contact_relationship: row.emergency_contact_relationship || null,
      status: 'active',
      is_verified: false
    };

    // Parse arrays from CSV
    if (row.skills) {
      staffData.skills = row.skills.split(',').map((s: string) => s.trim());
    }
    if (row.certifications) {
      staffData.certifications = row.certifications.split(',').map((s: string) => s.trim());
    }

    console.log('Creating staff with data:', staffData);

    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single();

    if (staffError) {
      console.error('Staff creation error details:', {
        error: staffError,
        staffData: staffData,
        type: typeof staffError,
        keys: Object.keys(staffError || {})
      });

      const errorMessage = staffError.message ||
                          staffError.code ||
                          staffError.details ||
                          (staffError.hint ? `Database hint: ${staffError.hint}` : '') ||
                          'Unknown database error';

      throw new Error(`Failed to create staff: ${errorMessage}`);
    }

    console.log('Staff created successfully:', staff.id);

    // Send welcome email if enabled
    if (sendEmails) {
      try {
        await emailService.sendEmail({
          to: row.email,
          subject: 'Welcome to ACT Coaching Platform - Staff Account',
          html: `
            <h2>Welcome ${row.first_name}!</h2>
            <p>Your staff account has been created successfully.</p>
            <p><strong>Email:</strong> ${row.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p>Please log in and change your password as soon as possible.</p>
            <p>Best regards,<br>ACT Coaching Team</p>
          `
        });
      } catch (emailError) {
        console.warn(`Failed to send welcome email to ${row.email}:`, emailError);
      }
    }
  }

  async validateCSVFormat(csvBuffer: Buffer, userType: 'client' | 'coach' | 'staff' | 'unified'): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      message: '',
      successCount: 0,
      errorCount: 0,
      errors: []
    };

    try {
      const records = await this.parseCSV(csvBuffer);

      if (records.length === 0) {
        result.message = 'No valid records found in CSV file';
        return result;
      }

      for (let i = 0; i < records.length; i++) {
        const row = records[i];
        const rowNumber = i + 2; // Add 2 to account for header row and 1-based indexing

        try {
          // Only validate required fields without creating users
          if (userType === 'unified') {
            // For unified CSV, get the role from the row
            const rowUserType = row.role?.toLowerCase();
            if (!rowUserType || !['client', 'coach', 'staff'].includes(rowUserType)) {
              throw new Error(`Invalid or missing role: ${row.role}. Must be 'client', 'coach', or 'staff'`);
            }
            await this.validateRow(row, rowUserType as 'client' | 'coach' | 'staff', rowNumber);
          } else {
            await this.validateRow(row, userType, rowNumber);
          }
          result.successCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push({
            row: rowNumber,
            email: row.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errorCount === 0;
      result.message = result.errorCount === 0
        ? `CSV format is valid: ${result.successCount} rows`
        : `CSV contains ${result.errorCount} validation errors`;

      return result;
    } catch (error) {
      result.message = error instanceof Error ? error.message : 'Validation failed';
      return result;
    }
  }

  private async validateRow(row: any, userType: 'client' | 'coach' | 'staff', rowNumber: number): Promise<void> {
    // Check required fields
    if (!row.email || !row.first_name || !row.last_name) {
      throw new Error('Missing required fields: email, first_name, last_name');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      throw new Error('Invalid email format');
    }

    // Type-specific validation (check if email already exists)
    switch (userType) {
      case 'client':
        const { data: existingClient } = await supabase
          .from('clients')
          .select('id')
          .eq('email', row.email.toLowerCase())
          .single();
        if (existingClient) {
          throw new Error(`Client with email ${row.email} already exists`);
        }
        break;

      case 'coach':
        const { data: existingCoach } = await supabase
          .from('coaches')
          .select('id')
          .eq('email', row.email.toLowerCase())
          .single();
        if (existingCoach) {
          throw new Error(`Coach with email ${row.email} already exists`);
        }
        break;

      case 'staff':
        const { data: existingStaff } = await supabase
          .from('staff')
          .select('id')
          .eq('email', row.email.toLowerCase())
          .single();
        if (existingStaff) {
          throw new Error(`Staff member with email ${row.email} already exists`);
        }
        break;
    }

    // Validate date formats if present
    if (row.dob) {
      const date = new Date(row.dob);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format for dob (use YYYY-MM-DD)');
      }
    }

    if (row.hire_date) {
      const date = new Date(row.hire_date);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format for hire_date (use YYYY-MM-DD)');
      }
    }

    // Validate numeric fields
    if (row.hourly_rate && isNaN(parseFloat(row.hourly_rate))) {
      throw new Error('Invalid hourly_rate (must be a number)');
    }

    if (row.years_experience && isNaN(parseInt(row.years_experience))) {
      throw new Error('Invalid years_experience (must be a number)');
    }
  }

  generateSampleCSV(userType: 'client' | 'coach' | 'staff' | 'unified'): string {
    // Always return minimal unified template with only required fields
    return [
      'role,email,first_name,last_name',
      'client,john.doe@example.com,John,Doe',
      'coach,sarah.johnson@example.com,Sarah,Johnson',
      'staff,alice.brown@example.com,Alice,Brown'
    ].join('\n');
  }
}

export const csvImportService = new CSVImportService();