import { Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcrypt';
import { auditLogger, AuditRequest } from '../utils/auditLogger';

interface AuthRequest extends AuditRequest {
  user?: {
    id: string;
    userId: string;
    role: 'admin' | 'staff' | 'coach' | 'client';
    email: string;
    first_name?: string;
    last_name?: string;
    [key: string]: any;
  };
}

// Get all staff members
export const getStaffMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { data: result, error } = await supabase
      .from('staff')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        department,
        role_level,
        employee_id,
        hire_date,
        status,
        is_verified,
        employment_type,
        profile_photo,
        bio,
        supervisor_id,
        created_at,
        updated_at,
        last_login,
        skills,
        certifications
      `)
      .neq('status', 'deleted')
      .order('last_name', { ascending: true })
      .order('first_name', { ascending: true });

    if (error) {
      console.error('Error fetching staff members:', error);
      return res.status(500).json({ error: 'Failed to fetch staff members' });
    }

    // Transform the data to match the frontend interface
    const staffMembers = result.map(staff => ({
      id: staff.id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      email: staff.email,
      phone: staff.phone,
      department: staff.department,
      role_level: staff.role_level,
      employee_id: staff.employee_id,
      hire_date: staff.hire_date,
      status: staff.status,
      is_verified: staff.is_verified,
      employment_type: staff.employment_type,
      profile_photo: staff.profile_photo,
      bio: staff.bio,
      supervisor_id: staff.supervisor_id,
      created_at: staff.created_at,
      updated_at: staff.updated_at,
      last_login: staff.last_login,
      skills: staff.skills || [],
      certifications: staff.certifications || [],
      role: 'staff' // For consistency with the user interface
    }));

    res.json(staffMembers);
  } catch (error) {
    console.error('Error fetching staff members:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
};

// Get staff permissions
export const getStaffPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { data: result, error } = await supabase
      .from('staff_permissions')
      .select('staff_id, capability_id, granted')
      .eq('granted', true);

    if (error) {
      console.error('Error fetching staff permissions:', error);
      return res.status(500).json({ error: 'Failed to fetch staff permissions' });
    }

    // Transform to nested object structure: { staffId: { capabilityId: granted } }
    const permissions: { [staffId: string]: { [capabilityId: string]: boolean } } = {};

    result.forEach(row => {
      if (!permissions[row.staff_id]) {
        permissions[row.staff_id] = {};
      }
      permissions[row.staff_id][row.capability_id] = row.granted;
    });

    // Log the admin action for viewing staff permissions
    await auditLogger.logAction(req, {
      action: 'STAFF_PERMISSIONS_VIEWED',
      resource_type: 'staff_permissions',
      resource_id: 'bulk_view',
      details: `Viewed staff permissions for ${Object.keys(permissions).length} staff members`,
      metadata: {
        total_staff_with_permissions: Object.keys(permissions).length,
        total_permissions_viewed: result.length
      }
    });

    res.json(permissions);
  } catch (error) {
    console.error('Error fetching staff permissions:', error);
    res.status(500).json({ error: 'Failed to fetch staff permissions' });
  }
};

// Update staff permissions
export const updateStaffPermissions = async (req: AuthRequest, res: Response) => {
  try {
    console.log('[updateStaffPermissions] Request received');
    console.log('[updateStaffPermissions] User:', req.user);
    console.log('[updateStaffPermissions] Body:', req.body);

    const { permissions } = req.body;
    const adminId = req.user?.id;

    if (!permissions || typeof permissions !== 'object') {
      console.log('[updateStaffPermissions] Invalid permissions data');
      return res.status(400).json({ error: 'Invalid permissions data' });
    }

    console.log('[updateStaffPermissions] Processing changed permissions for admin:', adminId);
    console.log('[updateStaffPermissions] Changed permissions received:', permissions);

    // Track changes for audit logging
    const permissionChanges: Array<{
      staffId: string;
      capabilityId: string;
      granted: boolean;
      staffName?: string;
    }> = [];

    // Process each staff member's changed permissions only
    for (const [staffId, staffPermissions] of Object.entries(permissions)) {
      if (typeof staffPermissions !== 'object') continue;

      // Get staff member info for audit logging
      const { data: staffInfo } = await supabase
        .from('staff')
        .select('first_name, last_name, email')
        .eq('id', staffId)
        .single();

      const staffName = staffInfo ? `${staffInfo.first_name} ${staffInfo.last_name}` : 'Unknown Staff';

      // Process each changed capability for this staff member
      for (const [capabilityId, granted] of Object.entries(staffPermissions as { [key: string]: boolean })) {
        // Upsert permission - use null for granted_by if admin not in staff table
        const { error: upsertError } = await supabase
          .from('staff_permissions')
          .upsert({
            staff_id: staffId,
            capability_id: capabilityId,
            granted: granted,
            granted_by: null, // Set to null to avoid foreign key constraint
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'staff_id,capability_id'
          });

        if (upsertError) {
          console.error('Error upserting permission:', upsertError);
        } else {
          // Track successful changes for audit logging
          permissionChanges.push({
            staffId,
            capabilityId,
            granted,
            staffName
          });
        }

        console.log(`Permission ${capabilityId} for staff ${staffId} (${staffName}) updated to ${granted}`);
      }
    }

    // Log the admin action for all permission changes
    if (permissionChanges.length > 0) {
      const affectedStaffCount = [...new Set(permissionChanges.map(c => c.staffId))].length;
      await auditLogger.logAction(req, {
        action: 'STAFF_PERMISSIONS_UPDATED',
        resource_type: 'staff_permissions',
        resource_id: 'selective_update',
        details: `Updated ${permissionChanges.length} permission${permissionChanges.length === 1 ? '' : 's'} for ${affectedStaffCount} staff member${affectedStaffCount === 1 ? '' : 's'}`,
        metadata: {
          total_changes: permissionChanges.length,
          affected_staff_count: affectedStaffCount,
          affected_staff_ids: [...new Set(permissionChanges.map(c => c.staffId))],
          permission_changes: permissionChanges.map(change => ({
            staff_id: change.staffId,
            staff_name: change.staffName,
            capability_id: change.capabilityId,
            granted: change.granted,
            action: change.granted ? 'granted' : 'revoked'
          }))
        }
      });
    } else {
      console.log('[updateStaffPermissions] No changes to process');
      return res.json({ success: true, message: 'No changes to save' });
    }

    res.json({ success: true, message: 'Permissions updated successfully' });
  } catch (error) {
    console.error('Error updating staff permissions:', error);
    res.status(500).json({ error: 'Failed to update staff permissions' });
  }
};

// Create new staff member
export const createStaffMember = async (req: AuthRequest, res: Response) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      department,
      role_level = 'staff',
      employee_id,
      hire_date,
      employment_type = 'full-time',
      bio,
      supervisor_id,
      skills = [],
      certifications = []
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing staff:', checkError);
      return res.status(500).json({ error: 'Failed to check existing staff' });
    }

    if (existingStaff) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new staff member
    const { data: newStaff, error: insertError } = await supabase
      .from('staff')
      .insert({
        first_name,
        last_name,
        email,
        password_hash,
        phone,
        department,
        role_level,
        employee_id,
        hire_date,
        employment_type,
        bio,
        supervisor_id,
        skills,
        certifications,
        status: 'active',
        is_verified: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating staff member:', insertError);
      return res.status(500).json({ error: 'Failed to create staff member' });
    }

    // Log the creation
    const { error: logError } = await supabase
      .from('staff_audit_log')
      .insert({
        staff_id: req.user?.id,
        action: 'staff_created',
        resource_type: 'staff',
        resource_id: newStaff.id,
        details: {
          created_staff: {
            name: `${first_name} ${last_name}`,
            email: email,
            department: department,
            role_level: role_level
          }
        },
        ip_address: req.ip
      });

    if (logError) {
      console.error('Error logging staff creation:', logError);
    }

    // Remove password_hash from response
    const { password_hash: _, ...staffResponse } = newStaff;
    res.status(201).json({
      success: true,
      staff: { ...staffResponse, role: 'staff' }
    });

  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ error: 'Failed to create staff member' });
  }
};

// Update staff member
export const updateStaffMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone,
      department,
      role_level,
      employee_id,
      hire_date,
      employment_type,
      bio,
      supervisor_id,
      skills,
      certifications,
      status
    } = req.body;

    // Check if staff member exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking existing staff:', checkError);
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingStaff.email) {
      const { data: emailCheck, error: emailError } = await supabase
        .from('staff')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailError && emailError.code !== 'PGRST116') {
        console.error('Error checking email:', emailError);
        return res.status(500).json({ error: 'Failed to check email' });
      }

      if (emailCheck) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() };

    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (department !== undefined) updateData.department = department;
    if (role_level !== undefined) updateData.role_level = role_level;
    if (employee_id !== undefined) updateData.employee_id = employee_id;
    if (hire_date !== undefined) updateData.hire_date = hire_date;
    if (employment_type !== undefined) updateData.employment_type = employment_type;
    if (bio !== undefined) updateData.bio = bio;
    if (supervisor_id !== undefined) updateData.supervisor_id = supervisor_id;
    if (skills !== undefined) updateData.skills = skills;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (status !== undefined) updateData.status = status;

    // Update staff member
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating staff member:', updateError);
      return res.status(500).json({ error: 'Failed to update staff member' });
    }

    // Log the update
    const { error: logError } = await supabase
      .from('staff_audit_log')
      .insert({
        staff_id: req.user?.id,
        action: 'staff_updated',
        resource_type: 'staff',
        resource_id: id,
        details: {
          updated_fields: Object.keys(updateData).filter(key => key !== 'updated_at'),
          staff_name: `${updatedStaff.first_name} ${updatedStaff.last_name}`
        },
        ip_address: req.ip
      });

    if (logError) {
      console.error('Error logging staff update:', logError);
    }

    // Remove password_hash from response
    const { password_hash: _, ...staffResponse } = updatedStaff;
    res.json({
      success: true,
      staff: { ...staffResponse, role: 'staff' }
    });

  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ error: 'Failed to update staff member' });
  }
};

// Delete staff member
export const deleteStaffMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if staff member exists
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      console.error('Error checking existing staff:', checkError);
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Soft delete - update status to 'deleted'
    const { error: deleteError } = await supabase
      .from('staff')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting staff member:', deleteError);
      return res.status(500).json({ error: 'Failed to delete staff member' });
    }

    // Log the deletion
    const { error: logError } = await supabase
      .from('staff_audit_log')
      .insert({
        staff_id: req.user?.id,
        action: 'staff_deleted',
        resource_type: 'staff',
        resource_id: id,
        details: {
          deleted_staff: {
            name: `${existingStaff.first_name} ${existingStaff.last_name}`,
            email: existingStaff.email
          }
        },
        ip_address: req.ip
      });

    if (logError) {
      console.error('Error logging staff deletion:', logError);
    }

    res.json({ success: true, message: 'Staff member deleted successfully' });

  } catch (error) {
    console.error('Error deleting staff member:', error);
    res.status(500).json({ error: 'Failed to delete staff member' });
  }
};

// Get staff member permissions for middleware/authorization
export const getStaffMemberPermissions = async (staffId: string): Promise<string[]> => {
  try {
    const { data: result, error } = await supabase
      .from('staff_permissions')
      .select('capability_id')
      .eq('staff_id', staffId)
      .eq('granted', true);

    if (error) {
      console.error('Error fetching staff permissions:', error);
      return [];
    }

    return result.map(row => row.capability_id);
  } catch (error) {
    console.error('Error fetching staff permissions:', error);
    return [];
  }
};

// Get current staff member's profile
export const getStaffProfile = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.user?.id || req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: staffProfile, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) {
      console.error('Error fetching staff profile:', error);
      return res.status(404).json({ error: 'Staff profile not found' });
    }

    // Remove sensitive data
    const { password_hash, ...safeProfile } = staffProfile;

    res.json(safeProfile);
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({ error: 'Failed to fetch staff profile' });
  }
};

// Update current staff member's profile
export const updateStaffProfile = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.user?.id || req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Only allow updating certain fields
    const {
      phone,
      bio,
      skills,
      certifications,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship
    } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Only add fields that were provided
    if (phone !== undefined) updateData.phone = phone;
    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (emergency_contact_name !== undefined) updateData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone !== undefined) updateData.emergency_contact_phone = emergency_contact_phone;
    if (emergency_contact_relationship !== undefined) updateData.emergency_contact_relationship = emergency_contact_relationship;

    const { data: updatedProfile, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single();

    if (error) {
      console.error('Error updating staff profile:', error);
      return res.status(500).json({ error: 'Failed to update staff profile' });
    }

    // Remove sensitive data
    const { password_hash, ...safeProfile } = updatedProfile;

    res.json(safeProfile);
  } catch (error) {
    console.error('Error updating staff profile:', error);
    res.status(500).json({ error: 'Failed to update staff profile' });
  }
};

// Upload staff profile photo
export const uploadStaffProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const staffId = req.user?.id || req.user?.userId;

    if (!staffId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const filename = `staff/${staffId}/${Date.now()}.${fileExtension}`;

    // Upload to Supabase storage (using existing message_attachments bucket for now)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('message_attachments')
      .upload(filename, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file' });
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('message_attachments')
      .getPublicUrl(filename);

    // Update staff profile with new photo URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('staff')
      .update({
        profile_photo: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating staff photo:', updateError);
      // Try to delete the uploaded file if profile update fails
      await supabase.storage.from('message_attachments').remove([filename]);
      return res.status(500).json({ error: 'Failed to update profile photo' });
    }

    // Remove sensitive data
    const { password_hash, ...safeProfile } = updatedProfile;

    res.json({
      success: true,
      profile_photo: publicUrl,
      message: 'Profile photo updated successfully'
    });
  } catch (error) {
    console.error('Error uploading staff photo:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
};