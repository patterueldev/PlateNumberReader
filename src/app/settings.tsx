import { Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

import { downloadTextFile, pickTextFile } from '@/files/files';
import { clearVehicles, exportVehiclesJson, importVehiclesJson } from '@/storage/vehicles';
import { AppButton, Card, LinkRow, Screen, SectionTitle } from '@/ui/components';
import { confirmAction, notify } from '@/ui/dialog';
import { useTheme } from '@/ui/theme';

export default function SettingsScreen() {
  const c = useTheme();

  const exportBackup = async () => {
    const json = await exportVehiclesJson();
    downloadTextFile('platenumberreader-backup.json', json, 'application/json');
  };

  const importBackup = async () => {
    const json = await pickTextFile();
    if (!json) return;
    try {
      const count = await importVehiclesJson(json, 'merge');
      notify('Import complete', `${count} vehicle${count === 1 ? '' : 's'} imported.`);
    } catch (error) {
      notify('Import failed', error instanceof Error ? error.message : 'Could not read that file.');
    }
  };

  const clearAll = () => {
    confirmAction('Clear all data', 'Delete every vehicle stored on this device?', () => {
      void (async () => {
        await clearVehicles();
        notify('Cleared', 'All vehicles were removed.');
      })();
    });
  };

  return (
    <Screen>
      <SectionTitle>Data</SectionTitle>
      <Card>
        <AppButton title="Export backup (.json)" variant="secondary" onPress={() => void exportBackup()} />
        <AppButton title="Import backup" variant="secondary" onPress={() => void importBackup()} />
        <AppButton title="Clear all data" variant="danger" onPress={clearAll} />
        <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 18 }}>
          Everything stays on this device. Backups are plain JSON files you can move between browsers and
          phones.
        </Text>
      </Card>

      <SectionTitle>Reminders</SectionTitle>
      <Card>
        <Text style={{ color: c.textSecondary, fontSize: 13, lineHeight: 19 }}>
          On the web app, reminders are delivered through the calendar export on each vehicle page
          (.ics files work with Google Calendar, Apple Calendar, and Outlook). Scheduled push notifications
          require the native app, where local notifications work fully offline.
        </Text>
      </Card>

      <SectionTitle>About</SectionTitle>
      <Card>
        <View style={{ gap: 2 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>PlateNumberReader</Text>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            Version {Constants.expoConfig?.version ?? '1.0.0'}
          </Text>
        </View>
        <LinkRow
          title="LTMS portal"
          subtitle="portal.lto.gov.ph"
          onPress={() => void WebBrowser.openBrowserAsync('https://portal.lto.gov.ph')}
        />
        <LinkRow
          title="Land Transportation Office"
          subtitle="lto.gov.ph"
          onPress={() => void WebBrowser.openBrowserAsync('https://lto.gov.ph')}
        />
        <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 17 }}>
          Not affiliated with the LTO. Renewal windows follow the plate schedule published by the LTO and are
          provided for planning only.
        </Text>
      </Card>
    </Screen>
  );
}
