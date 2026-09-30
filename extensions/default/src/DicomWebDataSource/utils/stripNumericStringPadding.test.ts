import dcmjs from 'dcmjs';
import toNumber from '@ohif/core/src/utils/toNumber';
import { stripNumericStringPadding } from './stripNumericStringPadding';

const { naturalizeDataset } = dcmjs.data.DicomMetaDictionary;

const mistarInstance = () => ({
  '00200032': { vr: 'DS', Value: ['-111.92232', '-112.02118', '3.0231841\u0000'] },
  '00281052': { vr: 'DS', Value: ['0.0 '] },
  '00281053': { vr: 'DS', Value: ['1.00000\u0000'] },
  '00200013': { vr: 'IS', Value: ['7\u0000'] },
  '0008103E': { vr: 'LO', Value: ['rCBV\u0000'] },
  '52009230': {
    vr: 'SQ',
    Value: [
      {
        '00289110': {
          vr: 'SQ',
          Value: [{ '00280030': { vr: 'DS', Value: ['1.75\u0000', '1.75'] } }],
        },
      },
    ],
  },
});

describe('stripNumericStringPadding', () => {
  it('lets NUL-padded DS and IS values parse as numbers', () => {
    const naturalized = naturalizeDataset(stripNumericStringPadding(mistarInstance()));

    expect(toNumber(naturalized.RescaleSlope)).toBe(1);
    expect(toNumber(naturalized.RescaleIntercept)).toBe(0);
    expect(toNumber(naturalized.ImagePositionPatient)).toEqual([-111.92232, -112.02118, 3.0231841]);
    expect(toNumber(naturalized.InstanceNumber)).toBe(7);
    expect(
      toNumber(
        naturalized.PerFrameFunctionalGroupsSequence[0].PixelMeasuresSequence[0].PixelSpacing
      )
    ).toEqual([1.75, 1.75]);
  });

  it('leaves non-numeric VRs untouched', () => {
    const naturalized = naturalizeDataset(stripNumericStringPadding(mistarInstance()));

    expect(naturalized.SeriesDescription).toBe('rCBV\u0000');
  });
});
