const bindings = [
  {
    commandName: 'setToolActive',
    commandOptions: { toolName: 'Zoom' },
    label: 'Zoom',
    keys: ['z'],
  },
  {
    commandName: 'scaleUpViewport',
    label: 'Zoom In',
    keys: ['+'],
  },
  {
    commandName: 'scaleDownViewport',
    label: 'Zoom Out',
    keys: ['-'],
  },
  {
    commandName: 'fitViewportToWindow',
    label: 'Zoom to Fit',
    keys: ['='],
  },
  {
    commandName: 'rotateViewportCW',
    label: 'Rotate Right',
    keys: ['r'],
  },
  {
    commandName: 'rotateViewportCCW',
    label: 'Rotate Left',
    keys: ['l'],
  },
  {
    commandName: 'flipViewportHorizontal',
    label: 'Flip Horizontally',
    keys: ['h'],
  },
  {
    commandName: 'flipViewportVertical',
    label: 'Flip Vertically',
    keys: ['v'],
  },
  {
    commandName: 'toggleCine',
    label: 'Cine',
    keys: ['c'],
  },
  {
    commandName: 'invertViewport',
    label: 'Invert',
    keys: ['i'],
  },
  {
    commandName: 'incrementActiveViewport',
    label: 'Next Image Viewport',
    keys: ['right'],
  },
  {
    commandName: 'decrementActiveViewport',
    label: 'Previous Image Viewport',
    keys: ['left'],
  },
  {
    commandName: 'updateViewportDisplaySet',
    commandOptions: {
      direction: -1,
    },
    label: 'Previous Series',
    keys: ['pageup'],
  },
  {
    commandName: 'updateViewportDisplaySet',
    commandOptions: {
      direction: 1,
    },
    label: 'Next Series',
    keys: ['pagedown'],
  },
  {
    commandName: 'nextStage',
    context: 'DEFAULT',
    label: 'Next Stage',
    keys: ['.'],
  },
  {
    commandName: 'previousStage',
    context: 'DEFAULT',
    label: 'Previous Stage',
    keys: [','],
  },
  {
    commandName: 'nextImage',
    label: 'Next Image',
    keys: ['down'],
  },
  {
    commandName: 'previousImage',
    label: 'Previous Image',
    keys: ['up'],
  },
  {
    commandName: 'firstImage',
    label: 'First Image',
    keys: ['home'],
  },
  {
    commandName: 'lastImage',
    label: 'Last Image',
    keys: ['end'],
  },
  {
    commandName: 'resetViewport',
    label: 'Reset',
    keys: ['space'],
  },
  {
    commandName: 'cancelMeasurement',
    label: 'Cancel Measurement',
    keys: ['esc'],
  },
  {
    commandName: 'setWindowLevelPreset',
    commandOptions: { presetName: 'ct-soft-tissue', presetIndex: 0 },
    label: 'W/L Soft Tissue',
    keys: ['1'],
  },
  {
    commandName: 'setWindowLevelPreset',
    commandOptions: { presetName: 'ct-lung', presetIndex: 1 },
    label: 'W/L Lung',
    keys: ['2'],
  },
  {
    commandName: 'setWindowLevelPreset',
    commandOptions: { presetName: 'ct-bone', presetIndex: 2 },
    label: 'W/L Bone',
    keys: ['3'],
  },
  {
    commandName: 'setWindowLevelPreset',
    commandOptions: { presetName: 'ct-brain', presetIndex: 3 },
    label: 'W/L Brain',
    keys: ['4'],
  },
  {
    commandName: 'setCustomWindowLevel',
    commandOptions: { id: 'custom1' },
    label: 'Custom Window Level 1',
    keys: ['alt+1'],
  },
  {
    commandName: 'setCustomWindowLevel',
    commandOptions: { id: 'custom2' },
    label: 'Custom Window Level 2',
    keys: ['alt+2'],
  },
  {
    commandName: 'setCustomWindowLevel',
    commandOptions: { id: 'custom3' },
    label: 'Custom Window Level 3',
    keys: ['alt+3'],
  },
  {
    commandName: 'setCustomWindowLevel',
    commandOptions: { id: 'custom4' },
    label: 'Custom Window Level 4',
    keys: ['alt+4'],
  },
  {
    commandName: 'setCustomWindowLevel',
    commandOptions: { id: 'custom5' },
    label: 'Custom Window Level 5',
    keys: ['alt+5'],
  },
  {
    commandName: 'deleteActiveAnnotation',
    label: 'Delete Annotation',
    keys: ['backspace'],
  },
  {
    commandName: 'acceptPreview',
    label: 'Accept Preview',
    keys: ['enter'],
  },
  {
    commandName: 'rejectPreview',
    label: 'Reject Preview',
    keys: ['esc'],
  },
  {
    commandName: 'undo',
    label: 'Undo',
    keys: ['ctrl+z'],
  },
  {
    commandName: 'redo',
    label: 'Redo',
    keys: ['ctrl+y'],
  },
  {
    commandName: 'interpolateScrollForMarkerLabelmap',
    label: 'Interpolate Scroll',
    keys: ['n'],
  },
  {
    commandName: 'increaseBrushSize',
    label: 'Increase Brush Size',
    keys: [']'],
  },
  {
    commandName: 'decreaseBrushSize',
    label: 'Decrease Brush Size',
    keys: ['['],
  },
  {
    commandName: 'setToolActive',
    commandOptions: { toolName: 'CircularEraser' },
    label: 'Eraser',
    keys: ['e'],
  },
  {
    commandName: 'setToolActive',
    commandOptions: { toolName: 'CircularBrush' },
    label: 'Brush',
    keys: ['b'],
  },
  {
    commandName: 'addNewSegment',
    label: 'Add New Segment',
    keys: ['a'],
  },
];

export default bindings;
