/*
  # Sistema de Gestión de Estadía Hospitalaria - Hospital UC

  1. New Tables
    - `patients`
      - `id` (uuid, primary key)
      - `rut` (text, unique, índice de identificación del paciente)
      - `nombre` (text, nombre del paciente)
      - `apellido_paterno` (text, apellido paterno)
      - `apellido_materno` (text, apellido materno) 
      - `edad` (integer, edad del paciente)
      - `sexo` (text, M o F)
      - `servicio_clinico` (text, servicio donde está hospitalizado)
      - `fecha_ingreso` (timestamptz, fecha y hora de ingreso)
      - `fecha_estimada_alta` (timestamptz, fecha estimada de alta)
      - `dias_hospitalizacion` (integer, días hospitalizado calculado)
      - `diagnostico_principal` (text, diagnóstico principal del paciente)
      - `riesgo_social` (text, evaluación de riesgo social: bajo/medio/alto)
      - `riesgo_clinico` (text, evaluación de riesgo clínico: bajo/medio/alto)
      - `riesgo_administrativo` (text, evaluación de riesgo administrativo: bajo/medio/alto)
      - `nivel_riesgo_global` (text, semáforo global: verde/amarillo/rojo)
      - `estado` (text, estado del paciente: activo/alta_pendiente/dado_alta)
      - `prevision` (text, sistema de salud del paciente)
      - `created_at` (timestamptz, fecha de creación del registro)
      - `updated_at` (timestamptz, fecha de última actualización)

    - `patient_notes`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `user_name` (text, nombre del usuario que registra)
      - `user_role` (text, rol del usuario)
      - `tipo_gestion` (text, tipo de gestión: social/clinica/administrativa/general)
      - `nota` (text, contenido de la nota o gestión)
      - `fecha_gestion` (timestamptz, fecha y hora de la gestión)
      - `created_at` (timestamptz, fecha de creación del registro)

    - `alerts`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, foreign key to patients)
      - `tipo_alerta` (text, tipo: estadia_prolongada/riesgo_social/riesgo_clinico/riesgo_administrativo)
      - `nivel` (text, nivel de alerta: amarillo/rojo)
      - `mensaje` (text, mensaje descriptivo de la alerta)
      - `activa` (boolean, si la alerta está activa)
      - `created_at` (timestamptz, fecha de creación)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage hospital data
    - Public access for reading data (demo purposes)

  3. Indexes
    - Index on patients.rut for quick patient lookup
    - Index on patients.servicio_clinico for filtering
    - Index on patients.nivel_riesgo_global for risk analysis
    - Index on patient_notes.patient_id for efficient note retrieval
    - Index on alerts.patient_id and alerts.activa for active alerts
*/

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rut text UNIQUE NOT NULL,
  nombre text NOT NULL,
  apellido_paterno text NOT NULL,
  apellido_materno text DEFAULT '',
  edad integer NOT NULL,
  sexo text NOT NULL CHECK (sexo IN ('M', 'F')),
  servicio_clinico text NOT NULL,
  fecha_ingreso timestamptz NOT NULL DEFAULT now(),
  fecha_estimada_alta timestamptz NOT NULL,
  dias_hospitalizacion integer NOT NULL DEFAULT 0,
  diagnostico_principal text NOT NULL,
  riesgo_social text NOT NULL DEFAULT 'bajo' CHECK (riesgo_social IN ('bajo', 'medio', 'alto')),
  riesgo_clinico text NOT NULL DEFAULT 'bajo' CHECK (riesgo_clinico IN ('bajo', 'medio', 'alto')),
  riesgo_administrativo text NOT NULL DEFAULT 'bajo' CHECK (riesgo_administrativo IN ('bajo', 'medio', 'alto')),
  nivel_riesgo_global text NOT NULL DEFAULT 'verde' CHECK (nivel_riesgo_global IN ('verde', 'amarillo', 'rojo')),
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'alta_pendiente', 'dado_alta')),
  prevision text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patient_notes table
CREATE TABLE IF NOT EXISTS patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_role text NOT NULL,
  tipo_gestion text NOT NULL DEFAULT 'general' CHECK (tipo_gestion IN ('social', 'clinica', 'administrativa', 'general')),
  nota text NOT NULL,
  fecha_gestion timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tipo_alerta text NOT NULL CHECK (tipo_alerta IN ('estadia_prolongada', 'riesgo_social', 'riesgo_clinico', 'riesgo_administrativo')),
  nivel text NOT NULL CHECK (nivel IN ('amarillo', 'rojo')),
  mensaje text NOT NULL,
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_rut ON patients(rut);
CREATE INDEX IF NOT EXISTS idx_patients_servicio ON patients(servicio_clinico);
CREATE INDEX IF NOT EXISTS idx_patients_riesgo_global ON patients(nivel_riesgo_global);
CREATE INDEX IF NOT EXISTS idx_patients_estado ON patients(estado);
CREATE INDEX IF NOT EXISTS idx_patient_notes_patient_id ON patient_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_notes_fecha ON patient_notes(fecha_gestion DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_activa ON alerts(activa) WHERE activa = true;

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (demo purposes)
-- In production, these would be restricted to authenticated medical staff

CREATE POLICY "Anyone can read patients" ON patients
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert patients" ON patients
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update patients" ON patients
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can read patient notes" ON patient_notes
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert patient notes" ON patient_notes
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read alerts" ON alerts
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert alerts" ON alerts
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update alerts" ON alerts
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);