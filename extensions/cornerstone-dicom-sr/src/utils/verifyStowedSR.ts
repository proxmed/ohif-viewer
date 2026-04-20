import OHIF from '@ohif/core';

const { log } = OHIF;

type VerifyArgs = {
  StudyInstanceUID: string;
  SeriesInstanceUID: string;
  dataSource: {
    query?: { series?: { search?: (studyInstanceUid: string) => Promise<any[]> } };
  };
  timeoutMs?: number;
  intervalMs?: number;
};

/**
 * Poll QIDO until the freshly STOW'd SR series appears in the study's series
 * list, or the timeout expires. Used to detect AHI's DICOMweb proxy indexing
 * failure after STOW (see testdata/AUS002-001-SR/AHI_DICOMWEB_BUG_REPORT.md).
 *
 * Returns `{ indexed: true }` as soon as the SR series is found. Returns
 * `{ indexed: false }` on timeout. Never throws — callers treat a false result
 * as a soft warning, not a fatal error.
 */
export async function verifyStowedSR({
  StudyInstanceUID,
  SeriesInstanceUID,
  dataSource,
  timeoutMs = 6000,
  intervalMs = 1000,
}: VerifyArgs): Promise<{ indexed: boolean }> {
  const search = dataSource?.query?.series?.search;
  if (typeof search !== 'function') {
    return { indexed: true };
  }

  const deadline = Date.now() + timeoutMs;
  let firstAttempt = true;

  while (Date.now() < deadline) {
    if (!firstAttempt) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    firstAttempt = false;

    try {
      const series = await search(StudyInstanceUID);
      const hit = Array.isArray(series)
        ? series.find(s => s?.SeriesInstanceUID === SeriesInstanceUID)
        : null;
      if (hit) {
        return { indexed: true };
      }
    } catch (error) {
      log.warn(`[DICOMSR] verifyStowedSR poll error: ${(error as Error)?.message}`);
    }
  }

  return { indexed: false };
}
