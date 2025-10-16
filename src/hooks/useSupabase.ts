import { createClient } from '@supabase/supabase-js';
import { Patient, PatientNote, Alert } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const useSupabase = () => {
  const getPatients = async (): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patients:', error);
      return [];
    }
    
    return data || [];
  };

  const getPatientById = async (id: string): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching patient:', error);
      return null;
    }
    
    return data;
  };

  const createPatient = async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from('patients')
      .insert(patient)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating patient:', error);
      return null;
    }
    
    return data;
  };

  const updatePatient = async (id: string, updates: Partial<Patient>): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from('patients')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating patient:', error);
      return null;
    }
    
    return data;
  };

  const getPatientNotes = async (patientId: string): Promise<PatientNote[]> => {
    const { data, error } = await supabase
      .from('patient_notes')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching patient notes:', error);
      return [];
    }
    
    return data || [];
  };

  const createPatientNote = async (note: Omit<PatientNote, 'id' | 'created_at'>): Promise<PatientNote | null> => {
    const { data, error } = await supabase
      .from('patient_notes')
      .insert(note)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating patient note:', error);
      return null;
    }
    
    return data;
  };

  const getActiveAlerts = async (): Promise<Alert[]> => {
    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        patients!inner(nombre, apellido_paterno, rut, servicio_clinico)
      `)
      .eq('activa', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }
    
    return data || [];
  };

  return {
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    getPatientNotes,
    createPatientNote,
    getActiveAlerts
  };
};