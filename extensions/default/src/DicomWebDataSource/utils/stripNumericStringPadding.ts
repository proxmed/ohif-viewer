const NUMERIC_STRING_VRS = new Set(['DS', 'IS']);

/**
 * Some producers pad DS and IS values with NUL instead of the space DICOM
 * requires, and some DICOMweb servers (AWS HealthImaging) pass the NUL through.
 * Number('1.00000\0') is NaN, so strip the padding before naturalizing.
 */
export function stripNumericStringPadding(dataset) {
  for (const element of Object.values(dataset ?? {}) as { vr?: string; Value?: unknown[] }[]) {
    if (!Array.isArray(element?.Value)) {
      continue;
    }
    if (element.vr === 'SQ') {
      element.Value.forEach(stripNumericStringPadding);
    } else if (NUMERIC_STRING_VRS.has(element.vr)) {
      element.Value = element.Value.map(value =>
        typeof value === 'string' ? value.replace(/[\0 ]+$/, '') : value
      );
    }
  }
  return dataset;
}
