
'use client';

import { PhoneInput } from '@/components/PhoneInput';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';

// Step Components for Coach Verification Form

export const BasicInformationStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name *
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => onChange('firstName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.firstName ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name *
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.lastName ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
      </div>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Email Address *
      </label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.email ? 'border-red-300' : 'border-gray-300'
        }`}
      />
      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number (Optional)
      </label>
      <PhoneInput
        value={formData.phone}
        onChange={(value) => onChange('phone', value)}
        error={errors.phone}
        placeholder="Enter phone number"
      />
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Password *
      </label>
      <input
        type="password"
        value={formData.password}
        onChange={(e) => onChange('password', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.password ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="Enter a secure password"
      />
      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      <p className="text-xs text-gray-500 mt-1">
        Must contain at least 8 characters, uppercase, lowercase, and number
      </p>
    </div>
    
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Confirm Password *
      </label>
      <input
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => onChange('confirmPassword', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
        }`}
        placeholder="Confirm your password"
      />
      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
    </div>
  </div>
);

export const ProfessionalBackgroundStep = ({ formData, onChange, onArrayChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 1: Educational Background */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        1. What is your educational background? *
      </label>
      <div className="space-y-2">
        {[
          'High School Diploma',
          'Associate\'s Degree',
          'Bachelor\'s Degree',
          'Master\'s Degree',
          'Doctoral Degree',
          'Other'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="educationalBackground"
              value={option}
              checked={formData.educationalBackground === option}
              onChange={(e) => onChange('educationalBackground', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {formData.educationalBackground === 'Other' && (
        <div className="mt-3">
          <input
            type="text"
            value={formData.educationalBackgroundOther || ''}
            onChange={(e) => onChange('educationalBackgroundOther', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            placeholder="Please specify your educational background..."
          />
        </div>
      )}
      {errors.educationalBackground && <p className="text-red-500 text-xs mt-1">{errors.educationalBackground}</p>}
    </div>

    {/* Question 2: Coaching Experience */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        2. How many years of coaching or counseling experience do you have? *
      </label>
      <div className="space-y-2">
        {[
          'Less than 1 year',
          '1-2 years',
          '3-5 years',
          '6-10 years',
          'More than 10 years'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="coachingExperienceYears"
              value={option}
              checked={formData.coachingExperienceYears === option}
              onChange={(e) => onChange('coachingExperienceYears', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.coachingExperienceYears && <p className="text-red-500 text-xs mt-1">{errors.coachingExperienceYears}</p>}
    </div>

    {/* Question 3: Professional Certifications */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        3. Do you hold any professional certifications? (Select all that apply)
      </label>
      <div className="space-y-2">
        {[
          'ICF (International Coach Federation) Certified',
          'Board Certified Coach (BCC)',
          'ACT Training Certificate',
          'Mental Health First Aid',
          'Other coaching certifications',
          'No formal certifications'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.professionalCertifications.includes(option)}
              onChange={(e) => onArrayChange('professionalCertifications', option, e.target.checked)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  </div>
);

export const SpecializationStep = ({ formData, onChange, onArrayChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 4: Areas of Expertise */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        4. What are your primary areas of coaching expertise? (Select up to 5) *
      </label>
      <div className="grid grid-cols-2 gap-2">
        {[
          'Life transitions', 'Career development', 'Relationship coaching', 'Stress management',
          'Anxiety & worry', 'Depression & mood', 'Self-esteem & confidence', 'Work-life balance',
          'Parenting & family', 'Grief & loss', 'Trauma & PTSD', 'Addiction recovery',
          'LGBTQ+ issues', 'Cultural/diversity issues', 'Executive coaching', 'Health & wellness',
          'Financial coaching', 'Spiritual growth', 'Other'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.coachingExpertise.includes(option)}
              onChange={(e) => onArrayChange('coachingExpertise', option, e.target.checked)}
              className="mr-2"
              disabled={!formData.coachingExpertise.includes(option) && formData.coachingExpertise.length >= 5}
            />
            <span className={!formData.coachingExpertise.includes(option) && formData.coachingExpertise.length >= 5 ? 'text-gray-400' : ''}>
              {option}
            </span>
          </label>
        ))}
      </div>
      {formData.coachingExpertise.includes('Other') && (
        <div className="mt-3">
          <input
            type="text"
            value={formData.coachingExpertiseOther || ''}
            onChange={(e) => onChange('coachingExpertiseOther', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            placeholder="Please specify your other areas of expertise..."
          />
        </div>
      )}
      {errors.coachingExpertise && <p className="text-red-500 text-xs mt-1">{errors.coachingExpertise}</p>}
    </div>

    {/* Question 5: Age Groups */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        5. Which age groups are you comfortable working with? (Select all that apply) *
      </label>
      <div className="space-y-2">
        {[
          'Children (6-12)',
          'Adolescents (13-17)',
          'Young adults (18-25)',
          'Adults (26-64)',
          'Seniors (65+)'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.ageGroupsComfortable.includes(option)}
              onChange={(e) => onArrayChange('ageGroupsComfortable', option, e.target.checked)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.ageGroupsComfortable && <p className="text-red-500 text-xs mt-1">{errors.ageGroupsComfortable}</p>}
    </div>

    {/* Question 6: ACT Training */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        6. Have you received specific training in ACT (Acceptance and Commitment Therapy)? *
      </label>
      <div className="space-y-2">
        {[
          'Yes, formal ACT training/certification',
          'Yes, workshop or seminar attendance',
          'Self-study of ACT principles',
          'No, but willing to learn',
          'No ACT experience'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="actTrainingLevel"
              value={option}
              checked={formData.actTrainingLevel === option}
              onChange={(e) => onChange('actTrainingLevel', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.actTrainingLevel && <p className="text-red-500 text-xs mt-1">{errors.actTrainingLevel}</p>}
    </div>
  </div>
);

export const ApproachMethodsStep = ({ formData, onChange, onArrayChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 7: Coaching Philosophy */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        7. Describe your coaching philosophy in 100 words or less: *
      </label>
      <textarea
        value={formData.coachingPhilosophy}
        onChange={(e) => onChange('coachingPhilosophy', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.coachingPhilosophy ? 'border-red-300' : 'border-gray-300'
        }`}
        rows={4}
        maxLength={500}
        placeholder="Describe your approach to coaching and your core beliefs about helping clients..."
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{errors.coachingPhilosophy && <span className="text-red-500">{errors.coachingPhilosophy}</span>}</span>
        <span>{formData.coachingPhilosophy.length}/500 characters</span>
      </div>
    </div>

    {/* Question 8: Coaching Techniques */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        8. Which coaching techniques do you regularly use? (Select all that apply) *
      </label>
      <div className="grid grid-cols-2 gap-2">
        {[
          'Cognitive Behavioral Techniques',
          'Mindfulness practices',
          'Goal setting & action planning',
          'Values clarification',
          'Solution-focused techniques',
          'Motivational interviewing',
          'Positive psychology',
          'Somatic/body-based approaches',
          'Visualization & imagery',
          'Journaling exercises'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.coachingTechniques.includes(option)}
              onChange={(e) => onArrayChange('coachingTechniques', option, e.target.checked)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.coachingTechniques && <p className="text-red-500 text-xs mt-1">{errors.coachingTechniques}</p>}
    </div>

    {/* Question 9: Session Structure */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        9. How do you typically structure your coaching sessions? *
      </label>
      <div className="space-y-2">
        {[
          'Highly structured with specific agendas',
          'Semi-structured with flexibility',
          'Client-led and organic',
          'Varies based on client needs'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="sessionStructure"
              value={option}
              checked={formData.sessionStructure === option}
              onChange={(e) => onChange('sessionStructure', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.sessionStructure && <p className="text-red-500 text-xs mt-1">{errors.sessionStructure}</p>}
    </div>
  </div>
);

export const EthicsBoundariesStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 10: Scope Handling */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        10. How do you handle situations where a client's needs exceed your scope of practice? (200 words max) *
      </label>
      <textarea
        value={formData.scopeHandlingApproach}
        onChange={(e) => onChange('scopeHandlingApproach', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.scopeHandlingApproach ? 'border-red-300' : 'border-gray-300'
        }`}
        rows={4}
        maxLength={1000}
        placeholder="Describe your approach to recognizing limitations and making appropriate referrals..."
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{errors.scopeHandlingApproach && <span className="text-red-500">{errors.scopeHandlingApproach}</span>}</span>
        <span>{formData.scopeHandlingApproach.length}/1000 characters</span>
      </div>
    </div>

    {/* Question 11: Professional Discipline */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        11. Have you ever had any professional licenses suspended, revoked, or disciplined? *
      </label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="professionalDisciplineHistory"
            value="false"
            checked={!formData.professionalDisciplineHistory}
            onChange={() => onChange('professionalDisciplineHistory', false)}
            className="mr-2"
          />
          No
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="professionalDisciplineHistory"
            value="true"
            checked={formData.professionalDisciplineHistory}
            onChange={() => onChange('professionalDisciplineHistory', true)}
            className="mr-2"
          />
          Yes (please explain)
        </label>
      </div>

      {formData.professionalDisciplineHistory && (
        <div className="mt-3">
          <textarea
            value={formData.disciplineExplanation}
            onChange={(e) => onChange('disciplineExplanation', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.disciplineExplanation ? 'border-red-300' : 'border-gray-300'
            }`}
            rows={3}
            placeholder="Please provide details about the disciplinary action..."
          />
          {errors.disciplineExplanation && <p className="text-red-500 text-xs mt-1">{errors.disciplineExplanation}</p>}
        </div>
      )}
    </div>

    {/* Question 12: Boundary Maintenance */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        12. How do you maintain professional boundaries with clients? *
      </label>
      <div className="space-y-2">
        {[
          'Clear communication of boundaries at intake',
          'Regular supervision or consultation',
          'Strict adherence to ethical guidelines',
          'All of the above',
          'Other (please specify)'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="boundaryMaintenanceApproach"
              value={option}
              checked={formData.boundaryMaintenanceApproach === option}
              onChange={(e) => onChange('boundaryMaintenanceApproach', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {formData.boundaryMaintenanceApproach === 'Other (please specify)' && (
        <div className="mt-3">
          <textarea
            value={formData.boundaryMaintenanceOther || ''}
            onChange={(e) => onChange('boundaryMaintenanceOther', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300"
            rows={3}
            placeholder="Please describe how you maintain professional boundaries..."
          />
        </div>
      )}
      {errors.boundaryMaintenanceApproach && <p className="text-red-500 text-xs mt-1">{errors.boundaryMaintenanceApproach}</p>}
    </div>
  </div>
);

export const CrisisManagementStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 13: Suicidal Thoughts Comfort */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        13. Are you comfortable working with clients who may have suicidal thoughts? *
      </label>
      <div className="space-y-2">
        {[
          'Yes, I have training and experience',
          'Yes, but would need additional support',
          'No, I would immediately refer',
          'Prefer not to work with high-risk clients'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="comfortableWithSuicidalThoughts"
              value={option}
              checked={formData.comfortableWithSuicidalThoughts === option}
              onChange={(e) => onChange('comfortableWithSuicidalThoughts', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.comfortableWithSuicidalThoughts && <p className="text-red-500 text-xs mt-1">{errors.comfortableWithSuicidalThoughts}</p>}
    </div>

    {/* Question 14: Self-Harm Protocol */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        14. What is your protocol when a client expresses thoughts of self-harm? (200 words max) *
      </label>
      <textarea
        value={formData.selfHarmProtocol}
        onChange={(e) => onChange('selfHarmProtocol', e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors.selfHarmProtocol ? 'border-red-300' : 'border-gray-300'
        }`}
        rows={4}
        maxLength={1000}
        placeholder="Describe your safety planning approach and immediate response protocol..."
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{errors.selfHarmProtocol && <span className="text-red-500">{errors.selfHarmProtocol}</span>}</span>
        <span>{formData.selfHarmProtocol.length}/1000 characters</span>
      </div>
    </div>
  </div>
);

export const AvailabilityStep = ({ formData, onChange, onArrayChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 15: Weekly Hours */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        15. How many hours per week can you dedicate to coaching on this platform? *
      </label>
      <div className="space-y-2">
        {[
          '5-10 hours',
          '11-20 hours',
          '21-30 hours',
          '31-40 hours',
          'More than 40 hours'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="weeklyHoursAvailable"
              value={option}
              checked={formData.weeklyHoursAvailable === option}
              onChange={(e) => onChange('weeklyHoursAvailable', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.weeklyHoursAvailable && <p className="text-red-500 text-xs mt-1">{errors.weeklyHoursAvailable}</p>}
    </div>

    {/* Question 16: Session Length */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        16. What is your preferred session length? *
      </label>
      <div className="space-y-2">
        {[
          '30 minutes',
          '45 minutes',
          '60 minutes',
          '90 minutes',
          'Flexible based on client needs'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="preferredSessionLength"
              value={option}
              checked={formData.preferredSessionLength === option}
              onChange={(e) => onChange('preferredSessionLength', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.preferredSessionLength && <p className="text-red-500 text-xs mt-1">{errors.preferredSessionLength}</p>}
    </div>

    {/* Question 17: Availability Times */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        17. What times are you generally available? (Select all that apply) *
      </label>
      <div className="grid grid-cols-2 gap-2">
        {[
          'Weekday mornings (6am-12pm)',
          'Weekday afternoons (12pm-5pm)',
          'Weekday evenings (5pm-10pm)',
          'Weekend mornings',
          'Weekend afternoons',
          'Weekend evenings',
          'Late night (10pm-12am)'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.availabilityTimes.includes(option)}
              onChange={(e) => onArrayChange('availabilityTimes', option, e.target.checked)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.availabilityTimes && <p className="text-red-500 text-xs mt-1">{errors.availabilityTimes}</p>}
    </div>
  </div>
);

export const TechnologyStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 18: Video Conferencing Comfort */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        18. Rate your comfort level with video conferencing technology: *
      </label>
      <div className="space-y-2">
        {[
          'Very comfortable - use it regularly',
          'Comfortable - have some experience',
          'Somewhat comfortable - willing to learn',
          'Not comfortable - prefer other methods'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="videoConferencingComfort"
              value={option}
              checked={formData.videoConferencingComfort === option}
              onChange={(e) => onChange('videoConferencingComfort', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.videoConferencingComfort && <p className="text-red-500 text-xs mt-1">{errors.videoConferencingComfort}</p>}
    </div>

    {/* Question 19: Internet Connection */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        19. What is your internet connection quality? *
      </label>
      <div className="space-y-2">
        {[
          'Excellent - high-speed fiber/cable',
          'Good - reliable broadband',
          'Fair - occasional issues',
          'Poor - frequent disconnections'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="radio"
              name="internetConnectionQuality"
              value={option}
              checked={formData.internetConnectionQuality === option}
              onChange={(e) => onChange('internetConnectionQuality', e.target.value)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.internetConnectionQuality && <p className="text-red-500 text-xs mt-1">{errors.internetConnectionQuality}</p>}
    </div>
  </div>
);

export const LanguagesStep = ({ formData, onArrayChange, errors }: any) => (
  <div className="space-y-6">
    {/* Question 20: Languages */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        20. What languages can you provide coaching in fluently? (Select all that apply) *
      </label>
      <div className="grid grid-cols-2 gap-2">
        {[
          'English',
          'Spanish',
          'French',
          'Mandarin',
          'Portuguese',
          'German',
          'Italian',
          'Japanese',
          'Korean',
          'Arabic',
          'Hindi',
          'Russian',
          'Other'
        ].map((option) => (
          <label key={option} className="flex items-center">
            <input
              type="checkbox"
              checked={formData.languagesFluent.includes(option)}
              onChange={(e) => onArrayChange('languagesFluent', option, e.target.checked)}
              className="mr-2"
            />
            {option}
          </label>
        ))}
      </div>
      {errors.languagesFluent && <p className="text-red-500 text-xs mt-1">{errors.languagesFluent}</p>}
    </div>
  </div>
);

export const DocumentsStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-800 mb-2">Professional Documents</h3>
      <p className="text-sm text-blue-700">
        Upload any relevant professional documents to support your application. This step is optional but recommended.
      </p>
    </div>

    <FileUpload
      onFilesChange={(files) => onChange('documents', files)}
      acceptedTypes={['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png']}
      maxFiles={5}
      maxSizePerFile={10}
      label="Upload Professional Documents"
      description="Certifications, licenses, resume, transcripts, or letters of recommendation"
      error={errors.documents}
    />

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="font-medium text-yellow-800 mb-2">Document Guidelines:</h4>
      <ul className="text-sm text-yellow-700 space-y-1">
        <li>• Documents are optional but help speed up the review process</li>
        <li>• Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
        <li>• Maximum 10MB per file, up to 5 files total</li>
        <li>• Ensure documents are clear and legible</li>
        <li>• Remove any sensitive personal information (SSN, etc.)</li>
      </ul>
    </div>
  </div>
);

export const ReferencesStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-blue-800 mb-2">Professional References</h3>
      <p className="text-sm text-blue-700">
        Please provide 2 professional references (not family or friends) who can speak to your coaching abilities and professional character.
      </p>
    </div>

    {formData.references.map((reference: any, index: number) => (
      <div key={index} className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Reference {index + 1}</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={reference.name}
              onChange={(e) => onChange(index, 'name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`reference${index}Name`] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors[`reference${index}Name`] && <p className="text-red-500 text-xs mt-1">{errors[`reference${index}Name`]}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={reference.title}
              onChange={(e) => onChange(index, 'title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`reference${index}Title`] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors[`reference${index}Title`] && <p className="text-red-500 text-xs mt-1">{errors[`reference${index}Title`]}</p>}
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Organization *
          </label>
          <input
            type="text"
            value={reference.organization}
            onChange={(e) => onChange(index, 'organization', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors[`reference${index}Organization`] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors[`reference${index}Organization`] && <p className="text-red-500 text-xs mt-1">{errors[`reference${index}Organization`]}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={reference.email}
              onChange={(e) => onChange(index, 'email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors[`reference${index}Email`] ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors[`reference${index}Email`] && <p className="text-red-500 text-xs mt-1">{errors[`reference${index}Email`]}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={reference.phone}
              onChange={(e) => onChange(index, 'phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const AgreementsStep = ({ formData, onChange, errors }: any) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="font-semibold text-yellow-800 mb-2">Agreement Statements</h3>
      <p className="text-sm text-yellow-700">
        Please read and accept all statements below to complete your application.
      </p>
    </div>

    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      <div className="space-y-4">
        {[
          {
            key: 'termsOfService',
            text: 'I understand that ACT Coaching For Life is a coaching platform and not a substitute for mental health treatment'
          },
          {
            key: 'confidentiality',
            text: 'I agree to maintain client confidentiality except in cases of mandated reporting'
          },
          {
            key: 'scopeOfPractice',
            text: 'I will not provide services outside my scope of training and competence'
          },
          {
            key: 'platformTerms',
            text: 'I agree to platform terms of service and code of conduct'
          },
          {
            key: 'discretionaryApproval',
            text: 'I understand that approval is at the discretion of ACT Coaching For Life'
          },
          {
            key: 'professionalInsurance',
            text: 'I agree to maintain appropriate professional liability insurance (recommended)'
          },
          {
            key: 'responseTime',
            text: 'I will respond to client inquiries within 24-48 hours'
          },
          {
            key: 'refundPolicy',
            text: 'I understand that clients can request refunds under certain circumstances'
          }
        ].map((agreement) => (
          <div key={agreement.key} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id={agreement.key}
                type="checkbox"
                checked={formData.agreementsAccepted[agreement.key]}
                onChange={(e) => onChange(agreement.key, e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor={agreement.key} className="text-gray-700">
                {agreement.text}
              </label>
            </div>
          </div>
        ))}
      </div>

      {errors.agreements && (
        <p className="text-red-500 text-sm mt-2">{errors.agreements}</p>
      )}
    </div>

    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
      <p className="text-xs text-gray-600">
        By submitting this application, you acknowledge that you have read and agree to the{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  </div>
);