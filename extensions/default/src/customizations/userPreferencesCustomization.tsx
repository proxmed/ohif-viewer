import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSystem, hotkeys as hotkeysModule } from '@ohif/core';
import { UserPreferencesModal, FooterAction } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import i18n from '@ohif/i18n';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Input, Label } from '@ohif/ui-next';

const { availableLanguages, defaultLanguage, currentLanguage: currentLanguageFn } = i18n as any;

interface HotkeyDefinition {
  keys: string;
  label: string;
  commandName?: string;
  commandOptions?: {
    id?: string;
    [key: string]: any;
  };
}

interface HotkeyDefinitions {
  [key: string]: HotkeyDefinition;
}

function UserPreferencesModalDefault({ hide }: { hide: () => void }) {
  const { hotkeysManager, servicesManager } = useSystem();
  const { customizationService } = servicesManager.services;
  const { t, i18n: i18nextInstance } = useTranslation('UserPreferencesModal');

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

  const customWLDefinitions = useMemo(
    () =>
      Object.entries(initialHotkeyDefinitions)
        .filter(([, def]) => def.commandName === 'setCustomWindowLevel')
        .map(([id, def]) => ({ id, ...def })),
    [initialHotkeyDefinitions]
  );

  const getSavedWLs = useCallback(() => {
    const customizations = customizationService.getCustomization('customWindowLevels');
    if (customizations?.value) {
      return customizations.value;
    }
    const wls = {};
    customWLDefinitions.forEach(def => {
      const presetId = def.commandOptions?.id || 'custom1';
      try {
        const saved = localStorage.getItem(`ohif.customWindowLevel.${presetId}`);
        wls[presetId] = saved ? JSON.parse(saved) : { window: '400', level: '40' };
      } catch {
        wls[presetId] = { window: '400', level: '40' };
      }
    });
    return wls;
  }, [customWLDefinitions]);

  const [state, setState] = useState(() => ({
    hotkeyDefinitions: initialHotkeyDefinitions,
    languageValue: currentLanguage.value,
    customWLs: getSavedWLs(),
  }));

  const onLanguageChangeHandler = (value: string) => {
    setState(state => ({ ...state, languageValue: value }));
  };

  const onHotkeyChangeHandler = (id: string, newKeys: string) => {
    setState(prev => ({
      ...prev,
      hotkeyDefinitions: {
        ...prev.hotkeyDefinitions,
        [id]: {
          ...prev.hotkeyDefinitions[id],
          keys: newKeys,
        },
      },
    }));
  };

  const onResetHandler = () => {
    const defaultWLs = {};
    customWLDefinitions.forEach((def: any) => {
      const presetId = def.commandOptions?.id || 'custom1';
      defaultWLs[presetId] = { window: '400', level: '40' };
    });

    setState(state => ({
      ...state,
      languageValue: defaultLanguage.value,
      hotkeyDefinitions: resolvedHotkeyDefaults,
      customWLs: defaultWLs,
    }));

    hotkeysManager.restoreDefaultBindings();
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

        <div className="mt-4 border-t border-muted pt-4 space-y-6">
          <div className="flex flex-col space-y-1">
            <UserPreferencesModal.SubHeading>
              {t('Custom Window Levels')}
            </UserPreferencesModal.SubHeading>
            <p className="text-xs text-muted-foreground italic">
              {t('Note: Please enter numeric values only for Window and Level.')}
            </p>
          </div>

          {customWLDefinitions.map(def => {
            const presetId = def.commandOptions?.id;
            const wl = state.customWLs[presetId] || { window: '400', level: '40' };

            return (
              <div
                key={def.id}
                className="flex items-center space-x-8"
              >
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs text-muted-foreground">{t(def.label)} - Window</Label>
                  <Input
                    className="w-24"
                    type="number"
                    value={wl.window}
                    onChange={e => {
                      const value = e.target.value;
                      // Only allow numeric input (or empty for intermediate editing)
                      if (value !== '' && isNaN(Number(value))) {
                        return;
                      }
                      setState(prev => ({
                        ...prev,
                        customWLs: {
                          ...prev.customWLs,
                          [presetId]: { ...wl, window: value },
                        },
                      }));
                    }}
                    placeholder="400"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-xs text-muted-foreground">{t('Level')}</Label>
                  <Input
                    className="w-24"
                    type="number"
                    value={wl.level}
                    onChange={e => {
                      const value = e.target.value;
                      // Only allow numeric input (or empty for intermediate editing)
                      if (value !== '' && isNaN(Number(value))) {
                        return;
                      }
                      setState(prev => ({
                        ...prev,
                        customWLs: {
                          ...prev.customWLs,
                          [presetId]: { ...wl, level: value },
                        },
                      }));
                    }}
                    placeholder="40"
                  />
                </div>
                <div className="flex-1 max-w-xs pt-5">
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
              Object.entries(state.customWLs).forEach(([presetId, wl]: [string, any]) => {
                // Final validation before saving: ensure values are numbers, otherwise use defaults
                const finalWL = {
                  window: isNaN(Number(wl.window)) || wl.window === '' ? '400' : wl.window,
                  level: isNaN(Number(wl.level)) || wl.level === '' ? '40' : wl.level,
                };
                localStorage.setItem(
                  `ohif.customWindowLevel.${presetId}`,
                  JSON.stringify(finalWL)
                );
              });

              hotkeysManager.setHotkeys(Object.values(state.hotkeyDefinitions));
              customizationService.setCustomizations({
                customWindowLevels: {
                  value: state.customWLs,
                },
              }, customizationService.Scope.Global);
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
};
