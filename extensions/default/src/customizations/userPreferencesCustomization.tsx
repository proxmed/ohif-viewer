import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSystem, hotkeys as hotkeysModule } from '@ohif/core';
import { UserPreferencesModal, FooterAction } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import i18n from '@ohif/i18n';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
  Label,
} from '@ohif/ui-next';

const { availableLanguages, defaultLanguage, currentLanguage: currentLanguageFn } = i18n;

interface HotkeyDefinition {
  keys: string;
  label: string;
  commandName?: string;
  commandOptions?: { id?: string; [key: string]: unknown };
}

interface CustomWindowLevel {
  window: string;
  level: string;
}

const DEFAULT_CUSTOM_WL: CustomWindowLevel = { window: '400', level: '40' };
const CUSTOM_WL_STORAGE_PREFIX = 'ohif.customWindowLevel.';

interface HotkeyDefinitions {
  [key: string]: HotkeyDefinition;
}

const MODIFIER_OPTIONS = [
  { value: '16', label: 'Shift' },
  { value: '17', label: 'Ctrl' },
  { value: '18', label: 'Alt' },
  { value: '91', label: 'Meta' },
];

const DEFAULT_TOOL_BINDINGS_STORAGE_KEY = 'user-preferred-tool-bindings';

function getToolModifier(
  toolGroupService: any,
  toolGroupId: string,
  toolName: string,
  mouseButton: number
): string | null {
  if (!toolGroupService) {
    return null;
  }
  const bindings = toolGroupService.getToolBindings(toolGroupId, toolName);
  if (!bindings?.length) {
    return null;
  }
  const modifierBinding = bindings.find(
    binding =>
      binding.mouseButton === mouseButton &&
      binding.modifierKey != null &&
      binding.numTouchPoints == null
  );

  return modifierBinding?.modifierKey != null ? String(modifierBinding.modifierKey) : null;
}

function getModifierFromBindings(
  bindings: Array<Record<string, unknown>> | undefined,
  mouseButton: number
): string | null {
  if (!bindings?.length) {
    return null;
  }

  const modifierBinding = bindings.find(
    binding =>
      binding.mouseButton === mouseButton &&
      binding.modifierKey != null &&
      binding.numTouchPoints == null
  );

  return modifierBinding?.modifierKey != null ? String(modifierBinding.modifierKey) : null;
}

function UserPreferencesModalDefault({ hide }: { hide: () => void }) {
  const { hotkeysManager, servicesManager } = useSystem();
  const { t, i18n: i18nextInstance } = useTranslation('UserPreferencesModal');
  const toolGroupService = (servicesManager as any)?.services?.toolGroupService;
  const { customizationService } = servicesManager.services;

  const { hotkeyDefinitions = {}, hotkeyDefaults = {} } = hotkeysManager;

  const fallbackHotkeyDefinitions = useMemo(
    () =>
      hotkeysManager.getValidHotkeyDefinitions(
        hotkeysModule.defaults.hotkeyBindings
      ) as HotkeyDefinitions,
    [hotkeysManager]
  );

  useEffect(() => {
    if (!Object.keys(hotkeyDefaults).length) {
      hotkeysManager.setDefaultHotKeys(hotkeysModule.defaults.hotkeyBindings);
    }

    if (!Object.keys(hotkeyDefinitions).length) {
      hotkeysManager.setHotkeys(fallbackHotkeyDefinitions);
    }
  }, [hotkeysManager, hotkeyDefaults, hotkeyDefinitions, fallbackHotkeyDefinitions]);

  const resolvedHotkeyDefaults = Object.keys(hotkeyDefaults).length
    ? (hotkeyDefaults as HotkeyDefinitions)
    : fallbackHotkeyDefinitions;

  const initialHotkeyDefinitions = Object.keys(hotkeyDefinitions).length
    ? (hotkeyDefinitions as HotkeyDefinitions)
    : resolvedHotkeyDefaults;

  const currentLanguage = currentLanguageFn();

  const initialCrosshairModifier = useMemo(
    () => getToolModifier(toolGroupService, 'mpr', 'Crosshairs', 1),
    [toolGroupService]
  );
  const defaultCrosshairBindings = useMemo(
    () => toolGroupService?.getDefaultToolBindings?.('mpr', 'Crosshairs'),
    [toolGroupService]
  );

  const customWLDefinitions = useMemo(
    () =>
      Object.entries(initialHotkeyDefinitions)
        .filter(([, def]) => def.commandName === 'setCustomWindowLevel')
        .map(([id, def]) => ({ id, ...def })),
    [initialHotkeyDefinitions]
  );

  const getDefaultWLs = useCallback(() => {
    const wls: Record<string, CustomWindowLevel> = {};
    customWLDefinitions.forEach(def => {
      wls[def.commandOptions?.id || 'custom1'] = DEFAULT_CUSTOM_WL;
    });
    return wls;
  }, [customWLDefinitions]);

  const getSavedWLs = useCallback(() => {
    const customization = customizationService.getCustomization('customWindowLevels') as
      | { value?: Record<string, CustomWindowLevel> }
      | undefined;
    if (customization?.value) {
      return customization.value;
    }
    const wls = getDefaultWLs();
    Object.keys(wls).forEach(presetId => {
      try {
        const saved = localStorage.getItem(`${CUSTOM_WL_STORAGE_PREFIX}${presetId}`);
        if (saved) {
          wls[presetId] = JSON.parse(saved);
        }
      } catch {
        // keep default
      }
    });
    return wls;
  }, [customizationService, getDefaultWLs]);

  const [state, setState] = useState(() => ({
    hotkeyDefinitions: initialHotkeyDefinitions,
    languageValue: currentLanguage.value,
    crosshairModifier: initialCrosshairModifier,
    customWLs: getSavedWLs(),
  }));

  const onCustomWLChangeHandler = (
    presetId: string,
    field: keyof CustomWindowLevel,
    value: string
  ) => {
    // Only allow numeric input (or empty for intermediate editing)
    if (value !== '' && isNaN(Number(value))) {
      return;
    }
    setState(prev => ({
      ...prev,
      customWLs: {
        ...prev.customWLs,
        [presetId]: { ...(prev.customWLs[presetId] || DEFAULT_CUSTOM_WL), [field]: value },
      },
    }));
  };

  const onLanguageChangeHandler = (value: string) => {
    setState(state => ({ ...state, languageValue: value }));
  };

  const onHotkeyChangeHandler = (id: string, newKeys: string) => {
    setState(state => ({
      ...state,
      hotkeyDefinitions: {
        ...state.hotkeyDefinitions,
        [id]: {
          ...state.hotkeyDefinitions[id],
          keys: newKeys,
        },
      },
    }));
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      languageValue: defaultLanguage.value,
      hotkeyDefinitions: resolvedHotkeyDefaults,
      crosshairModifier: getModifierFromBindings(defaultCrosshairBindings, 1),
      customWLs: getDefaultWLs(),
    }));

    hotkeysManager.restoreDefaultBindings();
    if (toolGroupService && defaultCrosshairBindings?.length) {
      toolGroupService.setToolBindings('mpr', 'Crosshairs', defaultCrosshairBindings);
      toolGroupService.applyToolBindings('mpr', 'Crosshairs', {
        replaceExisting: true,
      });
    }
    toolGroupService?.removePersistedToolBindings('mpr', 'Crosshairs');
  };

  const displayNames = React.useMemo(() => {
    if (typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
      return null;
    }

    const locales = [state.languageValue, currentLanguage.value, i18nextInstance.language, 'en'];
    const uniqueLocales = Array.from(new Set(locales.filter(Boolean)));

    try {
      return new Intl.DisplayNames(uniqueLocales, { type: 'language', fallback: 'none' });
    } catch (error) {
      console.warn('Intl.DisplayNames not supported for locales', uniqueLocales, error);
    }

    return null;
  }, [state.languageValue, currentLanguage.value, i18nextInstance.language]);

  const getLanguageLabel = React.useCallback(
    (languageValue: string, fallbackLabel: string) => {
      const translationKey = `LanguageName.${languageValue}`;
      if (i18nextInstance.exists(translationKey, { ns: 'UserPreferencesModal' })) {
        return t(translationKey);
      }

      if (displayNames) {
        try {
          const localized = displayNames.of(languageValue);
          if (localized && localized.toLowerCase() !== languageValue.toLowerCase()) {
            return localized.charAt(0).toUpperCase() + localized.slice(1);
          }
        } catch (error) {
          console.debug(`Unable to resolve display name for ${languageValue}`, error);
        }
      }

      return fallbackLabel;
    },
    [displayNames, i18nextInstance, t]
  );

  return (
    <UserPreferencesModal>
      <UserPreferencesModal.Body>
        {/* Language Section */}
        <div className="mb-3 flex items-center space-x-14">
          <UserPreferencesModal.SubHeading>{t('Language')}</UserPreferencesModal.SubHeading>
          <Select
            defaultValue={state.languageValue}
            onValueChange={onLanguageChangeHandler}
          >
            <SelectTrigger
              className="w-60"
              aria-label="Language"
            >
              <SelectValue placeholder={t('Select language')} />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map(lang => (
                <SelectItem
                  key={lang.value}
                  value={lang.value}
                >
                  {getLanguageLabel(lang.value, lang.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <UserPreferencesModal.SubHeading>{t('Hotkeys')}</UserPreferencesModal.SubHeading>
        <UserPreferencesModal.HotkeysGrid>
          {Object.entries(state.hotkeyDefinitions)
            .filter(([, definition]) => definition.commandName !== 'setCustomWindowLevel')
            .map(([id, definition]) => (
              <UserPreferencesModal.Hotkey
                key={id}
                label={t(definition.label)}
                value={definition.keys}
                onChange={newKeys => onHotkeyChangeHandler(id, newKeys)}
                placeholder={definition.keys}
                hotkeys={hotkeysModule}
              />
            ))}
        </UserPreferencesModal.HotkeysGrid>

        {customWLDefinitions.length > 0 && (
          <div className="border-muted mt-4 space-y-6 border-t pt-4">
            <div className="flex flex-col space-y-1">
              <UserPreferencesModal.SubHeading>
                {t('Custom Window Levels')}
              </UserPreferencesModal.SubHeading>
              <p className="text-muted-foreground text-xs italic">
                {t('Note: Please enter numeric values only for Window and Level.')}
              </p>
            </div>

            {customWLDefinitions.map(def => {
              const presetId = def.commandOptions?.id || 'custom1';
              const wl = state.customWLs[presetId] || DEFAULT_CUSTOM_WL;

              return (
                <div
                  key={def.id}
                  className="flex items-center space-x-8"
                >
                  <div className="flex flex-col space-y-1">
                    <Label className="text-muted-foreground text-xs">
                      {t(def.label)} - {t('Window')}
                    </Label>
                    <Input
                      className="w-24"
                      type="number"
                      value={wl.window}
                      onChange={e => onCustomWLChangeHandler(presetId, 'window', e.target.value)}
                      placeholder={DEFAULT_CUSTOM_WL.window}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label className="text-muted-foreground text-xs">{t('Level')}</Label>
                    <Input
                      className="w-24"
                      type="number"
                      value={wl.level}
                      onChange={e => onCustomWLChangeHandler(presetId, 'level', e.target.value)}
                      placeholder={DEFAULT_CUSTOM_WL.level}
                    />
                  </div>
                  <div className="max-w-xs flex-1 pt-5">
                    <UserPreferencesModal.Hotkey
                      label={t('Hotkey')}
                      value={state.hotkeyDefinitions[def.id]?.keys}
                      onChange={newKeys => onHotkeyChangeHandler(def.id, newKeys)}
                      placeholder={state.hotkeyDefinitions[def.id]?.keys}
                      hotkeys={hotkeysModule}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {state.crosshairModifier != null && (
          <>
            <UserPreferencesModal.SubHeading>
              {t('ModifierKeys', { defaultValue: 'Modifier Keys' })}
            </UserPreferencesModal.SubHeading>
            <UserPreferencesModal.HotkeysGrid>
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground text-base">
                  {t('CrosshairsModifier', { defaultValue: 'Crosshairs' })}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground text-sm">
                    {t('PlusLeftClick', { defaultValue: 'Left Click +' })}
                  </span>
                  <Select
                    value={state.crosshairModifier}
                    onValueChange={val => setState(s => ({ ...s, crosshairModifier: val }))}
                  >
                    <SelectTrigger className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODIFIER_OPTIONS.map(opt => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </UserPreferencesModal.HotkeysGrid>
          </>
        )}
      </UserPreferencesModal.Body>
      <FooterAction>
        <FooterAction.Left>
          <FooterAction.Auxiliary onClick={onResetHandler}>
            {t('Reset to defaults')}
          </FooterAction.Auxiliary>
        </FooterAction.Left>
        <FooterAction.Right>
          <FooterAction.Secondary
            onClick={() => {
              hotkeysModule.stopRecord();
              hotkeysModule.unpause();
              hide();
            }}
          >
            {t('Cancel')}
          </FooterAction.Secondary>
          <FooterAction.Primary
            onClick={() => {
              if (state.languageValue !== currentLanguage.value) {
                i18n.changeLanguage(state.languageValue);
                // Force page reload after language change to ensure all translations are applied
                window.location.reload();
                return; // Exit early since we're reloading
              }
              hotkeysManager.setHotkeys(state.hotkeyDefinitions);

              // Final validation before saving: ensure values are numbers, otherwise use defaults
              const customWLs: Record<string, CustomWindowLevel> = {};
              Object.entries(state.customWLs).forEach(([presetId, wl]) => {
                customWLs[presetId] = {
                  window:
                    wl.window === '' || isNaN(Number(wl.window))
                      ? DEFAULT_CUSTOM_WL.window
                      : wl.window,
                  level:
                    wl.level === '' || isNaN(Number(wl.level)) ? DEFAULT_CUSTOM_WL.level : wl.level,
                };
                localStorage.setItem(
                  `${CUSTOM_WL_STORAGE_PREFIX}${presetId}`,
                  JSON.stringify(customWLs[presetId])
                );
              });
              customizationService.setCustomizations(
                { customWindowLevels: { value: customWLs } },
                customizationService.Scope.Global
              );

              if (toolGroupService && state.crosshairModifier != null) {
                const bindings = [{ mouseButton: 1, modifierKey: Number(state.crosshairModifier) }];
                toolGroupService.setToolBindings('mpr', 'Crosshairs', bindings);
                toolGroupService.applyToolBindings('mpr', 'Crosshairs', {
                  replaceExisting: true,
                });
                toolGroupService.persistToolBindings('mpr', 'Crosshairs', bindings);
              }

              hotkeysModule.stopRecord();
              hotkeysModule.unpause();
              hide();
            }}
          >
            {t('Save')}
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </UserPreferencesModal>
  );
}

export default {
  'ohif.userPreferencesModal': UserPreferencesModalDefault,
  'ohif.userPreferences.toolBindingsStorageKey': DEFAULT_TOOL_BINDINGS_STORAGE_KEY,
};
