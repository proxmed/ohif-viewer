import { cache, metaData } from '@cornerstonejs/core';
import { Types as cstTypes } from '@cornerstonejs/tools';

/**
 * Checks if a labelmap segmentation has exportable data
 * A label map is exportable if it has any pixel data and
 * it is referenced by a display set that is reconstructable.
 *
 * @param labelmap - The labelmap representation data
 * @param displaySetService - The display set service instance
 * @returns boolean - Whether the labelmap has exportable data
 */
export const hasExportableLabelMapData = (
  labelmap: cstTypes.LabelmapSegmentationData | undefined,
  displaySetService: any
): boolean => {
  if (!labelmap) {
    return false;
  }

  const imageIds = labelmap?.imageIds;
  if (!imageIds?.length) {
    return false;
  }

  // We relaxed this to allow exporting bahkan if it's empty
  // as users might want to save an empty template or placeholder.
  const referencedImageIds = labelmap?.referencedImageIds;

  if (!referencedImageIds?.length) {
    return false;
  }

  const firstImageId = referencedImageIds[0];
  const instance = metaData.get('instance', firstImageId);

  if (!instance) {
    // If we can't get metadata, we still might want to allow it if we have imageIds
    return true;
  }

  const SOPInstanceUID = instance.SOPInstanceUID || instance.SopInstanceUID;
  const SeriesInstanceUID = instance.SeriesInstanceUID;
  const displaySet = displaySetService.getDisplaySetForSOPInstanceUID(
    SOPInstanceUID,
    SeriesInstanceUID
  );

  return !!displaySet;
};

/**
 * Checks if a contour segmentation has exportable data
 * A contour is exportable if it has any contour annotation/geometry data.
 *
 * @param contour - The contour representation data
 * @returns boolean - Whether the contour has exportable data
 */
export const hasExportableContourData = (
  contour: cstTypes.ContourSegmentationData | undefined
): boolean => {
  if (!contour) {
    return false;
  }

  const contourAnnotationUIDsMap = contour?.annotationUIDsMap;

  if (!contourAnnotationUIDsMap) {
    return false;
  }

  return contourAnnotationUIDsMap.size > 0;
};
