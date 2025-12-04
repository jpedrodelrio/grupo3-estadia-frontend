/**
 * Tipos relacionados con el endpoint de personas resumen
 */

export interface PersonaResumen {
  episodio: string;
  nombre: string;
  sexo: string;
  fecha_de_nacimiento: string;
  tipo_cuenta_1: string;
  tipo_cuenta_2: string | null;
  tipo_cuenta_3: string | null;
  fecha_admision: string | null;
  convenio: string | null;
  nombre_de_la_aseguradora: string | null;
  valor_parcial: string | null;
  dias_hospitalizacion: number | null;
  ultima_cama: string | null;
  rut: string;
  fecha_alta: string | null;
  prob_sobre_estadia: number | null;
  grd_code: string | null;
  riesgo_social: string | null;
  riesgo_clinico: string | null;
  riesgo_administrativo: string | null;
}

export interface PersonasResumenResponse {
  count: number;
  results: PersonaResumen[];
}
