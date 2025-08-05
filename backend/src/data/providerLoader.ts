import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { STATE_NAMES } from '../constants/states';


const dataDir = __dirname;

export interface Provider {
  name: string;  // Combine First Name + Last Name
  specialties: string[];
  modalities: string[];
  location: string[];
  demographics: {
    gender: string;
    ethnicity: string;
    religion: string;
  };
  availability: number;
  languages: string[];
  bio: string;
  sexualOrientation: string;
  availableTimes: string[];
  paymentMethods: string[];
}

interface CleanedRecord extends ReturnType<typeof cleanRecord> {}

export async function loadProviders(): Promise<Provider[]> {
  const csvPath = path.join(dataDir, 'providers.csv');
  const csvContent = await readFile(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relaxColumnCount: true
  });

  return records
    .map(cleanRecord)
    .filter(isValidProvider)
    .map((record: CleanedRecord) => ({
      name: `${record.firstName} ${record.lastName}`,
      specialties: record.specialties,
      modalities: record.modalities,
      location: record.location,
      demographics: {
        gender: record.gender || 'Not specified',
        ethnicity: record.ethnicity || 'Not specified',
        religion: record.religion || 'Not specified'
      },
      availability: record.availability,
      languages: record.languages,
      bio: record.bio || 'No bio provided',
      sexualOrientation: record.sexualOrientation || 'Not specified',
      availableTimes: record.availableTimes || [],
      paymentMethods: record.paymentMethods || []
    }));
} 

function cleanRecord(record: any) {
  return {
    firstName: (record['First Name'] || '').trim(),
    lastName: (record['Last Name'] || '').trim(),
    specialties: record['Areas of Specialization']
      ? record['Areas of Specialization'].split(',').map((s: string) => s.trim()).filter(Boolean)
      : [],
    modalities: record['Treatment Modality']
      ? record['Treatment Modality'].split(',').map((m: string) => m.trim()).filter(Boolean)
      : [],
    location: record['Location']
      ? record['Location'].split(',')
          .map((l: string) => l.trim())
          .filter(Boolean)
          .map(getFullStateName)
      : [],
    gender: (record['Gender Identity'] || '').trim(),
    ethnicity: (record['Ethnic Identity'] || '').trim(),
    religion: (record['Religious Background'] || '').trim(),
    availability: parseInt(record['No Of Clients Able To Take On']) || 0,
    languages: record['Language']
      ? record['Language'].split(',').map((l: string) => l.trim()).filter(Boolean)
      : [],
    bio: (record['Bio'] || '').trim(),
    sexualOrientation: (record['Sexual Orientation'] || '').trim(),
    availableTimes: record['Available Times']
      ? record['Available Times'].split(',').map((t: string) => t.trim()).filter(Boolean)
      : [],
    paymentMethods: record['Payment Methods']
      ? record['Payment Methods'].split(',').map((p: string) => p.trim()).filter(Boolean)
      : []
  };
}

function getFullStateName(stateCode: string): string {
  const code = stateCode.trim().toUpperCase();
  return STATE_NAMES[code] || stateCode;
}

function isValidProvider(record: ReturnType<typeof cleanRecord>): boolean {
  return (
    record.availability > 0 &&
    record.firstName !== '' &&
    record.lastName !== '' &&
    record.specialties.length > 0
  );
}
