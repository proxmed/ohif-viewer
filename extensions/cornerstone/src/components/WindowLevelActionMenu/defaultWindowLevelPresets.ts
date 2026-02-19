// The following are the default window level presets and can be further
// configured via the customization service.
const defaultWindowLevelPresets = {
  CT: [
    { id: 'ct-soft-tissue', description: 'Soft tissue', window: '400', level: '40' },
    { id: 'ct-lung', description: 'Lung', window: '1500', level: '-600' },
    { id: 'ct-liver', description: 'Liver', window: '150', level: '90' },
    { id: 'ct-bone', description: 'Bone', window: '2500', level: '480' },
    { id: 'ct-brain', description: 'Brain', window: '80', level: '40' },
    { id: 'ct-trest', description: 'Trest', window: '1', level: '1' },
    { id: 'ct-testing', description: 'testing', window: '30', level: '40' },
    { id: 'ct-empty2', description: 'Empty2', window: 'Empty2', level: 'Empty2' },
    { id: 'ct-empty3', description: 'Empty3', window: 'Empty3', level: 'Empty3' },
    { id: 'ct-empty4', description: 'Empty4', window: 'Empty4', level: 'Empty4' },
  ],

  PT: [
    { id: 'pt-default', description: 'Default', window: '5', level: '2.5' },
    { id: 'pt-suv-3', description: 'SUV', window: '0', level: '3' },
    { id: 'pt-suv-5', description: 'SUV', window: '0', level: '5' },
    { id: 'pt-suv-7', description: 'SUV', window: '0', level: '7' },
    { id: 'pt-suv-8', description: 'SUV', window: '0', level: '8' },
    { id: 'pt-suv-10', description: 'SUV', window: '0', level: '10' },
    { id: 'pt-suv-15', description: 'SUV', window: '0', level: '15' },
  ],
};

export default defaultWindowLevelPresets;
