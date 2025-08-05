# ACT Coaching For Life - Database Setup

This directory contains the complete database schema and sample data for the ACT Coaching For Life therapist matching platform.

## Files

- `schema.sql` - Complete database schema with tables, indexes, triggers, and security policies
- `sample_data.sql` - Sample data for testing and development
- `README.md` - This file with setup instructions

## Database Architecture

The database is designed for Supabase (PostgreSQL) and includes:

### Core Tables
1. **users** - Authentication and user management
2. **clients** - Client profiles and information
3. **coaches** - Coach profiles and capabilities
4. **sessions** - Appointments and session management
5. **client_assessments** - Detailed client preferences for matching
6. **coach_demographics** - Coach demographics for detailed matching

### Supporting Tables
7. **saved_coaches** - Client's saved/favorite coaches
8. **messages** - Communication system
9. **reviews** - Session reviews and ratings
10. **search_history** - Search analytics
11. **admin_actions** - Administrative actions
12. **system_settings** - Configurable system settings

## Setup Instructions

### 1. Supabase Project Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Note your project URL and service role key

### 2. Run Database Schema
1. In your Supabase dashboard, go to SQL Editor
2. Create a new query
3. Copy the entire contents of `schema.sql`
4. Run the query to create all tables, indexes, and policies

### 3. Add Sample Data (Optional)
1. In the SQL Editor, create another new query
2. Copy the entire contents of `sample_data.sql`
3. Run the query to populate tables with sample data

### 4. Configure Environment Variables
Update your backend `.env` file with:
```env
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Database Features

### Security
- **Row Level Security (RLS)** enabled on all tables
- **Role-based access control** (client, coach, admin)
- **Data isolation** - users can only access their own data
- **Public coach data** - verified coaches visible to clients

### Performance
- **Optimized indexes** for all common queries
- **GIN indexes** for array and JSONB searches
- **Composite indexes** for complex queries
- **Query optimization** for coach matching algorithm

### Data Integrity
- **Foreign key constraints** maintain referential integrity
- **Check constraints** ensure data validity
- **Unique constraints** prevent data duplication
- **Triggers** for automatic updates (ratings, timestamps)

### Scalability
- **UUID primary keys** for distributed systems
- **JSONB storage** for flexible data structures
- **Array fields** for multi-value attributes
- **Partitioning ready** for large datasets

## Key Relationships

```
users (1:1) clients
users (1:1) coaches
users (1:1) admin_users

clients (1:many) sessions
coaches (1:many) sessions
clients (1:many) client_assessments
coaches (1:1) coach_demographics

clients (many:many) coaches → saved_coaches
sessions (1:many) reviews
users (many:many) users → messages

clients (1:many) search_history
sessions (1:many) messages
```

## Sample Data Included

The sample data includes:
- **1 Admin user** for system management
- **2 Client users** with profiles and assessments
- **8 Coach users** with diverse specialties and demographics
- **3 Sample sessions** showing different statuses
- **2 Reviews** with ratings and feedback
- **Message examples** between clients and coaches
- **Saved coaches** and search history

### Sample Coach Specialties
- Anxiety, Depression, Work Stress
- Trauma, PTSD, Grief
- Relationships, Cultural Identity, LGBTQ+
- Academic Stress, Young Adults
- Addiction Recovery, Substance Abuse
- Eating Disorders, Body Image
- Adolescents, Identity Development

### Sample Demographics
- Diverse gender identities (male, female)
- Multiple ethnicities (white, hispanic, asian, black)
- Various religious backgrounds
- Different insurance providers
- Multiple states covered
- Various availability schedules

## Testing the Setup

After running both SQL files, you can verify the setup:

```sql
-- Check table counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'coaches', COUNT(*) FROM coaches
UNION ALL SELECT 'clients', COUNT(*) FROM clients
UNION ALL SELECT 'sessions', COUNT(*) FROM sessions;

-- Check coach availability
SELECT 
  first_name, 
  last_name, 
  specialties, 
  rating,
  is_verified,
  is_available
FROM coaches 
WHERE is_verified = true 
ORDER BY rating DESC;

-- Test coach search
SELECT 
  c.first_name,
  c.last_name,
  c.specialties,
  c.languages,
  cd.location_states
FROM coaches c
JOIN coach_demographics cd ON c.id = cd.coach_id
WHERE c.is_verified = true 
  AND c.is_available = true
  AND 'Anxiety' = ANY(c.specialties);
```

## Troubleshooting

### Common Issues

1. **Permission Errors**
   - Ensure you're using the service role key for admin operations
   - Check RLS policies if queries return empty results

2. **UUID Generation**
   - Make sure `uuid-ossp` extension is enabled
   - Use `gen_random_uuid()` for new UUIDs

3. **Array Queries**
   - Use `= ANY(array_column)` for array contains queries
   - Use `&& ARRAY['value']` for array overlap queries

4. **JSONB Queries**
   - Use `->` for JSON object access
   - Use `->>` for JSON text value access
   - Use `@>` for JSON contains queries

### Performance Tips

1. **Coach Search Optimization**
   - Use GIN indexes for specialty/language searches
   - Limit results with `LIMIT` clause
   - Use composite indexes for multi-column searches

2. **Session Queries**
   - Index on `(client_id, status)` for client dashboards
   - Index on `(coach_id, scheduled_at)` for coach schedules
   - Use date ranges for efficient time-based queries

3. **Message Queries**
   - Index on `(receiver_id, is_read)` for unread messages
   - Index on `created_at` for chronological ordering

## Maintenance

### Regular Tasks
1. **Update coach ratings** (automated by triggers)
2. **Clean old search history** (optional retention policy)
3. **Archive completed sessions** (for performance)
4. **Monitor database size** and optimize as needed

### Backup Strategy
1. **Daily automated backups** via Supabase
2. **Point-in-time recovery** available
3. **Export critical data** periodically
4. **Test restoration procedures** regularly

## Production Considerations

### Before Going Live
1. **Remove sample data** or clearly mark as test data
2. **Update default passwords** and use proper hashing
3. **Configure proper email verification**
4. **Set up monitoring and alerts**
5. **Review and adjust RLS policies**
6. **Enable audit logging** for compliance

### Security Checklist
- [ ] All passwords properly hashed
- [ ] RLS enabled on all tables
- [ ] Service keys properly secured
- [ ] Admin access restricted
- [ ] Regular security audits scheduled
- [ ] Backup encryption enabled

This database schema provides a solid foundation for the ACT Coaching For Life platform with room for future enhancements and scaling.